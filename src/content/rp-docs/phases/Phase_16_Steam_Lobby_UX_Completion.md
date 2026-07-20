---
title: "Phase 16 - Steam Lobby UX Completion"
description: "Phase 16 - Steam Lobby UX Completion의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "phases/Phase_16_Steam_Lobby_UX_Completion.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 16 - Steam Lobby UX Completion"
order: 30
---
> Phase 12의 Steam 최소 연결을 제품 흐름에 가깝게 다듬고, 실패 상황을 사용자에게 이해 가능한 UX로 보여주는 Phase다.

---

## 0. 문서 상태

```text
Status:
Done

Index:
Docs/CODEX_INDEX.md

Kickoff Plan:
docs/plans/Phase_16_Kickoff_Plan.md

Work Report:
docs/reports/Phase_16_Work_Report.md

Editor Verification:
docs/checklists/Phase_16_Editor_Verification_Checklist.md
```

---

## 1. 목표

```text
Steam 세션을 기술 연결 수준에서 제품형 로비 UX 수준으로 끌어올리고, 친화적 위치 표시와 Host 선택형 Late Join Observer 흐름을 완성한다.
```

Phase 16은 Steam을 다시 다루지만, 목적은 API 연결이 아니라 실제 사용 흐름의 완성도다.

---

## 2. 선행 조건

```text
[x] Phase 12 Steam provider 최소 연결 검증
[x] Phase 13 Room List UI 검증
[x] Phase 14 Bureau Room Ready Panel 검증
[x] Phase 15 Mission Select / Door Status 흐름 검증
[x] Phase 15 잔여 변경과 구조 Wave 1이 main/origin/main에 통합되고 기본 작업 폴더가 clean main인지 확인
[x] Phase 16 Kickoff Plan 작성
[x] 승인된 Kickoff Plan 기준으로 최신 main에서 `phase/16` 통합 브랜치 생성
```

위 세 항목이 끝나기 전에는 Phase 16을 `Current`로 바꾸거나 `main`에서 구현을 시작하지 않는다. 사용자가 하위 branch 생성/통합을 명시적으로 요청한 경우에는 `phase/16`에서 분기해 다시 `phase/16`으로 통합한다. 구현 요청만으로 branch mutation을 자동 실행하지 않는다.

---

## 3. 이번 Phase에서 만드는 것

```text
Steam UX:
- Steam 친구 초대와 Overlay Join 수락 경계
- Lobby metadata schema와 stable Join identity
- 방 이름 / Host / 인원 / Map / Ping / Waiting-InProgress 표시 계약
- 방 사라짐 / Join 실패 / Timeout / Provider unavailable typed notice
- Host 나감 / Client 이탈 / 세션 종료 복구

상태:
- Room state metadata Waiting/InProgress
- V3 친화적 위치명과 Allow Join During Mission metadata
- JoinMenu는 Waiting/ON 참가 가능 방만 노출하고 OFF/Full/Version mismatch는 필터
- 방어 경로에서는 Full/Version mismatch를 Observer 안내보다 우선해 차단
- Mission Start 이후 metadata + PreLogin + Pawn spawn 직전 재검증
- Succeeded/Failed terminal에서 Observer Active 승격과 Ready=false/Pawn spawn. Failed는 현재 Development 강제 결과 전이만 제공하며 실제 실패 판정·정산·travel은 후속 범위

Host/UI:
- HostMenu Create option `bAllowJoinDuringMission` 기본 OFF
- ESC Host 전용 Room Settings ON/OFF `RPSelector`와 pending 잠금/실제 값 복구 계약
- Room List `BUREAU ROOM`/미션 위치, Observer 안내
- JoinMenu 활성 시 자동 Find, 진행 중 Back/Deactivate 시 provider 검색 취소와 늦은 완료 폐기
- Native Observer Overlay와 Ready Row `WAITING NEXT MISSION`
- Bureau Ready Panel은 월드 표시 전용 계약을 유지하고 Invite 같은 방 관리 조작을 넣지 않음
- ESC Host 전용 Room Settings에서 `InviteButton`으로 Steam 친구 초대 Overlay를 요청

Docs:
- Steam Development/Shipping 패키징 가이드
- Editor/PIE/두 기기 Steam 검증 체크리스트
```

제품 JoinMenu는 현재 참가 가능한 Waiting 또는 InProgress+ON 방만 노출한다. Steam이 돌려준 결과라도 RP 검색 캐시에서 InProgress OFF, Full, Version mismatch, invalid room을 제거한다. 차단 문구는 초대/오래된 결과/provider 경합을 위한 방어용 fallback으로 유지하며, 실환경 검증은 차단 방 미노출과 직접 참가 거절이다.

---

## 4. 이번 Phase에서 만들지 않는 것

