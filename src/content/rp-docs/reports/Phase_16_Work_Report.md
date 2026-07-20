---
title: "Phase 16 Work Report - Steam Lobby UX Completion"
description: "Phase 16 Work Report - Steam Lobby UX Completion의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "reports/Phase_16_Work_Report.md"
status: "Done"
documentType: "Work Report"
searchKeywords:
  - "Phase 16 Work Report - Steam Lobby UX Completion"
order: 36
---
---
Status: Done
Document Type: Work Report
Schema Version: 2
Phase: Phase 16
Last Updated: 2026-07-20
---

# Phase 16 Work Report - Steam Lobby UX Completion

## 1. Decision Brief

- Phase: Phase 16 - Steam Lobby UX Completion
- 작성일: 2026-07-14
- 최종 갱신: 2026-07-20 15:00 KST
- 상태: Done - 체크리스트 기준 Editor/PIE와 Windows Development 두 계정·두 기기 Steam 검증을 완료했고, Shipping Cook·Package·Launch smoke는 후속 콘텐츠 통합/릴리스 Gate로 소유자를 이관했다
- Base main: `4194b83`
- Phase 통합 브랜치: `phase/16`
- hardening: `f3653c3`, `phase/16` 통합 `2c7f4ca`
- 확장 작업 브랜치: `feat/phase16-late-join-observer` (`0e140ee` Kickoff, `d4c0629` 구현, `15b1ccd` phase 통합)
- 현재 코드 기준: `phase/16 @ 3ff2b1a`, 마지막 gameplay feature 통합 `15b1ccd`, 이후 로컬 작업 트리 변경
- 최신 자동 검증: 기존 Unity/Non-Unity와 closure smoke 통과. 신규 미션 결과 delta의 UE 5.8 preflight, RPEditor Development, RP Win64 Development/Shipping build, `RP.Mission.State.TerminalTransitions` 1/1과 정확한 `StartsWith:RP` 전체 RP Automation 20/20 통과
- Editor / PIE: Pass - 첫 PIE CommonUI ensure 미발생, 메뉴 입력, Debug HUD, Observer 순환·이탈·승격과 Development 미션 성공/실패 명령을 사용자 체크리스트에서 확인
- Steam / Packaging: Pass (Windows Development) - 동일 package 두 계정·두 기기에서 Create/Find/Join/Leave/Invite, Join 정책, Host disconnect와 실패 복구를 확인
- Shipping: N/A (Phase 16) - `RP Win64 Shipping` target compile과 Debug 기능 비노출은 확인했으며 전체 Cook·Stage·Package·Launch smoke는 후속 콘텐츠 통합/릴리스 Gate로 이관
- GPT Pro Web: 미요청 - 비차단
- Reference/Flow 기반: API Contract와 Feature Flow 분리, stale 검사기 direct 검증, local MkDocs strict build와 읽기 전용 Developer Docs Dashboard 배포 완료. 중앙 Closure Gate는 기존 `DefaultGame.ini` EOF diff로 build 전에 차단됐으며 Phase 16 기능/문서 결함과 분리해 기록
- 현재 차단 요소: Phase 16 제품 완료 차단 없음. 전체 Shipping Cook·Stage·Package·Launch와 실제 레벨 왕복/다음 미션 E2E는 각각 후속 릴리스 Gate와 `ACT-19-003`이 소유한다
- 다음 행동: Phase 17 Kickoff에서 Bureau Room Blockout 범위와 Phase 15 이관 Door/Portal 후보를 다시 결정한다. Git 통합·push는 별도 승인으로 유지한다.

판정:

```text
코드 구현, hardening 통합, Late Join Observer 확장과 Phase 16 체크리스트의 Editor/PIE/Windows Development Steam 검증을 완료했다.
사용자 Done 승인에 따라 Phase 16을 공식 완료하고 Shipping Cook·Package·Launch smoke는 후속 콘텐츠 통합/릴리스 Gate로 이관한다.
Work Report, Phase 문서, Roadmap Milestone과 CODEX_INDEX를 같은 Done 판정으로 동기화했다.
Late Join feature commit/phase 통합은 로컬에서 완료했으며 원격 push는 하지 않았다.
phase/16 -> main 병합과 origin/main push는 각각 사용자 별도 승인 전 수행하지 않는다.
```

## 2. Capability Delta

### Session 구조와 안정적인 방 식별

- public facade를 유지하면서 Session private 구현을 책임별로 나눴다.
- `RP_PHASE16_SESSION_V4`, `SearchGeneration + RoomId`, expected RoomId travel pinning으로 검색 결과와 실제 Lobby instance를 구분한다.

### Provider timeout·revision·callback 안전성

- provider 완료와 실제 ClientTravel/PostLoadMap 완료를 분리하고 timeout 뒤 callback은 정리만 수행한다.
- Host OFF는 즉시 닫고 ON은 최신 provider snapshot 성공 뒤에만 유효하다. 상세 기록은 [PRR-016-001](../history/problems/Phase_16/PRR-016-001_Session_Async_Callback_Lifecycle.md)을 따른다.

### Room List와 Session Notice UX

- Waiting `BUREAU ROOM`, 미션 친화적 위치명, Observer 참가 안내를 RP 표시 데이터로 제공한다.
- 참가 가능한 방만 노출하고 nonblocking notice는 활성 화면 밖으로 넘어가지 않는다.

### Join·Host disconnect 복구

- Join Cancel, Host 종료, travel timeout, Room Instance mismatch를 한 Native 복구 경계에서 처리한다.
- 실패한 이전 Lobby 연결은 같은 Host의 새 Lobby로 재개되지 않아야 한다. 상세 기록은 [PRR-016-002](../history/problems/Phase_16/PRR-016-002_Join_Travel_Host_Disconnect_Recovery.md)를 따른다.

### Ready·Room Settings·공용 Control 책임

- Ready Panel은 Player/Ready 표시, Room Settings는 Host Late Join 정책과 Invite를 소유한다.
- HostMenu와 Room Settings는 같은 Selector 계약을 사용하고 Option/Button은 optional Root SizeBox를 제공한다.

### InGame Menu와 CommonUI 입력

- PlayerController가 메뉴 생성·Back·제거·입력 복구를 소유하고 `IMC_Player`의 Escape를 Open/Back에 공유한다.
- Menu 모드에서만 WASD를 UI navigation으로 변환한다.

### Development Debug HUD

- 기존 상시 표시 Debug HUD를 `Hidden / Status / UserManagement` 세 상태로 분리하고 상단 숫자열 `0`과 `9`로 전환한다.
- Status는 읽기 전용이고 User Management의 Ready/Mission 버튼은 Listen Host만 사용할 수 있다. Client와 Observer 권위 경계, 제품 modal 입력과 Shipping 제외를 유지한다.

### Development Mission Outcome Commands

- `RPDevForceMissionSuccess`와 `RPDevForceMissionFailure`로 실행 중인 미션의 terminal 결과를 MissionDirector 서버 권위 경로에서 재현한다.
- 기존 `RPForceCompleteMission`은 성공 호환 별칭으로 유지한다. `Failed`는 실패 처리와 Bureau 복귀가 끝난 결과만 뜻하며 실패 판정·정산·연출·실제 travel은 만들지 않는다.

### API Reference 기반

- 현재 계약은 API Contract, 시스템 순서는 Feature Flow, 변경 이력은 Work Report가 소유한다.
- [Reference Index](../reference/index.md)와 stale 검사기, 로컬 MkDocs strict build 근거를 마련했다.
- 별도 Developer Docs 홈은 Project Manager Roadmap, Work Report 검증과 RP Git 커밋 이력을 배포 시점의 읽기 전용 스냅샷으로 보여주며 원본 편집 권한은 Obsidian과 Markdown에 남긴다.

<details>
<summary>구현 세부 항목 펼치기</summary>

### Session 내부 구조

- `URPSessionSubsystem` public facade를 유지했다.
- private 구현을 ProviderPolicy, CreateFind, JoinLeave, ActionState, FailureRecovery, SteamInvite, Diagnostics로 분리했다.
- 새 Subsystem/UObject/Manager와 Build.cs 의존성을 추가하지 않았다.

### Metadata / Join Policy

- schema를 `RP_PHASE16_SESSION_V4`로 올리고 `RP_LOCATION_DISPLAY_NAME`, `RP_ALLOW_JOIN_DURING_MISSION` 및 선택 RoomId travel pinning 계약을 적용했다.
- Waiting의 실제 engine joinable은 항상 true, InProgress는 Host 설정을 따른다.
- `bAllowJoinDuringMission` 기본값은 false다. 사용되지 않던 Create 옵션의 legacy `bAllowJoinInProgress`는 제거하고 엔진 내부 joinable 값만 RoomState와 Host 정책에서 자동 산출한다.
- `FRPRoomJoinRequest(SearchGeneration + RoomId)`를 제품 Join 계약으로 추가했다.
- `FRPLobbySearchResult`에 친화적 위치, Host 정책, `bWillJoinAsObserver`를 추가했다.
- Version mismatch/Full/identity를 우선하고 InProgress OFF는 차단, ON은 Observer Join으로 판정한다.
- revision 기반 hosted update가 RoomState/위치/토글 동시 요청을 coalescing한다.
- OFF는 PreLogin에 즉시, ON은 provider 성공 뒤에만 유효하다.
- 시작은 metadata 뒤 `StartSession`, 성공은 `EndSession` 뒤 Waiting/Bureau metadata 순서를 사용한다.

### Late Join Observer

- `ARPPlayerState`에 `ERPPlayerParticipationState::Active/LateJoinObserver`를 ReplicatedUsing으로 추가했다.
- Observer 전환은 Ready=false를 강제하고 Ready=true 요청을 거절한다.
- GameState 서버 mission commit delegate를 GameMode가 구독하고 PlayerController의 직접 session marking을 제거했다.
- `PreLogin`과 `HandleStartingNewPlayer`가 실제 active phase와 effective Host 정책을 각각 재검증한다.
- Observer는 일반 `ARPCharacter` 없이 활성 팀원 Pawn에 고정 관전하고 이동·자유시점을 잠근다. LMB/RMB는 서버가 검증한 Active Pawn 사이의 다음/이전 고정 관전 대상 순환에만 사용한다.
- 대상 Player logout 시 다른 Active Pawn으로 다시 고정한다.
- `Succeeded` 또는 `Failed` terminal에서 Active 승격, spectator/input 해제, Pawn spawn, Ready=false를 적용한다.


### Action State / Recovery

- Create/Find/Join/Leave/Invite typed Pending/Succeeded/Failed state를 추가했다.
- 단일 active operation, Busy 재입력 거절, Create/Find 10초, Join 15/30초, Leave 5초 timeout을 적용했다.
- provider Join callback과 ClientTravel 완료를 분리했다.
- Network/Travel/Host disconnect를 GameInstance 수명에서 처리한다.
- Host disconnect/Join travel failure 시 local session cleanup -> Title -> persistent blocking notice 흐름으로 보강했다. 정상 Leave의 Multiplayer menu 복귀는 분리해 유지한다.
- terminal Join 실패와 travel timeout은 현재 GameInstance의 `PendingNetGame`을 명시적으로 취소해, 같은 Steam Host가 방을 다시 열었을 때 이전 연결이 자동 재개되지 않게 한다.
- ClientTravel URL에 선택 당시 `RoomId`를 넣고 Host `PreLogin`에서 현재 Lobby ID와 비교한다. 이전 Lobby 접속이 같은 Host endpoint의 새 Lobby로 이어지는 경합은 `RP_ROOM_INSTANCE_CHANGED`로 거절한다.
- `CancelJoinRoom`은 provider callback/stale cleanup/ClientTravel을 하나의 Native 취소 경로로 처리하며, 늦은 provider callback은 cleanup만 수행하고 travel하지 않는다.

### Steam Invite

- Waiting Host의 `ShowInviteOverlay` 경계를 추가했다.
- invite accepted와 Steam 친구 메뉴 Join Game을 같은 RP V4 mapping/stable Join으로 보낸다.
- 첫 local world/PlayerController 준비 전 invite result를 일시 보관한다.
- Busy/AlreadyInRoom에서는 자동 Leave하지 않는다.

### UI Contract

- `URPRoomListItemBase`가 방 이름/Host/인원/Map/Ping/Waiting-InProgress/호환성/Join block을 표시한다.
- stable Join event와 legacy index event를 함께 제공하되 신규 WBP는 stable event를 사용한다.
- `URPSessionNoticeWidgetBase`와 `FRPSessionNoticeViewData`를 추가했다.
- Pending/Success/NoRooms/Error/BlockingError와 Join 전용 `ModalPending` tone을 구분한다.
- `ModalPending`은 `CONNECTING...` 중앙 모달, Throbber, Native `CancelJoinButton` 계약을 제공하며 ESC/게임패드 Back도 JoinMenu에서 같은 취소 API를 호출한다.
- `URPJoinMenuScreenBase`가 화면 활성 시 Find를 시작·소유하고 진행 중 Deactivate/Back에서 `CancelFindRooms`를 호출한다.
- Find 취소는 provider delegate/timeout/cache/action message를 함께 비워 늦은 완료 문구가 다음 메뉴로 전달되지 않으며, 검색 완료 안내는 현재 JoinMenu에서 5초 유지한다.
- `URPReadyPanelBase`에서 Invite API/binding을 제거해 월드 표시 전용 계약을 복원했다.
- `URPRoomSettingsWidgetBase`의 optional `InviteButton`이 Host 표시, session operation Pending 잠금과 SessionSubsystem 호출을 자동 연결한다.
- Room `MapText`는 친화적 위치명을 우선하고 InProgress ON은 `JOIN AS OBSERVER · NEXT MISSION`으로 Join을 유지한다.
- Ready Row는 Observer를 `WAITING NEXT MISSION`으로 표시하고 Ready 집계에서 제외한다.
- `URPRoomSettingsWidgetBase`가 `AllowJoinDuringMissionSelector`, `RoomSettingsStatusText`를 pending 잠금과 연결한다.
- `URPLateJoinObserverOverlayNative`가 WBP 없이도 `SPECTATING · ACTIVE NEXT MISSION`을 표시한다.
- `.uasset/.umap`은 Codex가 수정하지 않았다.

</details>

## 3. 구조·권위 계약

- `URPSessionSubsystem`은 유일한 public session facade이며 provider metadata를 gameplay 원본으로 사용하지 않는다.
- Ready 원본은 PlayerState, Mission 원본은 MissionDirector/GameState가 소유하고 GameMode가 session mirror와 Observer side effect를 조정한다.
- `PreLogin`과 `HandleStartingNewPlayer`는 metadata가 아니라 서버의 실제 MissionPhase와 effective Host 정책을 재검증한다.
- 승인 범위인 participation `ReplicatedUsing`만 추가하고 Session UX action state는 네트워크 복제하지 않는다.
- UI는 Steam/raw OnlineSubsystem 타입을 직접 소비하지 않고 RP 표시 데이터와 검증된 Session API만 사용한다.
- 새 Build.cs/Target/Plugin, 전역 Manager, Host Migration, Dedicated Server, EOS/Stove를 추가하지 않았다.
- 실제 TargetMap 이동과 레벨 스트리밍은 Phase 17 이후이며 Observer는 사망·부활·보상 시스템이 아니다.
- Session Notice가 제품 전역 알림 체계로 커지면 LocalPlayer UI state/view-model 분리를 재검토하되 현재는 Widget base 계약을 유지한다.
- `ERPMissionPhase::Failed`와 `ERPMissionDoorStatus::MissionFailed`는 기존 enum ordinal을 보존하도록 끝에 추가했다. `Failed`는 `bMissionSucceeded=false`인 terminal 결과이고 직접 GameState를 덮지 않고 MissionDirector가 커밋한다.

## 4. 주요 문제와 해결

> 시각은 KST(UTC+9) 기준이다. 커밋된 항목은 실제 변경 커밋 시각, 아직 커밋되지 않은 로컬 보강은 관련 소스 반영 또는 마지막 성공 검증 시각을 기록한다.
>
> 각 카드는 비개발 직군도 결과를 먼저 이해할 수 있도록 `영향 -> 원인 -> 해결 -> 핵심 계약 링크 -> 반영·검증 -> 잔여 검증` 순서로 기록한다.

### Session 구조와 stable identity

- **영향:** 큰 Session 구현과 index 기반 Join은 변경 충돌과 잘못된 방 참가 위험을 만들었다.
- **원인:** 물리 구현 구조와 화면 순서가 실제 세션 정체성 역할까지 맡고 있었다.
- **해결:** public facade 뒤 구현을 분리하고 `SearchGeneration + RoomId`를 제품 Join 계약으로 고정했다.
- **핵심 계약 링크:** [Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md)
- **반영·검증:** commits `1d02b67`, `b85794c`; 관련 Automation 통과. 2026-07-20 사용자 체크리스트에서 Refresh 뒤 이전 선택 초기화와 동일 Development package의 stable Join을 확인했다.
- **잔여 검증:** Phase 16 범위 없음.

### Provider callback과 화면 수명주기

- **영향:** timeout이나 화면 이탈 뒤 늦은 callback이 성공·travel·notice를 다시 만들 수 있었다.
- **원인:** provider, travel, typed state, 활성 화면의 완료 시점을 하나로 취급했다.
- **해결:** 단계별 완료, late cleanup, revision coalescing, 화면 소유 Find 취소로 분리했다.
- **핵심 계약 링크:** [PRR-016-001](../history/problems/Phase_16/PRR-016-001_Session_Async_Callback_Lifecycle.md)
- **반영·검증:** commits `c35401c`, `f3653c3`, `d4c0629`; 최신 전체 RP Automation 20/20. 2026-07-20 사용자 체크리스트에서 timeout/Busy 정리, Host ON/OFF, JoinMenu pending Back과 late callback 차단을 확인했다.
- **잔여 검증:** Phase 16 범위 없음.

### Room List와 Notice 표현