```text
AccountServer
Steam Auth 기반 영구 계정
Dedicated Server
Host Migration
크로스스토어 초대
EOS / Stove 통합
랭킹/업적/상점
실제 TargetMap travel/level streaming
사망·부활·다운·보상·자유 유령 능력
미션 중 재접속 슬롯 복원 구분
```

---

## 5. 예상 변경 범위

```text
Config/*
Source/RP/System/RPSessionSubsystem.*
Source/RP/System/Session/*
Source/RP/Core/RPOnlineTypes.h
Source/RP/Player/RPPlayerState.*
Source/RP/System/RPGameModeBase.*
Source/RP/System/RPGameStateBase.*
Source/RP/UI/Frontend/RoomList/*
Source/RP/UI/Frontend/Session/*
Source/RP/UI/InGame/Ready/*
Source/RP/UI/InGame/Session/*
Content/RP/Blueprints/Widgets/*
Docs/docs/plans/Phase_16_Kickoff_Plan.md
Docs/docs/checklists/Phase_16_Editor_Verification_Checklist.md
Docs/docs/reports/Phase_16_Work_Report.md
Docs/docs/guides/Phase_16_Steam_Packaging_Guide.md
```

---

## 6. 구조 규칙

```text
Steam UX가 추가되어도 UI는 Steam API를 직접 호출하지 않고 URPSessionSubsystem 경계를 유지한다.
Steam metadata는 RP Room 표시 데이터로 변환해 UI에 제공한다.

Host Migration은 이번 Phase에서 만들지 않는다.
Host 종료 시 명확한 세션 종료/메뉴 복귀 흐름을 우선한다.
Host 종료와 Join 중 연결 실패는 local session cleanup 완료를 기다리지 않고 Title 복귀를 예약한다. Engine 기본 disconnect 처리가 Title을 먼저 열면 이를 최종 복귀로 인정하고 중복 travel을 하지 않는다. 사용자가 요청한 정상 Leave만 기존 Multiplayer menu 복귀를 유지한다.

친구 초대, Overlay Join, Timeout, Provider unavailable 같은 Steam 전용 결과는 UI에 Steam 타입 그대로 전달하지 않는다.
URPSessionSubsystem이 provider 호출, metadata 변환, 실패 메시지 상태, UI 이벤트 라우팅을 모두 흡수하면 분리 후보를 Work Report에 기록한다.
Room state metadata는 Ready, MissionRuntimeState, 아이템 상태의 원본이 아니며, 방 목록 표시와 Join 허용/거부 안내에만 사용한다.
PlayerState participation이 Active/LateJoinObserver 원본이며, GameMode가 실제 MissionPhase와 유효 Host 정책을 재검증해 Pawn spawn/관전/승격을 결정한다.
Host 정책 OFF는 즉시 fail-closed, ON은 provider metadata 성공 뒤에만 유효하다.
`WBP_RPBureauReadyPanel`은 Player/Ready/구역/Observer 상태를 보여 주는 월드 현황판이며 세션 조작을 소유하지 않는다. Invite는 `WBP_RPRoomSettings`가 `URPSessionSubsystem`의 provider-neutral API로 요청한다.
Null provider fallback은 제품 요구가 아니며, 필요할 때만 임시 회귀/진단 override로 확인한다.
```

---

## 7. 검증 기준

```text
[x] C++ metadata/join/action/timeout/invite/UI contract 구현
[x] UE 5.8 하위 브랜치 Unity/Non-Unity, RP.Session, Phase 11 smoke 통과
[x] 통합 phase/16 code head `00f4f8c` 최종 로컬 Gate 통과
[x] `fix/phase16-session-hardening` 작업 트리 notice/HostedState/late callback 보강과 로컬 Gate 통과
[x] hardening commit `f3653c3`과 `phase/16` 통합 `2c7f4ca`
[x] Late Join Observer C++/Automation 구현과 UE 5.8 Unity/Non-Unity 로컬 Gate
[x] `RP.Session` 10/10, `RP.Mission.Selection` 3/3, Phase 11 closure smoke
[x] Late Join feature commit `d4c0629`과 `phase/16` 로컬 통합 `15b1ccd`
[x] 통합 code head `15b1ccd` 기준 최종 `git diff --check`와 prohibited-path audit
[x] WBP Room row / stable Join / Session Notice(Title 포함) 연결
[x] HostMenu/Room Settings OFF/ON Selector / WBP_RPRoomSettings의 InviteButton / ESC Host route 연결
[x] PIE OFF 차단 / ON 고정 관전·Active 대상 수동 순환 / 대상 이탈 자동 전환 / Succeeded 또는 Development Failed terminal 승격
[x] Editor/PIE Waiting/Observer ON 표시, 차단 방 필터와 실패 notice 확인
[x] Windows Development 두 계정·두 기기 Create/Find/Join/Leave/Invite/Host disconnect
[x] N/A (Phase 16) - Windows Shipping target compile과 Debug 기능 비노출 확인. 전체 Build/Cook/Stage/Package/Launch smoke는 후속 콘텐츠 통합/릴리스 Gate로 이관
```

수동 검증 절차와 근거는 `docs/checklists/Phase_16_Editor_Verification_Checklist.md`를 단일 기준으로 사용한다.

---

## 8. 다음 Phase로 넘길 것

```text
온라인 UX가 안정되면 관리국 룸과 이상구역의 블록아웃/상호작용 감각을 강화한다.
```

---

## 변경 기록

### v0.1
- Phase 16 개별 Phase 문서 초안 작성
- Steam Lobby UX 완성 범위와 non-goals 정리

### v0.2
- Steam UX 결과의 RP Room 표시 데이터 변환, Room metadata 한계, URPSessionSubsystem 분리 후보 기준 추가

### v0.3
- 제품 멀티플레이 Steam 고정 결정 반영
- UI는 Steam API를 직접 호출하지 않고 URPSessionSubsystem / RP Room 표시 데이터 경계를 유지하는 기준으로 변경

### v0.4
- Phase 15 Done 이후 다음 착수 후보 `Next`로 승격
- Phase 12~15 선행 검증 완료를 반영하고 실제 착수 전 Phase 16 Kickoff Plan 작성은 미완료로 유지

### v0.5
- Phase 16 착수 전 clean main/origin main 확인과 `phase/16` 통합 브랜치 생성을 선행 조건에 추가
- Phase 16 하위 작업은 모두 `phase/16`에서 분기하고 같은 통합 브랜치로 복귀하도록 명시

### v0.6
- `main == origin/main == 4194b83`과 clean 작업 트리를 재확인
- 승인된 `Phase_16_Kickoff_Plan.md`를 추가하고 `phase/16` 통합 브랜치에서 Phase를 Current로 전환

### v0.7
- Phase 16 C++ 하위 브랜치 5개의 `phase/16` 통합 상태 반영
- Work Report, Editor Verification Checklist, Steam Packaging Guide 연결
- 코드/로컬 Gate와 WBP/PIE/두 기기/Shipping 잔여 Gate 분리

### v0.8
- acknowledged blocking action은 history에 남기되 Session Notice UI에서 다시 표시하지 않도록 보강
- Hosted metadata/StartSession 실패를 `HostedState` typed blocking notice로 전달
- Create/Join timeout 뒤 provider 지연 완료를 받은 후 cleanup하고 그 전 재요청을 막는 recovery barrier 추가
- `RP.Session.Recovery`를 추가하고 Session 8/8, Unity/Non-Unity, Mission/Phase 11 회귀 재통과
- hardening commit/Phase 통합과 수동 WBP/PIE/Steam Gate는 미완료로 유지

### v0.9
- hardening `f3653c3`을 `phase/16`에 `2c7f4ca`로 로컬 통합
- schema V3, 친화적 위치명, 기본 OFF Host Late Join 정책과 revision coalescing 추가
- GameState mission commit -> GameMode session mirror/Observer 권위 경로로 단일화
- PlayerState participation 복제, fixed spectating, Succeeded 승격, Ready 차단 추가
- Room/Ready/RoomSettings/Native Observer Overlay 계약과 Session 10/10 Automation 추가
- WBP/PIE/두 기기 Steam 근거 전까지 Current 유지

### v0.10
- Late Join feature `d4c0629`과 `phase/16` merge `15b1ccd` 로컬 통합
- 최종 Unity/Non-Unity, Session 10/10, Mission Selection 3/3, Phase 11 closure smoke 재통과
- Content/Config/Build/Target 및 `.uasset`/`.umap` 비변경을 확인하고 수동 WBP/PIE/Steam Gate만 잔여로 유지

### v0.11
- Steam `joinable=false` Lobby가 새 검색에서 제외되는 provider 동작을 명시
- InProgress OFF/Full의 실환경 미노출 검증과 synthetic Row 문구 검증을 분리
- Editor Verification Checklist 각 소제목에 기능 목적과 검증 경계를 추가하고 2.1 상세 절차를 연결

### v0.12
- 제품 JoinMenu를 참가 가능한 Waiting/Observer ON 방만 노출하는 정책으로 확정
- provider 결과에서도 OFF/Full/Version mismatch/invalid room을 RP 검색 캐시에서 제거
- 차단 문구 검증은 초대/경합 방어용 Automation으로 유지하고 수동 Row 노출 요구를 제거