- **영향:** 참가 불가능 방의 노출 정책과 메뉴 간 메시지 수명이 일관되지 않았다.
- **원인:** provider 검색 특성과 GameInstance action history를 화면 표현 정책과 분리하지 못했다.
- **해결:** 참가 가능한 방만 노출하고 활성 화면만 nonblocking notice를 소비하도록 했다.
- **핵심 계약 링크:** [UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** `RP.Session.UIContracts` 자동 계약 통과. 2026-07-20까지 실제 WBP tone, auto-dismiss, 확인 버튼과 메뉴 전환 시 transient notice 제거를 사용자 체크리스트에서 확인했다.
- **잔여 검증:** Phase 16 범위 없음.

### Join·Host disconnect·Room Instance 복구

- **영향:** Join 중 Host 종료가 검은 화면, 자동 재접속, mismatch 거절 뒤 crash로 이어질 수 있었다.
- **원인:** Engine pending connection과 RP failure return이 같은 수명주기를 동시에 정리했다.
- **해결:** expected RoomId fail-closed 검증, Title failure return, 다음 Tick 후처리로 UE 정리와 RP 후처리를 분리했다.
- **핵심 계약 링크:** [PRR-016-002](../history/problems/Phase_16/PRR-016-002_Join_Travel_Host_Disconnect_Recovery.md)
- **반영·검증:** Room Instance 거절 확인, crash 보강 뒤 Automation 통과. 2026-07-20 동일 Development package에서 프로세스 유지, Title 팝업, 자동 재접속 차단과 명시적 재Join을 사용자 체크리스트에서 확인했다.
- **잔여 검증:** Phase 16 범위 없음.

### Ready·Room Settings·공용 UI 책임

- **영향:** Ready 현황판에 Invite가 섞이고 같은 Host 설정이 서로 다른 조작 UI를 요구했다.
- **원인:** 화면의 실제 용도보다 재사용 가능한 위치와 boolean 데이터 형식을 먼저 기준으로 삼았다.
- **해결:** 방 관리는 Room Settings, Ready 표시는 Ready Panel로 분리하고 HostMenu와 같은 Selector를 사용했다.
- **핵심 계약 링크:** [UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md), [UI Controls API](../reference/ui/UI_Controls_API.md)
- **반영·검증:** 최신 UI contract/Option/Button Automation을 포함한 전체 RP Automation 20/20. 사용자 WBP binding, Selector 크기, Host Create ON 초기 표시와 pending 복구를 2026-07-20 체크리스트에서 확인했다.
- **잔여 검증:** 공용 Button Root의 추가 아트 규격 튜닝은 기능 Gate가 아닌 후속 UI polish다.

### InGame Menu 입력 수명주기

- **영향:** 메뉴 열기·Back·WASD와 gameplay 입력 복구가 BP와 C++에 나뉘어 ESC 경합이 생길 수 있었다.
- **원인:** 화면과 Mapping Context마다 입력 수명주기를 따로 소유했다.
- **해결:** PlayerController/CommonUI/LocalPlayerSubsystem으로 Native 소유자를 정하고 같은 프레임 재오픈을 차단했다.
- **핵심 계약 링크:** [In-Game Menu Navigation](../reference/flows/InGame_Menu_Navigation.md)
- **반영·검증:** `RP.UI.Input.MenuContracts`, `RP.UI.Input.NavigationPolicy` 통과. Editor 에셋 지정, 기존 BP 수명주기 제거와 PIE ESC/Back/WASD·입력 복구를 2026-07-20 체크리스트에서 확인했다.
- **잔여 검증:** Phase 16 범위 없음.

### API Reference와 문서 stale 방지

- **영향:** 현재 계약, 기능 흐름, 변경 이력이 섞이면 다른 직군은 찾기 어렵고 개발자는 오래된 경로를 사실로 오인할 수 있었다.
- **원인:** 문서 책임과 source/link 검사가 분리되지 않았다.
- **해결:** API Contract/Feature Flow/Work Report를 나누고 Reference direct 검사와 strict site build를 도입했다.
- **핵심 계약 링크:** [Reference Index](../reference/index.md)
- **반영·검증:** 2026-07-19 04:51 KST direct validator와 MkDocs strict 성공.
- **잔여 검증:** 중앙 Docs CheckOnly의 기존 Config EOF 차단 해소 뒤 재실행.

<details>
<summary>기존 4.1~4.24 문제 카드 펼치기</summary>

> 아래 카드의 `잔여 검증`은 각 수정 시점에 기록한 역사 상태다. 현재 사용자 수동 검증 판정은 2026-07-20 체크리스트와 이 보고서의 최신 Snapshot을 우선한다.

### 4.1 대형 Session cpp와 기능 변경 충돌 위험

- **영향:** 1,171줄짜리 Session 구현에 Phase 16 기능을 바로 더하면 callback/delegate 수정이 한 파일에 겹쳐, 기능 변경끼리 충돌하거나 회귀 원인을 찾기 어려워질 수 있었다.
- **원인:** 세션 생성·검색·참가·복구 책임이 하나의 큰 cpp에 물리적으로 모여 있었다.
- **해결:** 기능 동작을 바꾸지 않는 layout branch를 먼저 만들고 private 구현 파일로 책임을 분리했다. 외부에서 사용하는 public facade와 Blueprint API는 그대로 유지했다.
- **핵심 계약 링크:** [Delegates To: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md), [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md)
- **반영·검증:** 2026-07-13 14:53 KST, commit `1d02b67`. 동작 불변 분리와 public facade/Blueprint API 유지 상태를 확인했다.
- **잔여 검증:** 이 구조 분리 자체의 잔여 항목은 없다. 이후 세션 기능은 같은 public facade 경계를 유지해야 한다.

### 4.2 Index selection의 stale Join 위험

- **영향:** 사용자가 방을 고른 뒤 목록을 Refresh하면 같은 화면 index가 다른 방을 가리켜, 선택하지 않은 방으로 참가할 수 있었다.
- **원인:** 화면 순서에 따라 바뀌는 index만으로 Join 대상을 식별하면 검색 결과 세대가 바뀐 사실을 구분할 수 없다.
- **해결:** Find generation과 stable `RoomId`를 함께 재검증해, 선택 당시 결과와 현재 결과가 모두 같은 방일 때만 Join을 계속한다.
- **핵심 계약 링크:** [Input Type: Online Types Reference](../reference/Online_Types_Reference.md), [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md)
- **반영·검증:** 2026-07-13 15:08 KST, commit `b85794c`. 관련 Automation을 통과했다.
- **잔여 검증:** 실제 `WBP_RPJoinMenu`에서 Refresh 뒤 이전 선택이 초기화되고 다른 방으로 잘못 참가하지 않는지 사용자 검증이 남아 있다.

### 4.3 Provider callback 성공과 travel 성공 혼동

- **영향:** Steam provider가 Join callback을 성공으로 반환한 직후 UI가 참가 완료로 표시해도, 실제 ClientTravel과 맵 로드는 아직 실패할 수 있었다.
- **원인:** provider 참가 승인과 실제 게임 월드 도착을 하나의 성공 시점으로 취급했다.
- **해결:** typed action state는 travel 동안 `Pending`을 유지하고 `PostLoadMap`에서 최종 성공으로 전환한다. 기존 legacy event 시점은 Blueprint 호환을 위해 유지했다.
- **핵심 계약 링크:** [Completion Event: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md), [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md)
- **반영·검증:** 2026-07-13 15:32 KST, commit `c35401c`. 로컬 코드 검증을 완료했다.
- **잔여 검증:** 실제 두 기기 Steam 환경에서 provider 성공 뒤 ClientTravel과 최종 도착 성공/실패 표시를 확인해야 한다.

### 4.4 No Rooms 표시 tone

- **영향:** 검색 자체는 정상 종료됐지만 방이 없는 경우, 상태값만 보면 성공 스타일로 표시되어 사용자에게 잘못된 의미를 전달할 수 있었다.
- **원인:** 실제 결과는 `Succeeded + NoRoomsFound`인데 Notice가 `Status`를 `Reason`보다 먼저 해석했다.
- **해결:** Notice view mapping이 `Reason`을 먼저 확인해 `NoRoomsFound`를 실패가 아닌 Information tone으로 표시하도록 했다.
- **핵심 계약 링크:** [Input Type: Online Types Reference](../reference/Online_Types_Reference.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-13 16:01 KST, commit `e3d4393`. `RP.Session.UIContracts` Automation으로 분류 계약을 고정했다.
- **잔여 검증:** 자동 계약 외 별도 코드 잔여는 없다. 최종 WBP 색상·문구의 시각 확인은 전체 Session Notice Editor 검증에 포함한다.

### 4.5 Blocking notice 확인 뒤 재표시

- **영향:** 사용자가 차단 팝업을 확인해 닫아도 같은 실패가 일반 Error notice로 다시 나타날 수 있었다.
- **원인:** persistent notice만 삭제되고 진단용 action history가 남아, UI mapping이 같은 상태를 새 notice로 다시 해석했다.
- **해결:** 확인 시 persistent copy를 지우고 notice refresh를 broadcast한다. action history는 진단용으로 유지하되 persistent blocking notice가 없으면 UI mapping은 `Hidden`을 반환한다.
- **핵심 계약 링크:** [Completion Event: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-14 01:25 KST, commit `f3653c3`. `RP.Session.UIContracts` Automation으로 확인 후 숨김 계약을 고정했다.
- **잔여 검증:** 실제 WBP 확인 버튼을 눌렀을 때 팝업이 닫히고 화면 이동 뒤 다시 표시되지 않는지 Editor 검증이 남아 있다.

### 4.6 Hosted metadata/StartSession 경고의 typed notice 누락

- **영향:** 방 상태 metadata 갱신이나 `StartSession`이 실패해도 typed Session Notice가 경고를 받지 못해 Host가 문제를 알 수 없었다.
- **원인:** 해당 실패가 legacy 문자열 이벤트로만 전달되고 typed operation/reason 계약에 포함되지 않았다.
- **해결:** `ERPSessionOperation::HostedState`와 blocking typed warning을 추가하고, 기존 legacy event는 호환용으로 유지했다.
- **핵심 계약 링크:** [Input Type: Online Types Reference](../reference/Online_Types_Reference.md), [Completion Event: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-14 01:25 KST, commit `f3653c3`. `RP.Session.Recovery` Automation으로 typed 경고 계약을 고정했다.
- **잔여 검증:** 실제 Steam provider에서 hosted metadata 또는 `StartSession` 실패를 재현해 blocking notice를 확인해야 한다.

### 4.7 Create/Join timeout 뒤 늦은 provider callback

- **영향:** UI에는 timeout이 표시됐는데 늦게 도착한 provider callback이 세션을 남기거나 뒤늦게 성공/travel을 시작할 수 있었다.
- **원인:** timeout 시점과 provider 비동기 완료 시점이 달라, terminal UI 상태만 닫고 callback 결과를 회수하지 않으면 내부 작업이 계속 살아 있었다.
- **해결:** Create/Join callback은 timeout 뒤에도 회수한다. recovery 중 새 action은 `Busy`로 차단하고 late completion에서 local session을 정리하며, timeout UI 완료는 한 번만 발행한다.
- **핵심 계약 링크:** [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [State Owner: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-14 01:25 KST, commit `f3653c3`. callback 유지/recovery policy Automation과 UE 5.8 Unity/Non-Unity build를 통과했다.
- **잔여 검증:** 실제 Steam timeout 직후 즉시 재시도했을 때 `Busy`/정리 순서와 orphan session 부재를 확인해야 한다.

### 4.8 Host 정책 ON/OFF와 stale provider callback 경합

- **영향:** Host가 ON 요청 직후 OFF로 바꿨는데 오래된 ON callback이 늦게 도착하면 미션 중 참가가 다시 열릴 수 있었다.
- **원인:** provider callback의 도착 순서가 사용자의 최신 설정 순서와 같다는 보장이 없었다.
- **해결:** OFF는 desired 변경 즉시 `effective=false`로 닫는다. ON은 현재 desired와 동일한 provider snapshot이 성공했을 때만 `effective=true`로 열며, revision이 다르면 최신 스냅샷을 다시 보낸다.
- **핵심 계약 링크:** [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md), [State Owner: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-14 01:59 KST, commit `d4c0629`. `RP.Session.HostedPolicy` Automation과 Unity/Non-Unity build를 통과했다.
- **잔여 검증:** 실제 Steam에서 설정을 빠르게 연타하고 provider 실패를 발생시켜 최신 OFF가 계속 fail-closed로 유지되는지 확인해야 한다.

### 4.9 Mission 시작 호출 경로 중복

- **영향:** 일반 시작, debug 시작, 완료 경로마다 session mirror 갱신이 달라져 RoomState와 실제 MissionState가 어긋날 수 있었다.
- **원인:** PlayerController가 MissionDirector 성공 뒤 session을 직접 갱신해, 미션 상태 원본과 별도의 호출 경로가 생겼다.
- **해결:** `GameState server commit delegate -> GameMode bridge` 한 경로에서 시작/완료 session mirror와 Observer 승격을 함께 처리한다.
- **핵심 계약 링크:** [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md), [Delegates To: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-14 01:59 KST, commit `d4c0629`. Mission Selection 3/3과 Phase 11 closure smoke를 통과했다.
- **잔여 검증:** PIE 2 Players / Listen Server에서 시작·완료 RoomState mirror와 Observer 승격을 함께 확인해야 한다.

### 4.10 JoinMenu 참가 가능 방만 노출

- **영향:** InProgress OFF, Full, Version mismatch 방을 비활성 Row로 보여줄지 검색 목록에서 숨길지 UI 정책이 불명확했다.
- **원인:** UE Steam Lobby는 `bAllowJoinInProgress=false` 또는 정원이 가득 찬 경우 `SetLobbyJoinable(false)`를 적용하고, Steam `RequestLobbyList()`는 joinable Lobby만 반환한다. 따라서 InProgress OFF 방은 새 검색에서 disabled Row가 아니라 방 자체가 보이지 않는다.
- **해결:** 제품 JoinMenu에는 참가 가능한 Waiting/Observer ON 방만 노출한다. Provider가 결과를 반환해도 RP 검색 캐시에서 InProgress OFF, Full, Version mismatch, invalid room을 다시 제거한다. 초대·오래된 결과·provider 경합으로 차단 대상이 직접 전달되면 typed 사유와 `PreLogin`으로 거절한다. `MISSION IN PROGRESS`/`ROOM FULL`/`VERSION MISMATCH` 문구는 방어 계약과 Automation에만 남긴다.
- **핵심 계약 링크:** [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [Input Type: Online Types Reference](../reference/Online_Types_Reference.md)
- **반영·검증:** 2026-07-14 05:18 KST, 로컬 작업 트리 미커밋. `RP.Session.JoinPolicy`에 목록 필터 정책을 추가했다.
- **잔여 검증:** 실제 Steam은 차단 Row 문구가 아니라 `Refresh 뒤 미노출 + Invite/Join Game/직접 참가 거절` 기준으로 확인해야 한다.

### 4.11 Transient Session Notice의 메뉴 간 재표시

- **영향:** JoinMenu의 `NO ROOMS FOUND` 같은 비차단 메시지가 Host/Multiplayer 메뉴로 이동한 뒤에도 다시 보이고 다음 session action까지 남았다.
- **원인:** GameInstance 수명의 `CurrentSessionActionState`는 진단 history를 유지하고, 여러 화면의 Notice Widget이 미리 Construct된 채 같은 delegate를 받았다. Construct 시 복원 필터만으로는 비활성 화면이 실시간 event를 저장하는 일을 막지 못했다.
- **해결:** Native base가 바깥 `UCommonActivatableWidget`의 Activate/Deactivate를 자동 추적한다. 비활성 화면은 nonblocking event를 무시하고 Deactivate 시 즉시 clear한다. 새 활성 화면은 확인 전 `BlockingError`만 복원하며, 현재 화면의 Success/Information/일반 Error는 5초 뒤 자동으로 닫는다.
- **핵심 계약 링크:** [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md), [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md)
- **반영·검증:** 2026-07-14 10:14 KST, 로컬 작업 트리 미커밋. `RP.Session.UIContracts`에 nonblocking 미복원, Blocking 복원, Tone별 auto-dismiss 정책을 고정했다.
- **잔여 검증:** 실제 CommonUI Activate/Deactivate 메뉴 전환에서 비차단 메시지가 다른 화면으로 넘어가지 않는지 Editor 재검증이 남아 있다.

### 4.12 JoinMenu 이탈 뒤 지연 Find 완료

- **영향:** JoinMenu에서 검색 중 빠르게 Back하면 검색이 계속 실행되고, 늦게 완료된 `NO ROOMS FOUND`가 이미 이동한 HostMenu에 표시됐다.
- **원인:** Notice Widget은 비활성화 때 표시만 지웠고, GameInstance 수명의 `URPSessionSubsystem::FindRooms` operation과 provider completion delegate는 계속 살아 있었다.
- **해결:** `URPJoinMenuScreenBase`가 활성 화면의 Find를 소유하고 Deactivate/Destruct에서 자신이 시작한 진행 중 검색만 취소한다. `CancelFindRooms`는 provider cancel 전에 completion delegate를 제거하고 timeout, search/cache, nonblocking action/message를 초기화한다. Notice Widget에는 operation 취소 책임을 넣지 않았다.
- **핵심 계약 링크:** [State Owner: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-14 10:51 KST, 로컬 Session 검증 완료, 미커밋. UI contract Automation과 UE 5.8 Session Iteration 결과는 아래 Local Verification에 기록했다.
- **잔여 검증:** `WBP_RPJoinMenu`를 새 base로 Reparent하고 진입 시 직접 `FindRooms` 호출을 제거해야 한다. Refresh는 `RefreshRooms`, 목록 조립은 기존 `OnRoomsUpdated`를 유지하며, Pending 중 Back과 완료 뒤 Back을 각각 Editor에서 재검증해야 한다.

### 4.13 Host disconnect와 Join 중 Host 종료의 복귀 경합

- **영향:** (1) 참가 완료 뒤 Host가 종료되면 Client는 TitleMenu로 돌아갔지만 `HOST DISCONNECTED` 팝업이 즉시 나오지 않고 나중에 Multiplayer menu에서 나타났다. (2) Join/ClientTravel 도중 Host가 종료되면 패키지 Client가 Title로 돌아가거나 입력 불가처럼 멈추는 결과가 경합했다.
- **원인:** Engine 기본 disconnect 처리와 `URPSessionSubsystem` failure delegate가 같은 프레임에 서로 다른 travel을 요청했다. Pending connection 실패는 `World == nullptr`일 수 있는데 기존 소유 판정도 이를 놓쳤다.
- **해결:** failure delegate 안에서 즉시 `OpenLevel`하지 않고 local cleanup과 화면 복귀를 분리했다. `PendingNetDriver`의 WorldContext로 null World 실패도 현재 GameInstance 소유인지 판별하고, 복귀 요청은 하나로 합친 뒤 `PostLoadMap`에서 목표 map 도착까지 교정한다.
- **핵심 계약 링크:** [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [State Owner: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-14 11:49 KST, 로컬 작업 트리 미커밋. UE 5.8 Session Iteration Unity build와 `RP.Session` 10/10(warnings 0)을 통과했다.
- **잔여 검증:** 동일 Windows Development Steam 패키지에서 `참가 완료 뒤 Host 종료`와 `Join 도중 Host 종료`를 각각 재검증해야 한다. 코드/Automation 통과를 패키지 복귀 UX 성공으로 승격하지 않는다.

### 4.14 실패 복귀 완료 뒤 Multiplayer map 검은 화면

- **영향:** 4.13 보강 뒤 패키지 Client는 Engine Title fallback과 `L_MultiplayerMenu_Dev` 로드까지 완료했지만, 메뉴가 생성되지 않아 검은 화면만 남았다.
- **원인:** 로그상 network failure, pending return, map travel 자체는 완료됐다. 그러나 제품 Frontend root를 만드는 world는 `L_RPTitleScreen`인데 개발용 `L_MultiplayerMenu_Dev`를 실패 최종 목적지로 강제해 현재 UI bootstrap 구조와 맞지 않았다.
- **해결:** 예기치 않은 Network/Travel/Host disconnect 전용 목적지 `DefaultFailureReturnMapName=/Game/RP/Maps/Menu/L_RPTitleScreen`을 추가했다. Engine이 Title을 먼저 load하면 `bFailureReturnTravelRequested`와 관계없이 완료로 인정해 같은 Title을 다시 열지 않는다. 명시적인 `LeaveRoom` 기본 목적지는 계속 Multiplayer menu다. 참가 완료 뒤 Host 종료는 `HostDisconnected`, Join travel 중 실패는 `NetworkFailure`/`TravelFailure` blocking notice를 유지한다.
- **핵심 계약 링크:** [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-14 12:33 KST, 로컬 작업 트리 미커밋. C++ Automation/Iteration 결과는 아래 Local Verification에 보존했다.
- **잔여 검증:** `WBP_RPTitleScreenMenu`에 `WBP_RPSessionNotice`를 배치하고, 동일 Steam 패키지의 두 실패 시나리오에서 Title 복귀 직후 중앙 팝업이 표시되는지 사용자 재검증이 필요하다.

### 4.15 실패한 Join이 새 Host 방에 자동 재접속

- **영향:** Client가 Join 중 Host 종료로 timeout을 받은 뒤 존재하지 않는 이전 Row Join도 실패했지만, Host가 같은 계정으로 새 방을 만들자 Client가 아무 입력 없이 자동 접속했다.
- **원인:** Join travel timeout은 RP action과 notice만 terminal failure로 끝내고 Engine `UPendingNetGame`을 취소하지 않았다. 실패 목적지가 이미 Title이면 corrective map travel도 생략되어, map browse가 pending connection을 우연히 정리하는 효과에도 의존할 수 없었다.
- **해결:** 모든 terminal Join 실패에서 현재 GameInstance 소유 pending net travel만 `GEngine->CancelPending`으로 닫는다. provider callback 자체가 timeout난 경우에는 Steam `JoinLobby` 완료 전에 named session을 먼저 파괴하지 않고 recovery barrier로 격리한 뒤, 늦은 callback에서 local session을 정리한다.
- **핵심 계약 링크:** [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [State Owner: Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-14 12:55 KST, 로컬 작업 트리 미커밋. Host 로그에서 03:44:23 기존 서버 종료 후 03:45:17 새 listen server 시작 직후, 새 Client Join 요청 없이 이전 Steam ID의 handshake/login이 도착한 사실을 확인했다. 첫 연결의 `PendingNetDriver`가 같은 Host Steam ID와 `:7777`을 계속 재시도한 상태였다. UE 5.8 incremental Unity build, 전체 RP Automation 13/13(`RP.Session` 10/10, warnings 0), `git diff --check`를 통과했다.
- **잔여 검증:** 동일 두 계정 Steam 패키지에서 `timeout -> stale Join 실패 -> Host 재생성` 뒤 자동 접속이 없는지 재검증해야 한다. 뒤의 2026-07-14 20:08 KST 보강에서 기록한 `RP_ROOM_INSTANCE_CHANGED`/PendingNetGame crash 회귀도 함께 확인해야 한다. Crash 근거는 `E:/Workspace/GameBulids/RP/Windows/RP/Saved/Crashes/UECC-Windows-C9FB6CD54EE7B15BE96F728B1D62E9F4_0000`이다.

### 4.16 Ready Panel에 섞인 Invite 조작 책임

- **영향:** DOOR ROOM의 Player/Ready/구역 상태만 보여줘야 하는 `WBP_RPBureauReadyPanel`에 Steam 친구 초대 조작이 섞여, 월드 현황판과 방 관리 화면의 책임이 흐려졌다.
- **원인:** Bureau 안에서 Host가 접근할 수 있는 기존 UI를 Invite 검증 진입점으로 재사용하면서 Ready 표시와 세션 방 관리 책임을 분리하지 않았다.
- **해결:** `URPReadyPanelBase`에서 Invite API/binding/click 처리를 제거하고 `URPRoomSettingsWidgetBase`로 옮겼다. Room Settings의 `InviteButton`은 Host에게만 보이고 session action Pending 동안 Native에서 잠기며 `URPSessionSubsystem::ShowInviteOverlay`만 호출한다.
- **핵심 계약 링크:** [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md), [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md)
- **반영·검증:** 2026-07-14 20:33 KST, 로컬 작업 트리 미커밋. C++/문서 패치와 UHT/대상 cpp 컴파일을 완료했다. `RP.Session.UIContracts`는 Ready Panel에 `InviteButton` property가 없고 Room Settings에 binding/API가 있는지 reflection으로 방어한다.
- **잔여 검증:** 당시 열린 Editor가 `UnrealEditor-RP.dll`을 점유해 최종 링크가 끝나지 않았으므로, 해당 Iteration의 링크/Automation 결과는 아래 Local Verification 상태를 그대로 따른다. 사용자 `WBP_RPRoomSettings`의 `InviteButton` 연결도 남아 있다.

### 4.17 HostMenu와 Room Settings의 Allow Join UI 불일치

- **영향:** HostMenu는 `RPSelector`로 OFF/ON을 고르는데 Room Settings는 별도 Toggle WBP를 요구해, 같은 설정에 서로 다른 조작 방식과 추가 Blueprint 제작이 필요했다.
- **원인:** 초기 Late Join 설계가 boolean이라는 데이터 형식만 보고 Toggle을 선택했고, 실제 HostMenu와 승인된 좌우 선택형 UI를 Native 계약에 다시 반영하지 않았다.
- **해결:** Room Settings binding을 `AllowJoinDuringMissionSelector`/`URPOptionSelectorBase`로 바꾸고 `OFF`/`ON` OptionId를 bool 요청으로 변환한다. Pending에는 `SetIsReadOnly(true)`로 잠그고, 성공·실패 callback에서는 실제 적용값을 `SetSelectedId(..., false)`로 복구해 재요청을 막는다. Editor Checklist 순서도 Room Settings UI 2.4 -> Invite 2.5로 교정했다.
- **핵심 계약 링크:** [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md), [Delegates To: UI Controls API](../reference/ui/UI_Controls_API.md), [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md)
- **반영·검증:** 2026-07-15 14:23 KST, 로컬 작업 트리 미커밋. 2026-07-15 14:27 KST Iteration에서 UHT와 `RPRoomSettingsWidgetBase.cpp`, `RPSessionUIContractAutomationTest.cpp`, `Module.RP.1.cpp` 컴파일까지 통과했다. `RP.Session.UIContracts`에는 legacy Toggle 제거와 새 Selector 타입 reflection 방어를 추가했다.
- **잔여 검증:** 열린 `UnrealEditor.exe`가 `UnrealEditor-RP.dll`을 점유해 최종 링크가 `LNK1104`로 중단됐고 Automation은 실행되지 않았다. 로그는 `Saved/Logs/Validation/20260715-142616-11016-bacb2a39-Iteration/Build-Unity.log`이다. Editor 종료 후 UE 5.8 Iteration/`RP.Session.UIContracts` 재실행과 사용자 `WBP_RPRoomSettings` Selector 연결 검증이 남아 있다.

### 4.18 공용 옵션 행 전체 크기 조절 경계 부재

- **영향:** `WBP_RPRoomSettings`에서 재사용하는 `RPSelector`의 전체 폭·높이를 공통 Config로 맞출 수 없어 WBP마다 Root SizeBox를 따로 조절해야 했다.
- **원인:** `URPOptionControlBase`는 오른쪽 값 영역용 `OptionValueSizeBox`만 제공했다. Phase 13의 `SetRow...` 호환 API도 값 영역 정렬에 맞춰졌고 행 전체 Root SizeBox 계약은 없었다.
- **해결:** `URPOptionControlBase`에 optional `OptionRootSizeBox`, `Set/ClearOptionRootWidthOverride`, `Set/ClearOptionRootHeightOverride`를 추가했다. `FRPOptionControlConfig`가 Root Width/Height opt-in을 소유하고 Apply/PreConstruct/Construct에서 동기화한다. 기존 `OptionValueSizeBox`와 deprecated `SetRowWidthOverride`/`SetRowHeightOverride` 의미는 유지하며, Root binding 또는 opt-in이 없는 기존 WBP는 영향받지 않는다.
- **핵심 계약 링크:** [State Owner: UI Controls API](../reference/ui/UI_Controls_API.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-18 09:16 KST, 로컬 작업 트리 미커밋. UE 5.8 incremental Unity RPEditor Development와 전체 RP Automation 14/14를 통과했다. `RP.UI.Options.ControlLayoutContract` 포함 failed 0, warnings 0이며 report는 `Saved/Automation/Pipeline/20260718-091954-49420-fb728b4d-core/index.json`이다.
- **잔여 검증:** 사용자 공용 `RPSelector` WBP에 `OptionRootSizeBox`를 연결하고 Editor에서 실제 폭·높이를 확인해야 한다.

### 4.19 공용 버튼 전체 크기 조절 경계 부재

- **영향:** `WBP_RPOptionButton`, Invite/Back/Action 버튼의 전체 폭·높이를 각 WBP Root SizeBox에서 반복 조절해야 해 규격을 일관되게 유지하기 어려웠다.
- **원인:** `URPButtonBase`는 Border/Label/Focus/Theme만 공통 처리하고 전체 Root 크기 계약은 제공하지 않았다.
- **해결:** optional `ButtonRootSizeBox`, `Set/ClearButtonRootWidthOverride`, `Set/ClearButtonRootHeightOverride`, `SynchronizeButtonWidgets`를 추가했다. 별도 버튼 Config struct가 없어 Focus 색상과 같은 class Details에 Width/Height opt-in을 둔다. 기본값은 모두 비활성이며 binding이 없는 기존 WBP와 Border/Label/Theme/클릭 계약에는 영향이 없다.
- **핵심 계약 링크:** [State Owner: UI Controls API](../reference/ui/UI_Controls_API.md)
- **반영·검증:** 2026-07-18 10:15 KST, 로컬 작업 트리 미커밋. UE 5.8 incremental Unity RPEditor Development와 전체 RP Automation 15/15를 통과했다. `RP.UI.Buttons.LayoutContract` 포함 failed 0, warnings 0이며 report는 `Saved/Automation/Pipeline/20260718-101547-50556-2f013830-core/index.json`이다.
- **잔여 검증:** 사용자 공용 버튼 WBP에 `ButtonRootSizeBox`를 연결하고 Editor에서 실제 크기 규격을 확인해야 한다.

### 4.20 인게임 메뉴 Raw Escape 제거 후 Native 입력 진입점 부재

- **영향:** Raw Escape 이벤트를 제거하고 Input Action 에셋을 만들어도 C++ PlayerController가 Action을 받지 않아 ESC로 인게임 메뉴를 열 수 없었다.
- **원인:** `ARPPlayerController`에 `IA_OpenInGameMenu`용 Enhanced Input binding이 없었다.
- **해결:** `OpenInGameMenuAction`을 `EditDefaultsOnly`로 추가하고 `SetupInputComponent()`에서 `ETriggerEvent::Started`에 바인딩했다. 당시 단계에서는 `On RP In Game Menu Open Requested` BlueprintImplementableEvent로 기존 BP 메뉴 열기를 호출했다. Mission Terminal 또는 다른 커서 UI가 입력을 소유하면 중복 Open을 무시하고, LateJoinObserver도 ESC 메뉴는 열 수 있게 했다. 이 카드는 메뉴 열기 진입점까지만 다뤘으며 전체 수명주기는 4.21에서 이어서 보강했다.
- **핵심 계약 링크:** [State Owner: UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md), [Feature Flow: In-Game Menu Navigation](../reference/flows/InGame_Menu_Navigation.md)
- **반영·검증:** 2026-07-18 18:35 KST, 로컬 작업 트리 미커밋. UE 5.8 preflight와 incremental Unity RPEditor Win64 Development가 `Result: Succeeded`, `RP.Mission.Selection.TerminalInput`이 `Result={Success}`로 통과했다. 표준 Iteration은 기존 사용자 변경 `Config/DefaultGame.ini`의 EOF 빈 줄을 `git diff --check`가 감지해 빌드 전에 중단됐고 해당 파일은 수정하지 않았다.
- **잔여 검증:** 이 단계의 BP 이벤트 기반 임시 경계는 4.21 Native 수명주기로 대체됐다. 최종 잔여는 4.21의 Editor 에셋 지정과 PIE ESC/Back 검증을 따른다.

### 4.21 인게임 메뉴/Back/WASD 입력 수명주기의 BP 잔존

- **영향:** 메뉴 열기만 Native로 들어오고 Create Widget, 입력 모드, 닫기, `IMC_UI` 추가/제거가 BP에 남아 화면마다 입력 수명주기가 달라질 수 있었다. 같은 Escape를 열기와 Back에 함께 쓰면 닫힌 메뉴가 같은 프레임에 다시 열릴 위험도 있었다.
- **원인:** 인게임 메뉴의 생성·활성화·Back·제거·입력 복구를 한 소유자가 관리하지 않았고, UI 전환 때마다 Mapping Context를 교체하는 구조가 남아 있었다.
- **해결:** `ARPPlayerController`가 `OpenInGameMenuLocal`, `CloseInGameMenuLocal`, `IsInGameMenuOpen`, `InGameMenuScreenClass`를 제공하고 메뉴 생성·CommonUI 활성화·Back delegate·제거·gameplay input config 복구를 소유한다. `On RP In Game Menu Open Requested`는 이관용 deprecated 이벤트로만 남긴다. `URPFrontendScreenBase`는 기본 Back Handler와 `Menu + NoCapture + IgnoreMove/Look` input config를 제공한다. `IA_UI_Back`과 `IA_OpenInGameMenu`는 항상 활성인 `IMC_Player`의 Escape를 공유하며 `IMC_UI`는 교체하지 않는다. `URPUIInputSubsystem`은 Menu 모드에서만 W/A/S/D를 Slate 방향키로 변환하고 Editable Text 또는 Ctrl/Alt/Cmd 조합은 소비하지 않는다. `LastInGameMenuCloseFrame`은 같은 프레임 재오픈을 막고, Observer의 기존 이동/시점 잠금은 메뉴 잠금 한 단계만 해제한 뒤 유지한다.
- **핵심 계약 링크:** [Feature Flow: In-Game Menu Navigation](../reference/flows/InGame_Menu_Navigation.md), [State Owner: UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md), [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md)
- **반영·검증:** 2026-07-18 19:27 KST, 로컬 작업 트리 미커밋. UE 5.8 preflight와 incremental Unity RPEditor Win64 Development가 `Result: Succeeded`로 완료됐다. `RP.UI.Input.MenuContracts`, `RP.UI.Input.NavigationPolicy` 2/2와 기존 `RP.Session.UIContracts`, `RP.Mission.Selection.TerminalInput`이 각각 `Result={Success}`로 통과했다.
- **잔여 검증:** 사용자 Editor에서 두 IA의 `IMC_Player` Escape 매핑, CommonUI InputData, `InGameMenuScreenClass`를 지정해야 한다. 기존 BP 메뉴 수명주기와 `IMC_UI` 그래프를 제거하고 PIE에서 ESC 열기, 하위 Back, 최상위 닫기, WASD, gameplay 입력 복구를 검증해야 한다.

### 4.22 API Reference 기반과 stale 문서 방지 계약 부재

- **영향:** 함수·변수 역할, 기능 흐름, 과거 수정 기록이 한 문서에 섞이고 UI 소스 이동 뒤 옛 경로가 Reference에 남아, 개발자 외 직군은 기능을 찾기 어렵고 개발자는 오래된 계약을 사실로 오인할 수 있었다.
- **원인:** 기존 Reference가 큰 파일 단위로 자라 API의 현재 계약, 사용자 목표별 흐름, 변경 이력을 분리하지 못했다. source path·canonical symbol·상대 링크를 자동으로 확인하는 문서 전용 검사도 없었다.
- **해결:** 현재 API는 응집된 API Contract, 여러 시스템의 순서는 Feature Flow, 변경 시각과 검증 이력은 Work Report가 소유하도록 분리했다. 통합 [Reference Index](../reference/index.md), [Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [In-Game Menu Navigation](../reference/flows/InGame_Menu_Navigation.md), [Late Join Observer](../reference/flows/Late_Join_Observer.md)를 진입점으로 두고 UI 계약은 Foundation/Input, Controls, Session Widgets로 나눴다. 기존 UI Reference와 Session UI Flow 문서는 오래된 링크를 보존하는 Redirect로 유지한다. `Tools/Docs/Validate_ReferenceDocs.ps1`은 metadata, source path, canonical symbol, 중복 소유, 상대 링크, MkDocs nav 경로를 검사한다.
- **핵심 계약 링크:** [Reference Index](../reference/index.md), [Session Subsystem API](../reference/Session_Subsystem_API_Reference.md), [Online Types API](../reference/Online_Types_Reference.md), [UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md), [UI Controls API](../reference/ui/UI_Controls_API.md), [UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-19 02:49 KST, 로컬 작업 트리 미커밋. `& .\Tools\Docs\Validate_ReferenceDocs.ps1`은 exit 0과 `Documents=10 CanonicalSymbols=47 RelativeLinks=47 MkDocsNavTargets=88`을 반환했다. 임시 fixture 7종(정상/무시 링크, missing source, bad symbol, duplicate canonical, broken link, missing metadata, bad nav)은 예상 exit 0/1로 모두 통과했다. `Tools/Docs/Validate_ReferenceDocs.ps1`과 `Tools/Build/Validate_RP.ps1`은 Windows PowerShell 5.1 parser를 통과했고, Docs/Tools 범위 `git diff --check`도 통과했다.
- **잔여 검증:** 중앙 `Validate_RP.ps1 -Mode Iteration -Scope Docs -CheckOnly`는 Reference 단계 전에 기존 사용자 변경 `Config/DefaultGame.ini:127: new blank line at EOF`를 `git diff --check`가 감지해 exit 1로 차단됐다. 해당 사용자 Config는 수정하지 않았다. 이후 로컬 `.venv-mkdocs` 설치 상태에서 2026-07-19 04:51 KST `mkdocs build --strict -f Docs/mkdocs.yml`이 성공했다. Reference 자체의 direct 검사와 fixture/strict site build는 완료됐으며 중앙 파이프라인 재실행은 기존 Config diff가 정리된 뒤 남는다.

### 4.23 월드 표시 패널의 CommonUI Back 등록

- **영향:** Editor를 다시 실행한 뒤 첫 PIE에서 `RPMissionSelectionPanelNative_0`가 부모 Activatable Widget 없이 `IA_UI_Back`을 등록하려 해 CommonUI ensure가 발생했다. 같은 부모를 쓰는 Door Status와 Bureau Ready Panel에도 잠재적으로 같은 문제가 있었다.
- **원인:** 인게임 메뉴 입력 이관에서 `URPFrontendScreenBase`의 기본 Back Handler를 켰지만, Activatable Stack 화면과 WidgetComponent 월드 표시 위젯이 같은 부모를 공유하는 예외를 분리하지 않았다.
- **해결:** 표시 전용 `URPMissionSelectionPanelBase`와 `URPReadyPanelBase` 생성자에서 `bIsBackHandler=false`를 적용했다. Join/InGame/Room Settings 같은 실제 메뉴는 공통 기본값 true를 유지한다.
- **핵심 계약 링크:** [State Owner: UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md)
- **반영·검증:** 2026-07-19 04:49 KST, 로컬 작업 트리 미커밋. UE 5.8 incremental Unity RPEditor Development 빌드와 `RP.UI.Input.MenuContracts`의 메뉴 true/월드 패널 false CDO 계약을 포함한 전체 RP Automation 17/17이 failed 0, warnings 0으로 통과했다. report는 `Saved/Automation/Pipeline/manual-20260719-044834-ui-selector-back/index.json`이다.
- **잔여 검증:** Editor 재시작 후 첫 PIE에서 기존 `does not have a parent activatable widget` ensure가 사라졌는지 확인해야 한다. Editor/PIE 결과는 아직 성공으로 승격하지 않았다.

### 4.24 Room Settings Selector의 실제값과 표시값 불일치

- **영향:** Host가 방 생성 시 `Allow Join During Mission=ON`을 선택해 실제 SessionSubsystem 상태와 상태 문구는 ON인데, 처음 연 Room Settings Selector만 Designer 기본값 OFF를 계속 표시했다.
- **원인:** `SetSelectedId(..., false)`가 재요청 방지를 위해 외부 changed delegate와 BP 표시 이벤트를 함께 억제했다. 내부 선택 인덱스는 ON으로 바뀌었지만 `WBP_RPSelector`의 rotator 텍스트 갱신 그래프가 실행되지 않았다.
- **해결:** `URPOptionSelectorBase`에서 표현 동기화와 외부 변경 방송을 분리했다. 유효한 `SetSelectedIndex/Id`는 동일값/무방송 복원에서도 기존 BP 표시 이벤트를 실행하고, `bBroadcast`는 외부 multicast만 제어한다. Room Settings를 열거나 provider 완료값을 복구해도 화면은 실제값으로 갱신되며 Host 정책 요청은 다시 발생하지 않는다.
- **핵심 계약 링크:** [Delegates To: UI Controls API](../reference/ui/UI_Controls_API.md), [UI Consumer: UI Session Widgets API](../reference/ui/UI_Session_Widgets_API.md), [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md)
- **반영·검증:** 2026-07-19 04:49 KST, 로컬 작업 트리 미커밋. `WBP_RPSelector`만 해당 BP 표시 이벤트를 구현하는 것을 확인했고, UE 5.8 incremental Unity 빌드와 전체 RP Automation 17/17이 통과했다. 검증 중 stale 전체 manifest를 15에서 17로 함께 교정했다.
- **잔여 검증:** Host Create ON 후 처음 연 Room Settings에서 Selector/상태 문구가 모두 ON인지, 화면 진입만으로 `UPDATING ROOM SETTING` 또는 provider 정책 변경이 다시 발생하지 않는지 PIE에서 확인해야 한다.

</details>

### 4.25 Roadmap·Work Report·문제 해결 이력의 책임 혼합

- **영향:** 일정, 현재 상태, 검증 근거, 긴 문제 해결 과정이 Work Report 한 파일에 계속 쌓여 현재 해야 할 일을 찾기 어렵고 같은 정보를 여러 문서에서 수동으로 맞춰야 했다.
- **원인:** Jira/Notion형 진행 관리 도구 없이 Phase 문서와 Work Report가 계획, 실시간 작업 상태, 인수인계, 장기 문제 기록을 모두 담당했다.
- **해결:** Obsidian Project Manager는 일정·상태·담당·의존성, Work Report v2는 최신 결과와 인수인계, PRR은 복잡한 근본 원인과 append-only Timeline을 소유한다. Phase 완료는 계속 Work Report와 `CODEX_INDEX`가 확정하고 Roadmap은 결과를 반영한다. PowerShell 문서 검사기가 세 문서 계약의 ID, metadata, 의존성, 링크를 함께 검사한다.
- **핵심 계약 링크:** [RP Project Roadmap](../roadmap/index.md), [Problem Resolution Records](../history/problems/index.md), [Documentation Workflow](../03_Documentation_Workflow.md)
- **반영·검증:** 2026-07-19 18:58 KST, 로컬 작업 트리 미커밋. Project 1개/Task 29개/PRR 2개/Work Report v2 1개의 direct 통합 검사, fixture 4/4, PowerShell parser, MkDocs strict build가 통과했다. Project Manager 플러그인을 안전하게 다시 로드한 뒤 `RP Project Roadmap`, 주 단위 Gantt, Phase 16 계층과 의존성 선이 Obsidian UI에 표시되는 것도 확인했다.
- **잔여 검증:** 잠정 작업을 실제로 드래그한 뒤 예상한 task Markdown만 변경되는지와 Obsidian 전체 재시작 후 상태가 유지되는지는 사용자 편집 상태를 건드리지 않기 위해 이번 자동 확인에서 제외했다.

### 4.26 두 기기 환경에서 Observer 대상 이탈 전환을 검증할 Active Player 부족

- **영향:** Host와 LateJoinObserver만 있는 두 기기 테스트에서는 Host 이탈이 세션 종료로 이어져, 현재 관전 대상이 나간 뒤 다른 Active Pawn으로 자동 전환되는 계약을 독립적으로 확인할 수 없었다. 기존 Observer는 수동 대상 순환도 차단해 여러 Active Pawn 사이의 선택 정책을 직접 확인할 수 없었다.
- **원인:** 제품 흐름은 실제 중간 참가만 제공했고, PIE에서 기존 Player를 Observer로 전환하는 검증 진입점과 Observer 전용 Enhanced Input Action이 없었다.
- **해결:** Listen Host 전용 `RPForceLateJoinObserver <PlayerId>`와 `RPPrintObserverTargets`를 추가해 3 Players PIE의 실제 PlayerController/Pawn으로 Observer 흐름을 구성한다. `IA_SpectateCycle` Axis1D는 LMB `+1`, RMB `-1`을 사용하고, Unreal의 ServerViewNext/Prev RPC 뒤 `ARPGameModeBase::CanSpectate`가 자신·다른 Observer·Pawn 없는 Player를 거절한다. 메뉴나 Terminal이 입력을 소유하면 클릭을 관전 전환으로 처리하지 않는다.
- **핵심 계약 링크:** [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md), [Input Contract: UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md), [Debug Command Reference](../guides/Debug_Command_Reference.md)
- **반영·검증:** 2026-07-19 21:07 KST, 로컬 작업 트리 미커밋. UE 5.8 incremental Unity RPEditor Development 빌드 성공. `RP.Session.LateJoinPolicy`의 대상 필터와 `RP.UI.Input.MenuContracts`의 Action 속성 방어를 포함한 전체 RP Automation 17/17이 failed 0, warnings 0으로 통과했다. report는 `Saved/Automation/Pipeline/manual-20260719-observer-cycle-final/index.json`이다.
- **잔여 검증:** 2026-07-20 사용자 체크리스트에서 `IA_SpectateCycle` 연결, 3 Players PIE의 LMB/RMB 순환, 비-Host 대상 `disconnect`, 남은 Active Pawn 자동 전환과 모달 UI 경합 방지를 확인했다. 두 계정·두 기기 Steam Late Join도 별도 제품 흐름으로 통과해 Phase 16 잔여 검증은 없다.

### 4.27 미션 터미널의 CommonUI Back 등록 ensure

- **영향:** 미션 터미널에서 E hold가 100%에 도달하는 시점 전후로 `RPMissionTerminalScreenNative_0`가 부모 Activatable Widget 없이 `IA_UI_Back`을 등록한다는 handled ensure가 발생했다. 선택 요청은 계속 작동할 수 있지만 Editor 중단과 잘못된 Back 계약이 남았다.
- **원인:** 4.23에서는 WidgetComponent 월드 패널만 예외로 분리했다. `URPMissionTerminalScreenBase`도 같은 `URPFrontendScreenBase`를 상속하지만, CommonUI Activatable Stack이 아니라 PlayerController가 `CreateWidget -> AddToPlayerScreen -> ActivateWidget`으로 직접 표시해 기본 `bIsBackHandler=true`를 사용할 수 없었다. 로그 호출 스택에는 미션 확정 함수가 없고 CommonUI Action Router tick만 있어 E hold 완료는 직접 원인이 아니라 바인딩 갱신 시점이었다.
- **해결:** `URPMissionTerminalScreenBase` 생성자에서 `bIsBackHandler=false`를 적용했다. 기존 `NativeOnKeyDown`의 Q/Escape/Gamepad B와 PlayerController close delegate는 유지해 터미널 자체 닫기 흐름은 바꾸지 않았다. `RP.UI.Input.MenuContracts`에 Terminal CDO가 전역 Back을 등록하지 않는다는 회귀 검사를 추가하고 API Contract의 Stack 밖 화면 경계를 확장했다.
- **핵심 계약 링크:** [Input Contract: UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md), [Feature Flow: In-Game Menu Navigation](../reference/flows/InGame_Menu_Navigation.md)
- **반영·검증:** 2026-07-20 03:15 KST, 로컬 작업 트리 미커밋. UE 5.8 preflight와 incremental Unity RPEditor Development 빌드가 `Result: Succeeded`로 완료됐다. `RP.UI.Input.MenuContracts` 1/1이 failed 0, warnings 0으로 통과했고 report는 `Saved/Automation/Pipeline/manual-20260720-mission-terminal-back/index.json`이다.
- **잔여 검증:** 2026-07-20 Editor 재시작 후 첫 PIE에서 E hold 확정, Q/Escape 닫기와 `does not have a parent activatable widget` ensure 미발생을 사용자 체크리스트에서 확인했다. Phase 16 잔여 검증은 없다.

### 4.28 실제 레벨 왕복 미구현 상태의 승격 검증 경계와 반복 Ready 비용

- **영향:** Phase 16에서 LateJoinObserver의 서버 승격은 확인했지만 실제 `Bureau -> Mission Level -> Bureau -> 다음 Mission` 콘텐츠 루프가 없어 마지막 E2E 문장을 그대로 두면 실행할 수 없는 검증이 Phase 완료를 계속 막는다. 또한 미션 선택 뒤 여러 PIE 창의 Active Player를 매번 수동 Ready 처리하는 비용이 반복됐다.
- **원인:** 현재 Phase는 TargetMap 이동·ServerTravel·레벨 스트리밍을 범위에서 제외했고, 제품 Ready 입력은 각 Client가 직접 요청하는 계약만 제공한다. 검증 편의를 위해 모든 Player를 임의 변경하는 제품 API는 두지 않았다.
- **해결:** Phase 16 완료 근거는 이미 확인한 `Mission Succeeded -> Active/Pawn/입력 복구/Ready=false`까지로 고정하고, 실제 Waiting/Bureau 귀환과 다음 미션 참가 E2E는 비차단 `ACT-19-003`으로 이관했다. 별도 개발 명령 `RPDevReadyAllAndStartMission`은 로컬 Listen Host/Standalone에서 Active Player만 서버 Ready로 만들고, 모두 성공한 뒤 기존 `URPSessionSubsystem::RequestStartMission` 제품 경로를 호출한다. LateJoinObserver·Client·Dedicated·Shipping은 제외한다.
- **핵심 계약 링크:** [Debug Command Reference](../guides/Debug_Command_Reference.md), [Feature Flow: Late Join Observer](../reference/flows/Late_Join_Observer.md), [Phase 16 Editor Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md), [RP Project Roadmap](../roadmap/index.md)
- **반영·검증:** 2026-07-20 03:48 KST, 로컬 작업 트리 미커밋. UE 5.8 incremental Unity RPEditor Development 빌드와 전체 RP Automation 18/18이 통과했다. 문서 통합 검사도 Reference 10/API canonical symbol 48/Project task 29/PRR 2/Work Report v2 1로 통과했다.
- **잔여 검증:** 2026-07-20 PIE 2 Players에서 `RPDevReadyAllAndStartMission`의 Active Ready 복제, Observer 제외, Host 성공과 Client 거절을 사용자 체크리스트에서 확인했다. 실제 레벨 귀환·다음 미션 E2E는 콘텐츠 루프 구현 뒤 `ACT-19-003`에서 재검증하며 Phase 16을 차단하지 않는다.

### 4.29 Steam 미연결 Create 시도와 실패 뒤 남는 로컬 세션

- **영향:** Steam을 실행하지 않은 상태에서도 CreateSession 요청이 시작돼 Title로 복귀할 수 있었고, provider 실패 뒤 로컬 `RPGameSession`이 남으면 다음 Create가 실제 원인 대신 `AlreadyInRoom`으로 실패했다.
- **원인:** 기존 Create 경계는 Session interface와 기존 Named Session만 검사했다. 설정 provider와 실제 provider 일치, Steam 로그인, 유효한 Local UserId를 확인하지 않았고 일반 Create 실패 callback에서는 timeout 경로와 달리 provider가 남긴 Named Session 정리를 시작하지 않았다.
- **해결:** Create 전에 effective `DefaultPlatformService`, active provider, Session/Identity interface, LocalUser 0 로그인과 UniqueNetId를 한 snapshot으로 검사한다. Steam은 전부 준비된 경우만 provider Create를 호출하고, 명시적인 `DefaultPlatformService=Null`과 active Null 조합만 개발 override로 허용한다. 실패는 `ProviderUnavailable`과 `Steam is not ready. Open Steam, sign in, then restart the game before creating a room.` 안내로 현재 메뉴에서 끝난다. sync false와 일반 async failure가 Named Session을 남겼다면 UI 완료 방송 전에 `CleanupLocalSession(true)`를 시작해 재시도 중 `AlreadyInRoom` 오진을 막는다.
- **핵심 계약 링크:** [Feature Flow: Session Room Lifecycle](../reference/flows/Session_Room_Lifecycle.md), [Session Subsystem API Contract](../reference/Session_Subsystem_API_Reference.md)
- **반영·검증:** 2026-07-20 03:48 KST, 로컬 작업 트리 미커밋. 신규 `RP.Session.CreateReadiness`를 포함한 Session Automation 11/11과 전체 RP Automation 18/18이 failed 0, warnings 0으로 통과했다. 전체 report는 `Saved/Automation/Pipeline/manual-20260720-create-readiness-full/index.json`이다. 중앙 Iteration은 기존 사용자 변경 `Config/DefaultGame.ini:127`의 EOF 빈 줄을 감지해 빌드 전에 중단됐으며 해당 파일은 수정하지 않았다. 같은 변경을 직접 검증한 UE 5.8 incremental Unity 빌드는 `Result: Succeeded`였다.
- **잔여 검증:** 2026-07-20 Development package에서 Steam 종료 상태의 Create 미호출/현재 메뉴 유지/정확한 notice, 반복 클릭 시 `AlreadyInRoom` 미발생과 Steam 로그인·게임 재시작 뒤 정상 Create를 사용자 체크리스트에서 확인했다. Phase 16 잔여 검증은 없다.

### 4.30 상시 표시 Debug HUD와 Host 개발 조작의 화면·릴리즈 경계

- **영향:** 기존 Debug HUD가 PIE 시작과 함께 항상 표시돼 gameplay 화면을 가렸고, 접속 Player Ready와 미션 시작을 반복 확인하려면 콘솔 명령을 여러 창에 직접 입력해야 했다. 화면형 개발 조작이 제품 입력 또는 Shipping 수명주기와 섞이면 릴리즈에서 Debug 기능이 노출될 위험도 있었다.
- **원인:** `URPDebugHUDWidget`은 읽기 전용 Status 한 화면과 자동 생성만 제공했고, 화면 상태 전환·Host User Management·고정 개발키·Shipping 제외를 하나의 명시적 계약으로 묶지 않았다.
- **해결:** 기존 Widget을 `Hidden / Status / UserManagement` 세 상태로 분리한다. `DebugExecBindings`의 상단 숫자열 `0`은 읽기 전용 Status, `9`는 User Management를 상호 배타적으로 전환한다. User Management는 Host에서만 `RPDevSetPlayerReady`, 기존 `RPSessionStartMission`, `RPDevReadyAllAndStartMission`을 사용할 수 있고 Client는 read-only다. `LateJoinObserver`는 Ready 조작에서 제외하며 제품 modal이 입력을 소유하면 새 User Management 열기를 거절한다. Shipping에서는 DebugExec, CheatManager와 HUD 생성을 비활성으로 유지한다.
- **핵심 계약 링크:** [Debug HUD Guide](../guides/Debug_HUD_Guide.md), [Debug Command Reference](../guides/Debug_Command_Reference.md), [Phase 16 Editor Checklist 3.5](../checklists/Phase_16_Editor_Verification_Checklist.md#35-development-debug-hud-non-blocking), [Code Architecture Rules](../06_Code_Architecture_Rules.md)
- **반영·검증:** 2026-07-20 04:26 KST, 로컬 작업 트리 미커밋. UE 5.8 preflight와 incremental Unity RPEditor Development build, `RP Win64 Shipping` target compile이 성공했고 `RP.Debug.HUD.Policy` 1/1과 정확한 `StartsWith:RP` 전체 RP Automation 19/19가 통과했다. 최종 report는 `Saved/Automation/Pipeline/manual-20260720-debug-hud-final-rp19/index.json`이다. 문서 direct validator는 Project task 30개와 Relative link 138개를 포함해 통과했고 MkDocs strict build도 성공했다. 현재 751줄인 Debug HUD 구현은 기존 Status와 이번 User Management가 같은 Native Slate tree와 상태 캐시를 공유해 이번 범위에서는 한 파일로 유지한다. 화면 또는 관리 action이 하나 더 늘어날 때 `RPDebugHUDWidgetUserManagement.cpp`로 구현 파일을 분리하는 후보로 고정한다.
- **잔여 검증:** 2026-07-20 사용자 체크리스트에서 PIE의 0/9 상태·입력 복구, Host mutation, Client read-only, Observer 제외와 Shipping package의 Debug 입력·HUD·CheatManager 비활성을 확인했다. 이 개발 편의 화면은 제품 Ready/Steam Gate를 대체하지 않는다.

### 4.31 개발용 미션 성공·실패 결과를 같은 권위 경계로 재현할 수 없음

- **영향:** 기존 `RPForceCompleteMission`은 성공만 재현했고 실패 terminal 상태 자체가 없어, 실패 뒤 Session Waiting 복귀·Observer 승격·Door/UI 동기화를 콘텐츠 구현 전에는 반복 검증할 수 없었다.
- **원인:** Phase 09가 실패 판정과 연출을 제외하면서 runtime/door enum과 MissionDirector 전이는 `Succeeded`까지만 만들었다. 실패를 `Inactive`나 `bMissionSucceeded=false`로 위장하면 session mirror와 기존 Observer 상태가 엇갈린다.
- **해결:** enum ordinal을 보존해 `Failed`와 `MissionFailed`를 끝에 추가하고, `RPDevForceMissionSuccess`/`RPDevForceMissionFailure`를 MissionDirector 서버 전용 전이에 위임한다. 실패는 `Failed / ReturnToBureau / bMissionSucceeded=false / MissionFailed`를 한 번에 커밋한다. 성공·실패 terminal 모두 GameMode의 Observer 승격과 hosted Waiting 경로를 통과한다. 기존 성공 명령은 호환 별칭으로 유지한다.
- **핵심 계약 링크:** [Debug Command Reference](../guides/Debug_Command_Reference.md), [Late Join Observer Flow](../reference/flows/Late_Join_Observer.md), [Phase 16 Editor Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md), [Phase 16 Kickoff](../plans/Phase_16_Kickoff_Plan.md)
- **반영·검증:** 2026-07-20 05:00 KST, 로컬 작업 트리 미커밋. UE 5.8 preflight, RPEditor Win64 Development, RP Win64 Development/Shipping build가 모두 성공했다. `RP.Mission.State.TerminalTransitions` 1/1과 정확한 `StartsWith:RP` 전체 RP Automation 20/20이 failed 0, warnings 0으로 통과했으며 report는 `Saved/Automation/Pipeline/manual-20260720-mission-outcome-rp20-scoped/index.json`이다. 필터를 `RP`로만 준 진단 실행은 UE 내부 테스트까지 214개를 선택해 무관한 `System.Engine.Streaming.SSAM.Unregistration.RecoverMissedUnregisterPath` 1개가 실패했으므로 프로젝트 Gate 근거에서 제외했다.
- **잔여 검증:** 2026-07-20 사용자 체크리스트에서 Host 성공/실패 결과, Client·잘못된 상태 거절, Session Waiting/Bureau, Observer Active/Pawn/Ready=false 복구, 실패 뒤 새 미션 선택·시작과 호환 별칭을 확인했다. 실제 실패 trigger·정산·연출·레벨 왕복은 후속 콘텐츠 범위에서 재검증하며 Phase 16을 차단하지 않는다.

### 4.32 문서·Roadmap·저장소 진행 상황을 한 화면에서 보기 어려움

- **영향:** Obsidian Project Manager는 일정 편집에 적합하지만 API 문서 웹 홈에서 현재 Phase, 검증 결과, Open Action과 최근 커밋을 함께 확인할 수 없어 여러 화면을 오가야 했다.
- **원인:** 기존 Developer Docs 홈은 Reference 탐색만 제공했고 Roadmap/Work Report/Git의 책임을 침범하지 않으면서 합쳐 보여주는 읽기 전용 투영 계층이 없었다.
- **해결:** `E:/Workspace/RP_Live/DeveloperDocs`의 Astro 홈을 Project Dashboard로 교체하고 Roadmap YAML, 최신 Work Report Snapshot과 RP committed history를 빌드 시점 JSON으로 생성한다. `/roadmap`은 Phase 16~20 작업·상태·일정·의존성을 읽기 전용으로 표시하며 편집은 계속 Obsidian이 소유한다. 비밀번호, 세션 비밀값, 절대 경로와 dirty file 목록은 스냅샷에서 제외한다.
- **핵심 계약 링크:** [RP Project Roadmap](../roadmap/index.md), [Documentation Workflow](../03_Documentation_Workflow.md), [Reference Index](../reference/index.md)
- **반영·검증:** 2026-07-20 15:03 KST, Reference/Project Docs direct validator와 MkDocs strict, 로컬 Astro production build가 성공했다. 인증 전 redirect, 인증 후 Dashboard와 `/roadmap`, Phase 16~20·Automation Snapshot 표시를 로컬/Production에서 확인했고 `https://momemo-dev.vercel.app`에 배포했다.
- **잔여 검증:** 없음. 웹은 실시간 편집기가 아니라 배포 시점 스냅샷이므로 원본 변경 뒤 `sync:rp-docs`/build와 재배포가 필요하다.

## 5. 최신 검증 Snapshot

| 범위 | 상태 | 최종 근거 | 증거 |
|---|---|---|---|
| Build | Pass | 2026-07-20 05:00 KST UE 5.8 preflight, RPEditor Development, RP Win64 Development/Shipping build 성공 | 신규 Failed terminal/Dev 명령 delta 포함; Shipping cook/launch는 별도 |
| Automation | Pass | `RP.Mission.State.TerminalTransitions` 1/1, 정확한 `StartsWith:RP` 전체 RP Automation 20/20 통과 | `Saved/Automation/Pipeline/manual-20260720-mission-outcome-rp20-scoped/index.json` |
| Docs | Partial | Reference/Project Docs direct validator, MkDocs strict와 Developer Docs production build 성공. 2026-07-20 14:57 KST Closure Gate는 기존 `Config/DefaultGame.ini:127` EOF blank line으로 build 전 차단 | EVD-16-006, 4.25, 4.32; 사용자 Config는 미수정 |
| Editor | Pass | WBP 연결, Host Create ON 실제값, 첫 PIE CommonUI ensure 미발생과 Terminal E/Q/Escape 확인 | 2026-07-20 [Editor Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md) |
| PIE 1 Player | Pass | Host Create/Room Settings, ESC/Back/WASD, 0/9 Debug HUD와 입력 복구 확인 | 2026-07-20 사용자 체크 |
| PIE 2~3 Players | Pass | Observer 생성·차단·LMB/RMB 순환·대상 이탈·승격, Host/Client Debug 권위와 미션 결과 명령 확인 | 2026-07-20 사용자 체크 |
| Steam Development | Pass | 동일 package 두 계정·두 기기의 Create/Find/Join/Leave/Invite, Join 정책과 전체 failure recovery 확인 | 2026-07-20 사용자 체크 |
| Shipping | N/A | `RP Win64 Shipping` target compile과 Debug 기능 비노출 확인. 전체 Cook·Stage·Package·Launch smoke는 후속 Gate로 이관 | [Editor Checklist Section 5](../checklists/Phase_16_Editor_Verification_Checklist.md) |

## 6. Open Action Register

| ID | 작업 | 담당 | 차단 여부 | Done 조건 | 필요 근거 |
|---|---|---|---|---|---|
| — | 없음 - Phase 16 Open Action 마감 | — | No | — | — |

- **2026-07-20 완료 확인:** ACT-16-001~009를 Work Report와 체크리스트 근거로 마감했다. ACT-16-003의 중앙 Gate 차단은 기존 사용자 Config diff로 분리하고 direct 문서 검사 성공을 완료 근거로 사용했다. ACT-16-007은 Shipping 전체 smoke를 후속 릴리스 Gate로 이관하고 완료했다.
- **Snapshot 시각:** 2026-07-20 15:00 KST
- **Roadmap:** [RP Project Roadmap](../roadmap/index.md)
- **Editor 상세 절차:** [Phase 16 Editor Verification Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md)
- **Deferred / Non-blocking:** 실제 완료 뒤 Waiting/Bureau 레벨 귀환과 LateJoinObserver 출신 Player의 다음 미션 정상 참가는 콘텐츠 루프 구현 이후 `ACT-19-003`에서 검증한다.

## 7. 완료 경계

### 제품 / Phase 완료

- [x] C++ 구현과 Late Join feature의 로컬 Phase 통합
- [x] 신규 Mission Outcome delta를 포함한 최신 UE 5.8 Editor/Game Development/Shipping build와 전체 RP Automation 20/20
- [x] WBP 연결과 편집 에셋 범위 확인 - 사용자 Editor Checklist 2.1~2.5
- [x] Editor / PIE 1 Player
- [x] PIE 2~3 Players / Listen Server Observer 계약 - 실제 레벨 귀환 E2E는 ACT-19-003으로 비차단 이관
- [x] Windows Development 두 계정·두 기기 Steam
- [x] N/A (Phase 16) - Shipping Cook·Stage·Package·Launch smoke는 후속 콘텐츠 통합/릴리스 Gate로 이관. Shipping target compile과 Debug 기능 비노출은 확인
- [x] Checklist와 Work Report 최종 근거 갱신
- [x] 사용자 Phase Done 승인 - 2026-07-20
- [x] `CODEX_INDEX`와 `[MS-16-DONE]` 동시 갱신 - 2026-07-20

### Integration / Publishing 권한

- [ ] 사용자 승인 후 `phase/16 -> main --no-ff`
- [ ] post-merge smoke
- [ ] 사용자 별도 승인 후 `origin/main` push

제품 Gate와 Git 권한은 별개다. commit, main 병합, push는 각각 요청된 범위에서만 수행한다.

## 8. 다음 세션 시작 지점

```text
1. AGENTS.md -> CODEX_INDEX -> Phase 17 문서 순서로 읽고 Phase 17 Kickoff Plan을 먼저 작성한다.
2. Phase 16 Editor/PIE/Windows Development Steam 검증은 완료됐으므로 같은 수동 검증을 반복하지 않는다.
3. Phase 15에서 이관된 Door/Portal과 구조 분할 후보를 Phase 17 범위에 포함할지 Kickoff에서 다시 결정한다.
4. Shipping Cook·Stage·Package·Launch smoke는 후속 콘텐츠 통합/릴리스 Gate에서 실행한다.
5. 실제 레벨 왕복·다음 미션 E2E와 미션 성공/실패 명령 재검증은 콘텐츠 루프 구현 뒤 `ACT-19-003`에서 진행한다.
6. 기존 `DefaultGame.ini` EOF diff는 사용자 변경으로 보존하며 이번 마감에서 수정하지 않는다.
7. 요청받지 않은 branch/add/commit/merge/push는 수행하지 않는다.
```

## 9. Evidence Ledger

최신 Snapshot에서 밀려난 이전 Gate와 상세 구현 기록을 보존한다. `Superseded`는 실패가 아니라 더 최신 근거가 있다는 뜻이다.

<details>
<summary>Branch, 이전 검증, 상세 보강 기록 펼치기</summary>

### EVD-16-007 - Phase 16 사용자 체크리스트 완료 Snapshot

- **시각:** 2026-07-20 12:08 KST
- **상태:** Current
- **내용:** 사용자가 저장된 WBP, Editor/PIE 1~3 Players, Development Debug 도구와 동일 Windows Development package의 두 Steam 계정·두 기기 제품 흐름을 체크리스트에서 확인했다.
- **증거:** [Phase 16 Editor Verification Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md)의 2.1~2.5, 3.1~3.6, 4.1~4.4와 Phase 13~15 회귀 항목이 2026-07-14~20 확인으로 체크됐다. 첫 PIE CommonUI ensure 미발생, Host Create ON 동기화, Observer 순환·이탈·승격, 0/9 Debug HUD, 미션 성공/실패 명령, Steam Create/Find/Join/Invite/정책/실패 복구를 포함한다.
- **범위 경계:** `Done 검수 자료`의 별도 로그·스크린샷 첨부는 선택 사항이며 비어 있어도 이 판정을 차단하지 않는다. Section 5의 Shipping Cook·Stage·Package·Launch smoke 4개는 성공으로 승격하지 않고 후속 콘텐츠 통합/릴리스 Gate로 이관한다. Phase 16에서는 Shipping target compile과 Debug 기능 비노출까지만 확인했다.

### EVD-16-006 - Project docs system validation

- **시각:** 2026-07-19 18:58 KST
- **상태:** Current
- **내용:** Reference와 Project Manager/PRR/Work Report v2 통합 검사, 영구 fixture, PowerShell parser, MkDocs strict build와 Obsidian Project Manager 표시를 확인했다.
- **증거:** `Validate_Docs.ps1`은 Reference 10/Canonical Symbols 47/MkDocs nav 100, Project 1/Tasks 29/PRRs 2/WorkReportsV2 1/RelativeLinks 119로 exit 0. fixture 4/4와 5개 PowerShell script parser가 통과했다. `mkdocs build --strict -f Docs/mkdocs.yml`도 통과했다. Obsidian UI에서는 `RP Project Roadmap` 1개와 29개 task, Week Gantt, Phase 16 계층 및 의존성 선을 확인했다.
- **차단 분리:** 중앙 `Validate_RP.ps1 -Mode Iteration -Scope Docs -CheckOnly`는 새 검사기 전에 기존 `Config/DefaultGame.ini:127: new blank line at EOF`를 감지해 exit 1. 사용자 Config는 수정하지 않았다.

### EVD-16-001 - Branch / Commit Record

- **상태:** Historical

```text
phase/16 base:
- 4194b83 main/origin/main

Kickoff:
- 00d79d9 docs: start phase 16 steam lobby ux

Merged work:
- 70c2093 merge: integrate phase 16 session layout
- f39b443 merge: integrate phase 16 lobby metadata
- 046b99d merge: integrate phase 16 session resilience
- 4dd2975 merge: integrate phase 16 steam invite flow
- 5e16fea merge: integrate phase 16 lobby ux contracts
- 00f4f8c merge: integrate phase 16 unknown ping fix

Feature commits:
- 1d02b67 session layout
- b85794c metadata and join policy
- c35401c failure recovery
- c5d664b Steam invite
- e3d4393 lobby UX contracts
- 6628aeb unknown Steam lobby ping normalization

Documentation:
- a97db79 Phase 16 verification handoff/reference/checklist/packaging guide
- 3ff2b1a docs: record phase 16 late join integration

Hardening:
- f3653c3 fix: harden phase 16 session recovery
- 2c7f4ca merge: integrate phase 16 session hardening

Late Join extension:
- 0e140ee docs: extend phase 16 for late join observer
- d4c0629 feat: add phase 16 late join observer
- 15b1ccd merge: integrate phase 16 late join observer
```

하위 브랜치 원격 push는 하지 않았다. main 통합도 하지 않았다.

### EVD-16-002 - Local Verification History

- **상태:** Superseded - 최신 권위 결과는 5절의 17/17 Snapshot이다.

하위 브랜치 Gate:

- [x] UE 5.8 preflight
- [x] Unity RPEditor Development
- [x] Non-Unity RPEditor Development
- [x] `RP.Session` 7/7 (`UIContracts` 포함)
- [x] Phase 11 closure smoke `MissionCompleted / Mission Phase: Succeeded / SUCCEEDED`
- [x] scoped `git diff --check`

통합 `phase/16` 최종 Gate:

- [x] UE 5.8 preflight - Engine `5.8.0`, Association `5.8`
- [x] Unity RPEditor Development - `Result: Succeeded`
- [x] Non-Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 7/7
- [x] `RP.Mission.Selection` 3/3
- [x] Phase 11 closure smoke - `MissionCompleted`, `Mission Phase: Succeeded`, `SUCCEEDED`
- [x] Markdown relative link와 MkDocs nav target 정적 확인
  - system Python에 `mkdocs` module이 없어 site build는 N/A
- [x] `main...phase/16` diff check + 35 files prohibited-path audit
  - `Content`, `Config`, `RP.Build.cs`, Target.cs 변경 없음

`fix/phase16-session-hardening` 작업 트리 Gate:

- [x] UE 5.8 preflight - Engine `5.8.0`, Association `5.8`
- [x] Unity RPEditor Development - `Result: Succeeded`
- [x] Non-Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 8/8 (`Recovery`, `UIContracts` 포함)
- [x] `RP.Mission.Selection` 3/3
- [x] Phase 11 closure smoke - `MissionCompleted`, `Mission Phase: Succeeded`, `SUCCEEDED`
- [x] scoped `git diff --check` 및 prohibited-path audit
  - `Content`, `Config`, `RP.Build.cs`, Target.cs 변경 없음

`feat/phase16-late-join-observer` 로컬 Gate:

- [x] UE 5.8 preflight - Engine `5.8.0`, Association `5.8`
- [x] Unity RPEditor Development - `Result: Succeeded`
- [x] Non-Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 10/10 - `HostedPolicy`, `LateJoinPolicy`, `UIContracts` 포함
- [x] `RP.Mission.Selection` 3/3
- [x] Phase 11 closure smoke - `MissionCompleted`, `Mission Phase: Succeeded`, `SUCCEEDED`
- [x] feature commit `d4c0629`/`phase/16` 통합 `15b1ccd` 뒤 최종 `git diff --check`와 prohibited-path audit

2026-07-14 Create 옵션 legacy 필드 정리 Iteration:

- [x] `FRPCreateRoomOptions.bAllowJoinInProgress` 제거 후 UE 5.8 Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 10/10 - warnings 0
- [x] `git diff --check`
- [ ] `WBP_RPHostMenu`의 `Make FRPCreateRoomOptions` 노드 Refresh/Compile/Save

2026-07-14 Session Notice transient 수명주기 Iteration:

- [x] UE 5.8 preflight - Engine `5.8.0`
- [x] incremental Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 10/10 - failed 0, warnings 0
- [x] `RP.Session.UIContracts` - nonblocking 미복원, Blocking 복원, auto-dismiss Tone 정책
- [x] read-only diff/untracked text 검사
- [ ] Editor 재시작 뒤 WBP 자동 숨김과 JoinMenu -> 다른 메뉴 전환 확인

2026-07-14 JoinMenu Find 취소 수명주기 Iteration:

- [x] `URPJoinMenuScreenBase`와 `URPSessionSubsystem::CancelFindRooms` 구현
- [x] UE 5.8 preflight - Engine `5.8.0`
- [x] incremental Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 10/10 - failed 0, warnings 0
- [x] `RP.Session.UIContracts` - owned pending Find만 Deactivate에서 취소하는 정책
- [x] read-only diff/untracked text 검사
- [ ] `WBP_RPJoinMenu`를 새 base로 Reparent하고 기존 직접 `FindRooms`를 `RefreshRooms` 계약으로 교체
- [ ] Editor에서 Pending 중 Back과 완료 뒤 Back을 각각 재검증

2026-07-14 Ready Panel Invite 책임 이동 Iteration:

- [x] `URPReadyPanelBase` Invite API/binding 제거와 `URPRoomSettingsWidgetBase` 이전
- [x] `RP.Session.UIContracts` reflection 회귀 계약 추가
- [x] UE 5.8 UHT와 `RPReadyPanelBase.cpp`, `RPRoomSettingsWidgetBase.cpp`, `RPSessionUIContractAutomationTest.cpp` 컴파일 성공
- [ ] incremental Unity 최종 링크 - 열린 `UnrealEditor.exe`가 `UnrealEditor-RP.dll`을 점유해 `LNK1104`로 중단
- [ ] `RP.Session.UIContracts` 실행 - 새 DLL 링크 뒤 실행 필요
- [x] 변경 파일 scoped `git diff --check`
- 검증 시각: 2026-07-14 20:38 KST
- 로그: `Saved/Logs/Validation/20260714-203748-8572-4a8c8e5d-Iteration/Build-Unity.log`

2026-07-14 Host disconnect / Join 중 실패 복귀 직렬화 Iteration:

- [x] Network/Travel failure delegate 내부 즉시 OpenLevel 제거와 단일 pending failure return 구현
- [x] null World pending Join failure의 GameInstance 소유 fallback과 중복 failure coalescing 구현
- [x] Multiplayer menu 장기 package path, PIE prefix, Title intermediate map 판정 Automation 추가
- [x] UE 5.8 preflight - Engine `5.8.0`
- [x] incremental Unity RPEditor Development - `Result: Succeeded`
- [x] `RP.Session` 10/10 - failed 0, warnings 0
- [x] read-only diff/untracked text 검사
- [ ] 동일 Windows Development Steam 패키지에서 참가 완료 뒤 Host 종료 재검증
- [ ] 동일 Windows Development Steam 패키지에서 Join/ClientTravel 도중 Host 종료 재검증

2026-07-14 실패 전용 Title 복귀 분리 Iteration:

- [x] 정상 Leave의 `DefaultMultiplayerMenuMapName`과 실패 전용 `DefaultFailureReturnMapName` 분리
- [x] Engine 선행 Title load를 corrective travel 없이 완료로 인정하는 PostLoadMap 계약 반영
- [x] Host disconnect/Join travel failure 사용자 문구를 Title 복귀 기준으로 정리
- [x] UE 5.8 preflight - Engine `5.8.0`
- [x] incremental Unity RPEditor Development - `Result: Succeeded`
- [x] 전체 RP Automation 13/13 - `RP.Session` 10/10 포함, failed 0, warnings 0
- [x] `git diff --check`
- [ ] `WBP_RPTitleScreenMenu`에 재사용 `WBP_RPSessionNotice` 배치
- [ ] 동일 Windows Development Steam 패키지에서 두 실패 시나리오 재검증

2026-07-14 실패 Join 잔여 연결 취소 Iteration:

- [x] terminal Join 실패/timeout에서 현재 GameInstance의 `PendingNetGame` 명시 취소
- [x] provider Join timeout은 late callback 전 named session을 파괴하지 않는 quarantine으로 변경
- [x] UE 5.8 preflight - Engine `5.8.0`
- [x] incremental Unity RPEditor Development - `Result: Succeeded`
- [x] 전체 RP Automation 13/13 - `RP.Session` 10/10 포함, failed 0, warnings 0
- [x] `git diff --check`
- [ ] 동일 Steam 패키지에서 timeout -> stale Join 실패 -> Host 재생성 후 자동 접속 없음 재검증

#### 2026-07-14 13:38 KST - Join 취소 모달 / Room Instance 보강

문제:

- Client가 이전 Lobby에 Join/ClientTravel 중 Host가 방을 닫고 같은 Steam 계정으로 새 방을 만들면 endpoint가 동일해 남아 있던 연결 시도가 새 Lobby에 붙을 수 있었다.
- 연결 중임을 Compact 문구만으로 표시해 사용자가 명시적으로 접속을 중단할 수 없었다.

수정:

- session schema를 `RP_PHASE16_SESSION_V4`로 변경했다.
- 선택 당시 `FRPRoomJoinRequest.RoomId`를 ClientTravel의 `RPExpectedRoomId` option으로 넣고, Host `PreLogin`에서 현재 hosted session ID와 비교한다.
- Steam hosted session에서 option 누락, 현재 ID 조회 실패, ID 불일치는 각각 fail-closed로 거절한다.
- `CancelJoinRoom`/`IsJoinRoomInProgress`와 typed `Cancelled` reason을 추가했다.
- provider callback 대기 취소는 delegate를 유지해 늦은 완료를 quarantine하고, stale cleanup 취소는 Join 재시도를 제거하며, ClientTravel 취소는 `PendingNetGame`을 즉시 중단한다.
- `ERPSessionNoticeTone::ModalPending`, `bCanCancelJoin`, `ConnectionThrobber`, `CancelJoinButton` Native binding을 추가했다. JoinMenu ESC/게임패드 Back도 같은 취소 경로를 사용한다.

검증:

- [x] UE 5.8 preflight
- [x] incremental Unity RPEditor Development - `Result: Succeeded`
- [x] 전체 RP Automation 13/13 - failed 0, warnings 0 (`Saved/Automation/Pipeline/20260714-133733-38320-c968b459-core`)
- [x] `RP.Session.SearchIdentity` - pinned URL, option injection 방어, Lobby mismatch 검증
- [x] `RP.Session.UIContracts` - Join ModalPending, cancel 표시, 취소 후 Hidden 검증
- [x] `git diff --check`
- [ ] `WBP_RPSessionNotice`에 아래 정확한 이름을 추가하고 `ModalPending` 중앙 스타일 연결
- [ ] Steam 두 기기에서 접속 중 Cancel 후 새 Host 방 자동 접속 없음 확인
- [ ] Steam 두 기기에서 Cancel하지 않은 이전 Lobby 연결도 Host 재생성 Lobby로 붙지 않고 실패하는지 확인

#### 2026-07-14 19:28 KST - Room pin Automation 직접 include 보강

문제:

- `RPSessionPolicyAutomationTest.cpp`가 `FURL`과 `TRAVEL_Absolute`를 직접 사용하면서 선언 헤더를 포함하지 않아 IDE에서 심볼을 해석하지 못했다.

수정:

- 테스트 파일에 `Engine/EngineBaseTypes.h` 직접 include를 추가했다.

검증:

- [x] UE 5.8 incremental Unity RPEditor Development - 해당 테스트 파일 단독 컴파일, `Result: Succeeded`
- [x] 전체 RP Automation 13/13 - failed 0, warnings 0 (`Saved/Automation/Pipeline/20260714-192754-37492-e16bb53a-core`)

#### 2026-07-14 20:08 KST - Room Instance 거절 후 PendingNetGame 크래시 보강

문제:

- Client가 방 A Join 중 Host가 같은 endpoint로 방 B를 만들었을 때 Host `PreLogin`은 `RP_ROOM_INSTANCE_CHANGED`로 정상 거절했다.
- 그러나 Client의 NetworkFailure delegate 안에서 RP가 `GEngine->CancelPending`을 동기 호출해 `PendingNetDriver`를 먼저 제거했고, 같은 broadcast를 계속 처리하던 UE 5.8이 PendingNetGame WorldContext를 다시 찾으며 `UnrealEngine.cpp:16989` Assert로 프로세스를 종료했다.
- Crash 근거: `E:/Workspace/GameBulids/RP/Windows/RP/Saved/Crashes/UECC-Windows-C9FB6CD54EE7B15BE96F728B1D62E9F4_0000`.

수정:

- `PendingConnectionFailure` 또는 `PendingNetDriver`에서 발생한 활성 Join 실패는 RP 후처리를 GameInstance timer의 다음 Tick으로 넘긴다.
- 해당 broadcast에서는 UE가 PendingNetGame 정리를 소유하며, 지연된 RP 후처리는 Pending travel을 다시 취소하지 않고 Join terminal 상태, Title 복귀, 로컬 session cleanup만 수행한다.
- 사용자 Cancel, provider timeout, 이미 연결된 GameNetDriver의 Host disconnect 경로는 기존 동작을 유지한다.
- `RP.Session.Recovery`에 Pending connection/driver는 defer하고 established GameNetDriver는 기존 경로를 유지하는 정책 검증을 추가했다.

검증:

- [x] UE 5.8 incremental Unity RPEditor Development - `Result: Succeeded`
- [x] 전체 RP Automation 13/13 - failed 0, warnings 0 (`Saved/Automation/Pipeline/20260714-200807-51188-e5cd9af1-core`)
- [x] `git diff --check`
- [ ] 새 Windows Development package에서 방 A Join -> Host 종료 -> 방 B 재생성 시 `RP_ROOM_INSTANCE_CHANGED` 뒤 Client 프로세스가 유지되고 Title 실패 안내가 표시되는지 재검증
- [ ] 위 실패 후 새 Find 결과의 방 B를 사용자가 명시적으로 Join하면 정상 접속되는지 재검증

### EVD-16-003 - 기존 사용자 작업 Snapshot

- **상태:** Historical - 현재 실행 순서와 ID는 6절 Action Register와 Editor Checklist를 우선한다.

상세 절차:
[Phase 16 Editor Verification Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md)

핵심 잔여:

1. Room row에 Host/Map/State/JoinBlock widget binding 추가
2. Join menu를 stable Join request 하나로 연결하고 `URPJoinMenuScreenBase`로 Reparent
3. 재사용 Session Notice를 Host/Join/Multiplayer/Title 메뉴에 배치
4. `WBP_RPRoomSettings`에 Host `InviteButton` 배치, Bureau Ready Panel에는 세션 조작이 없는지 확인
5. PIE 1인/2인 회귀
6. 동일 Windows Development package의 두 Steam 계정·두 기기 검증
7. HostMenu/Room Settings Allow Join `RPSelector`와 ESC `WBP_RPRoomSettings` Host route 연결
8. PIE OFF/ON Observer/승격과 두 기기 Steam Invite/Join Game 검증
9. Shipping Build/Cook/Launch/config smoke

### EVD-16-004 - 기존 완료 기준 Snapshot

- **상태:** Historical - 현재 완료 경계는 7절을 우선한다.

- [x] C++ 구현과 하위 브랜치 통합
- [x] 통합 `phase/16` code head `00f4f8c` 최종 로컬 Gate
- [x] notice/hosted warning/late callback 보강 구현과 작업 트리 로컬 Gate
- [x] 보강 변경 commit 및 `phase/16` 통합
- [x] Late Join Observer 확장 C++/Automation/빌드 로컬 Gate
- [x] Late Join feature commit `d4c0629` 및 `phase/16` 통합 `15b1ccd`
- [ ] WBP 연결과 편집 에셋 범위 확인
- [ ] Editor/PIE 1 Player
- [ ] PIE 2 Players / Listen Server
- [ ] Windows Development 두 계정·두 기기 Steam
- [ ] Shipping smoke
- [ ] 사용자 검증 뒤 Phase 문서/체크리스트 최종 근거 갱신
- [ ] 사용자 Phase Done 승인
- [ ] 사용자 승인 후 `phase/16 -> main --no-ff`
- [ ] post-merge smoke
- [ ] 사용자 승인 후 `origin/main` push

### EVD-16-005 - 기존 다음 세션 시작 지점

- **상태:** Historical - 현재 시작 지점은 8절을 우선한다.

```text
1. AGENTS.md -> CODEX_INDEX -> Phase 16 문서/Work Report/Checklist 순서로 읽는다.
2. `phase/16`에서 Late Join integration code head `15b1ccd`와 이후 문서 마감 commit을 확인한다.
3. feature commit/로컬 통합은 완료 상태로 유지하고 원격 push/main 병합은 하지 않는다.
4. 체크리스트 2번 Room/HostMenu/RoomSettings WBP 연결부터 진행한다. InviteButton은 Ready Panel이 아니라 Room Settings에 둔다.
5. Editor/PIE와 Development 두 기기 근거가 끝나기 전 Phase를 Done으로 바꾸지 않는다.
6. main 병합과 push는 각각 별도 사용자 승인을 받는다.
```

</details>