### v0.13
- Session Notice Widget이 outer `UCommonActivatableWidget` 활성 수명을 추적해 비활성 메뉴 event를 무시하고 Deactivate 시 nonblocking notice를 즉시 clear
- 새로 활성된 메뉴에서는 확인 전 BlockingError만 복원하고 Pending/Success/Information/일반 Error는 이전 메뉴에서 가져오지 않도록 분리
- Success/Information/일반 Error 5초 Native auto-dismiss와 Blocking acknowledgement 유지 정책을 추가
- UE 5.8 Unity RPEditor Development과 `RP.Session` 10/10(warnings 0) Iteration 통과, Editor WBP 메뉴 전환 검증은 잔여로 유지

### v0.14
- `URPJoinMenuScreenBase`가 JoinMenu 활성 시 Find를 시작·소유하고 Deactivate/Back에서 진행 중 검색을 취소하도록 추가
- `URPSessionSubsystem::CancelFindRooms`가 provider cancel, delegate/timeout, cache와 nonblocking action을 함께 초기화해 늦은 완료 메시지를 차단
- 검색 Pending은 완료/화면 이탈까지 유지하고 Rooms found/No rooms found는 현재 JoinMenu에서 5초 표시하는 정책으로 정리
- UE 5.8 Unity RPEditor Development과 `RP.Session` 10/10(warnings 0) Iteration 통과, WBP Reparent와 두 Back 경로 Editor 검증은 잔여로 유지

### v0.15
- Host disconnect/Join travel failure delegate 안의 즉시 OpenLevel을 제거하고 GameInstance 수명의 단일 pending failure return으로 직렬화
- World가 null인 pending connection failure도 PendingNetDriver WorldContext의 OwningGameInstance로 판별
- Engine Title fallback이 먼저 load돼도 PostLoadMap에서 Multiplayer menu로 교정하는 완료 조건과 Steam 패키지 검증 항목 추가

### v0.16
- 패키지 로그에서 Multiplayer menu travel 완료 뒤 프런트 UI bootstrap이 없어 검은 화면이 된 원인을 확인
- 예기치 않은 Network/Travel/Host disconnect의 최종 목적지를 제품 Frontend world인 `L_RPTitleScreen`으로 분리
- Engine이 Title을 먼저 load하면 RP corrective travel 없이 복귀 완료로 인정하고, 정상 Leave의 Multiplayer menu 복귀는 유지
- `WBP_RPTitleScreenMenu`에 동일 `WBP_RPSessionNotice`를 추가하는 사용자 WBP 작업과 Title blocking popup 검증 항목 추가
- UE 5.8 incremental Unity 빌드와 전체 RP Automation 13/13(`RP.Session` 10/10, warnings 0), `git diff --check` Iteration 통과

### v0.17
- Phase 14의 표시 전용 Ready Panel 계약을 Phase 16 Invite UI에도 재적용
- `InviteButton` 소유를 `URPReadyPanelBase`/`WBP_RPBureauReadyPanel`에서 Host 방 관리 화면인 `URPRoomSettingsWidgetBase`/`WBP_RPRoomSettings`로 이동
- Ready Panel은 Player/Ready/DOOR ROOM/Observer 상태 표시만 담당하고 Steam Invite 요청은 Room Settings에서 `URPSessionSubsystem`으로 전달하도록 고정

### v0.18
- HostMenu와 Room Settings의 `Allow Join During Mission` 표현을 동일한 OFF/ON `RPSelector` UX로 통일
- Room Settings Native binding을 `AllowJoinDuringMissionSelector`/`URPOptionSelectorBase`로 변경하고 pending 읽기 전용 잠금과 완료값 무방송 복구를 유지
- Editor Checklist의 의존 순서를 Room Settings 기반 구성 2.4 -> Invite 연결 2.5로 교정

### v0.19
- WidgetComponent 기반 Mission/Ready 표시 패널은 `URPFrontendScreenBase`의 기본 CommonUI Back 등록을 해제해 첫 PIE parent activatable ensure를 차단
- Selector의 BP 표현 동기화와 외부 changed multicast를 분리해 Room Settings 무방송 실제값 복원에서도 `OFF`/`ON` 표시를 즉시 갱신
- UE 5.8 incremental Unity와 전체 RP Automation 17/17 통과, 실제 첫 PIE와 Host Create ON 표시 확인은 잔여 Editor 검증으로 유지

### v0.20
- Phase 16 체크리스트의 WBP, Editor, PIE 1 Player, PIE 2~3 Players와 Windows Development 두 계정·두 기기 Steam 검증 완료
- 전체 RP Automation 20/20과 Editor/Game Development/Shipping target build 근거를 최종 Snapshot으로 확정
- 실제 레벨 왕복/다음 미션 E2E는 `ACT-19-003`, 전체 Shipping Cook·Stage·Package·Launch는 후속 콘텐츠 통합/릴리스 Gate로 비차단 이관
- 사용자 Done 승인에 따라 Work Report, CODEX_INDEX와 Roadmap `[MS-16-DONE]`을 동시에 완료 처리
