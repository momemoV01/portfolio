---
title: "Phase 16 Editor Verification Checklist - Steam Lobby UX Completion"
description: "Phase 16 Editor Verification Checklist - Steam Lobby UX Completion의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "checklists/Phase_16_Editor_Verification_Checklist.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 16 Editor Verification Checklist - Steam Lobby UX Completion"
order: 37
---
작성일: 2026-07-14

관리 위치:

```text
docs/checklists/Phase_16_Editor_Verification_Checklist.md
```

## 0. 목적과 상태 경계

Codex가 구현한 C++ 세션/UX 계약 뒤, 사용자가 기존 WBP를 연결하고 Editor/PIE 및 Steam 두 기기에서 확인해야 하는 항목을 분리한다.

```text
C++ build/Automation/headless smoke 성공 != WBP 연결 완료
WBP/PIE 성공 != Windows Development 두 기기 Steam 완료
Development 두 기기 성공 != Shipping release 준비 완료
```

실제 확인한 항목만 `[x]`로 바꾼다. 문제 발생 시 양쪽 로그와 정확한 재현 순서를 먼저 남긴다.

---

## 1. Codex 로컬 Gate

이 구간은 C++가 컴파일되고 자동화된 정책 판정이 통과했는지 확인한다. WBP 배치, 실제 화면, PIE 네트워크 동작이나 Steam 검색 성공을 대신하지 않는다.

`phase/16` 통합 기준 Gate:

- [x] `phase/16` 통합 code head `00f4f8c`에서 UE 5.8 preflight 성공 - 2026-07-13
- [x] Unity RPEditor Win64 Development 성공 - `Result: Succeeded`
- [x] `-DisableUnity` RPEditor Win64 Development 성공 - `Result: Succeeded`
- [x] `RP.Session` Automation 7/7 성공
- [x] `RP.Mission.Selection` Automation 3/3 성공
- [x] Phase 11 closure smoke가 `MissionCompleted`, `Mission Phase: Succeeded`, `SUCCEEDED`로 완료
- [x] Phase 13~15 정적/commandlet 회귀 확인 - Session/Mission Automation + Phase 11 closure
- [x] `main...phase/16` `git diff --check` 성공
- [x] 35개 변경 파일 audit에서 `Content`, `Config`, `RP.Build.cs`, Target.cs 변경 없음

`fix/phase16-session-hardening` 작업 트리 Gate:

- [x] UE 5.8 preflight 성공 - Engine `5.8.0`, Association `5.8`
- [x] Unity RPEditor Win64 Development 성공 - `Result: Succeeded`
- [x] `-DisableUnity` RPEditor Win64 Development 성공 - `Result: Succeeded`
- [x] `RP.Session` Automation 8/8 성공 - `Recovery`, `UIContracts` 포함
- [x] `RP.Mission.Selection` Automation 3/3 성공
- [x] Phase 11 closure smoke가 `MissionCompleted`, `Mission Phase: Succeeded`, `SUCCEEDED`로 완료
- [x] scoped `git diff --check` 및 prohibited-path audit 성공
  - `Content`, `Config`, `RP.Build.cs`, Target.cs 변경 없음

`feat/phase16-late-join-observer` 로컬 Gate:

- [x] UE 5.8 preflight 성공 - Engine `5.8.0`, Association `5.8`
- [x] Unity RPEditor Win64 Development 성공 - `Result: Succeeded`
- [x] `-DisableUnity` RPEditor Win64 Development 성공 - `Result: Succeeded`
- [x] `RP.Session` Automation 10/10 성공 - `HostedPolicy`, `LateJoinPolicy`, `UIContracts` 포함
- [x] `RP.Mission.Selection` Automation 3/3 성공
- [x] Phase 11 closure smoke가 `MissionCompleted`, `Mission Phase: Succeeded`, `SUCCEEDED`로 완료
- [x] feature commit `d4c0629`/`phase/16` 통합 `15b1ccd` 뒤 최종 `git diff --check`와 prohibited-path audit

2026-07-20 Development Mission Outcome 로컬 Gate:

- [x] UE 5.8 preflight와 RPEditor Win64 Development build 성공
- [x] RP Win64 Development와 Shipping build 성공
- [x] `RP.Mission.State.TerminalTransitions` 1/1 성공
- [x] 정확한 `StartsWith:RP` 전체 RP Automation 20/20 성공 - failed 0, warnings 0
- [x] report `Saved/Automation/Pipeline/manual-20260720-mission-outcome-rp20-scoped/index.json`

문서 정적 확인:

- Markdown 상대 링크 성공
- `Docs/mkdocs.yml` nav 대상 경로 성공
- 현재 system Python에 `mkdocs` 모듈이 없어 site build는 N/A며 Phase 차단 조건이 아님

위 항목은 아래 WBP/PIE/Steam 검증을 대신하지 않는다.

---

## 2. WBP 연결

이 구간은 C++가 제공하는 provider-neutral 표시 데이터와 요청 API를 기존 Blueprint Widget에 연결하는 작업이다. 여기서는 레이아웃 자체보다 정확한 Widget 이름, 이벤트 경로와 런타임 데이터 갱신 여부를 확인한다.

### 2.1 Room Row

Room Row는 Steam 검색 결과 한 건을 방 이름, Host, 위치, 상태, 인원, Ping과 참가 가능 여부로 표현한다. `Allow Join During Mission`뿐 아니라 버전, 정원과 Room identity를 모두 반영해야 한다.

제품 JoinMenu는 현재 참가 가능한 방만 노출한다. Steam이 돌려준 결과라도 InProgress OFF, Full, Version mismatch 또는 invalid room이면 RP 검색 캐시에서 제거한다. 차단 문구는 초대/경합/Automation을 위한 방어용 fallback이며 제품 목록 노출 요구가 아니다. 상세 설명과 절차는 [Checklist 2.1 - Room Row / Steam Join Policy](../procedures/Phase_16/Checklist_2_1_Room_Row_Join_Policy.md)를 따른다.

대상:

```text
Content/RP/Blueprints/Widgets/Multipllayer/WBP_RPRoomListItem
```

- [x] 부모가 `URPRoomListItemBase`인지 확인한다. ✅ 2026-07-14
- [x] 기존 `RoomNameText`, `PlayersText`, `PingText`, `JoinButton` binding을 유지한다. ✅ 2026-07-14
- [x] `HostText`, `MapText`, `RoomStateText`, `JoinBlockReasonText`를 정확한 이름으로 추가한다. ✅ 2026-07-14
- [x] `SetRoomListItemFromSearchResult` 한 번으로 모든 표시값이 갱신된다. ✅ 2026-07-14
- [x] Ping이 음수이거나 Steam unknown sentinel `9999`면 `-- ms`가 보인다. ✅ 2026-07-14
- [x] Waiting은 `WAITING`, InProgress는 `IN PROGRESS`로 보인다. ✅ 2026-07-14
- [x] Waiting `MapText`는 실제 맵명 대신 `BUREAU ROOM`으로 보인다. ✅ 2026-07-14
- [x] 미션 시작 뒤 `MapText`는 선택 Mission의 `LocationDisplayName`으로 보인다. ✅ 2026-07-14
- [x] C++ 표시 계약에서 InProgress OFF 검색 결과는 Join 비활성 + `MISSION IN PROGRESS`다. `RP.Session.UIContracts`로 검증했다.
- [x] InProgress ON은 Join 활성 + `JOIN AS OBSERVER · NEXT MISSION`이다. ✅ 2026-07-14
- [x] C++ 참가 판정에서 Full/Version mismatch는 Observer 안내보다 `ROOM FULL`/`VERSION MISMATCH`를 우선한다. `RP.Session.JoinPolicy`로 검증했다.
- [x] Steam 실제 검증에서 InProgress OFF 전환 뒤 Client Refresh 시 방이 검색에서 빠지고 Overlay/친구 Join Game/직접 참가도 거절된다. ✅ 2026-07-14
- [x] JoinMenu 노출 정책은 `bCanJoin=true`인 Waiting 또는 Observer ON 방만 유지하고 OFF/Full/Version mismatch를 숨긴다. `RP.Session.JoinPolicy`로 검증했다.

### 2.2 Join Menu Stable Request

Stable Request는 Refresh 전후로 배열 index가 바뀌어 다른 방에 들어가는 문제를 막는 참가 계약이다. 선택한 방을 `SearchGeneration + RoomId`로 식별하고, Refresh하면 이전 선택을 폐기하는지 확인한다.

- [x] `OnRPRoomListItemStableJoinRequested`의 `JoinRequest`를 부모 Join 화면으로 전달한다. ✅ 2026-07-14
- [x] 부모가 `URPSessionSubsystem.JoinRoom(GetOwningPlayer(), JoinRequest)`를 호출한다. ✅ 2026-07-14
- [x] 신규 stable event와 기존 `OnRPRoomListItemJoinRequested` index event를 같은 Join 호출에 동시에 연결하지 않는다. ✅ 2026-07-14
- [x] Refresh 뒤 이전 selected request를 버리고 선택/Join button 상태를 초기화한다. ✅ 2026-07-14
- [x] `OnRoomsUpdated` 결과 배열의 각 item에 `SetRoomListItemFromSearchResult`를 호출한다. ✅ 2026-07-14
- [x] `WBP_RPJoinMenu` 부모를 `URPJoinMenuScreenBase`로 바꾼다. ✅ 2026-07-14
- [x] 기존 Construct/Activated의 직접 `FindRooms` 호출을 제거하고 Refresh 버튼은 상속된 `RefreshRooms`만 호출한다. ✅ 2026-07-14
- [x] 검색 Pending 중 Back하면 provider Find가 취소되고 빈 `OnRoomsUpdated`로 목록/선택이 초기화된다. ✅ 2026-07-14
- [x] 검색 완료 뒤 Back은 현재 notice만 지우며 완료된 provider 작업을 다시 취소하지 않는다. ✅ 2026-07-14

### 2.3 Session Notice

Session Notice는 Create/Find/Join/Leave 결과와 실패 이유를 Host/Join/Multiplayer/Title 메뉴에서 같은 방식으로 보여 주는 공통 안내 기능이다. Compact 안내, 취소 가능한 Join `ModalPending`, 사용자의 확인이 필요한 blocking 오류를 구분하고 Host disconnect 같은 오류가 Title 복귀 뒤에도 한 번 전달되는지 확인한다.

한 WBP에서 Compact Notice와 Blocking Popup을 자동 전환하는 상세 구현과 검증은 [Checklist 2.3 - Session Notice](../procedures/Phase_16/Checklist_2_3_Session_Notice.md)를 따른다.

대상 메뉴:

```text
WBP_RPHostMenu
WBP_RPJoinMenu
WBP_RPMultiplayerMenu
WBP_RPTitleScreenMenu
```

- [x] 부모 `URPSessionNoticeWidgetBase`인 재사용 `WBP_RPSessionNotice`를 만든다. ✅ 2026-07-14
- [x] `NoticeRoot`, `NoticeMessageText`, `AcknowledgeButton`을 정확한 이름으로 둔다. ✅ 2026-07-14
- [x] `ConnectionThrobber`(Circular Throbber), `CancelJoinButton`(`URPButtonBase` 파생 WBP 또는 Button)을 정확한 이름으로 추가한다. ✅ 2026-07-15
- [x] `BackgroundBlur`, `DimBackground`, `ModalInputBlocker`의 정확한 이름을 유지해 Native가 `ModalPending`/`BlockingError`에서 자동 표시하도록 한다. ✅ 2026-07-15
- [x] Host/Join/Multiplayer 세 메뉴가 같은 Notice WBP를 배치한다. ✅ 2026-07-14
- [x] `WBP_RPTitleScreenMenu`에도 같은 Notice WBP를 최상위 ZOrder로 한 번 배치한다. ✅ 2026-07-15
- [x] `On RP Session Notice Changed`에서 Pending/Success/Information/Error/BlockingError style을 구분한다. ✅ 2026-07-14
- [x] 새 `ModalPending` pin을 중앙 Popup 스타일로 연결한다. Join 중에는 `ConnectionThrobber`와 `CancelJoinButton`이 보이고 Acknowledge는 숨긴다. ✅ 2026-07-15
- [x] Pending/Success/No Rooms는 메뉴 입력을 막지 않는 상태 문구다. ✅ 2026-07-14
- [x] Pending/Success/Information/일반 Error는 현재 활성 메뉴에만 표시되고, 메뉴 전환 즉시 사라져 다른 메뉴에서 재표시되지 않는다. Success/Information/Error의 Native auto-dismiss도 같은 메뉴에 머물 때 적용된다. ✅ 2026-07-14
- [x] `Searching for rooms...`는 검색 완료 또는 JoinMenu 비활성까지 유지되고, Rooms found/No rooms found는 현재 JoinMenu에서 약 5초 유지된다. ✅ 2026-07-14
- [x] `Connecting to room...`은 auto-dismiss되지 않는 중앙 모달이며 Cancel 클릭 또는 Join terminal 결과 전까지 유지된다. ✅ 2026-07-14
- [x] `CancelJoinButton` 클릭은 BP delegate를 새로 만들지 않아도 Native `CancelJoinRoom`에 연결되고, ESC/게임패드 Back도 JoinMenu에 머문 채 같은 취소를 수행한다. ✅ 2026-07-14
- [x] Provider unavailable/Join failure/Timeout/Host disconnect는 policy대로 확인형 안내다. ✅ 2026-07-14
- [x] blocking notice의 확인 버튼이 `AcknowledgeSessionNotice`를 호출하거나 native auto-binding을 사용한다. ✅ 2026-07-14
- [x] failure return 뒤 생성된 Title menu에서 Host disconnect/Join failure blocking notice가 한 번 보인다. ✅ 2026-07-14

### 2.4 HostMenu / Room Settings / Observer UI

이 구간은 방 생성 시 기본 Late Join 정책, 방 생성 후 Host의 실시간 정책 변경, Observer의 관전 안내와 Ready 제외 표시를 하나의 UX로 연결한다. 설정 요청 중 입력 잠금과 provider 적용 실패 시 실제 값 복구도 포함한다.

- [x] `WBP_RPHostMenu`에 `Allow Join During Mission` ON/OFF `RPSelector`를 추가하고 `FRPCreateRoomOptions.bAllowJoinDuringMission`에 연결한다. ✅ 2026-07-15
- [x] 기본값은 OFF이며 `Make FRPCreateRoomOptions` 노드를 Refresh한 뒤 제거된 legacy 핀이 남아 있지 않은지 확인한다. ✅ 2026-07-15
- [x] `URPRoomSettingsWidgetBase` 부모의 `WBP_RPRoomSettings`를 만든다. ✅ 2026-07-15
- [x] 공용 `RPSelector` WBP의 최상위 SizeBox 이름을 정확히 `OptionRootSizeBox`로 두고, 전체 행 높이는 `DefaultSelectorConfig.Control.OptionRootHeightOverride`에서 조절한다. 전체 폭을 부모 Fill로 쓸 때 Root Width Override는 끈다. ✅ 2026-07-19
- [x] `AllowJoinDuringMissionSelector`, `RoomSettingsStatusText`를 정확한 이름으로 둔다. Selector는 `URPOptionSelectorBase` 파생 WBP를 사용한다. ✅ 2026-07-19
- [x] Selector Options를 `OFF`/`ON` OptionId와 같은 표시 텍스트로 구성하고 기본값을 `OFF`로 둔다. ✅ 2026-07-19
- [x] `WBP_RPInGameMenu`에서 Listen Host만 Room Settings 하위화면에 진입할 수 있다. ✅ 2026-07-19
- [x] `ARPPlayerController`가 `OpenInGameMenuAction`을 `Started`로 바인딩하고 메뉴 생성·활성화·Back 닫기·gameplay 입력 복구를 Native로 소유한다. ✅ 2026-07-18
- [x] `BP_RPPlayerController` Class Defaults에서 `OpenInGameMenuAction = IA_OpenInGameMenu`, `InGameMenuScreenClass = WBP_RPInGameMenu`로 지정한다. ✅ 2026-07-19
- [x] `BP_RPCommonUIInputData`의 `Enhanced Input Back Action = IA_UI_Back`인지 확인한다. ✅ 2026-07-19
- [x] 항상 활성인 `IMC_Player`에서 `IA_OpenInGameMenu = Escape`, `IA_UI_Back = Escape` 두 매핑을 둔다. `IMC_UI` 추가/제거 그래프는 만들지 않는다. ✅ 2026-07-19
- [x] `BP_RPPlayerController`와 `WBP_RPInGameMenu`의 기존 Create Widget/Add To Viewport/Remove From Parent/Set Input Mode/Set Ignore Move·Look/`On RP In Game Menu Open Requested` 메뉴 수명주기 그래프를 제거한다. ✅ 2026-07-19
- [x] Resume 버튼은 Owning Player를 `ARPPlayerController`로 Cast한 뒤 `CloseInGameMenuLocal`만 호출한다. ✅ 2026-07-19
- [x] `RoomSettingsPanel` Back은 Room Settings를 먼저 닫고, 다음 Back은 `WBP_RPInGameMenu`를 닫는다. ✅ 2026-07-19
- [x] 메뉴 Focus에서 WASD/방향키/Gamepad가 이동하고, Room Name Editable Text Focus 중 W/A/S/D는 문자로 입력된다. ✅ 2026-07-19
- [x] 검증 뒤 참조가 사라진 `IMC_UI` 에셋은 Unreal Editor에서 삭제한다. ✅ 2026-07-19
- [x] pending 중 Selector 입력이 잠기고 성공/실패 뒤 실제 적용값으로 복구된다. ✅ 2026-07-19
- [x] 방 생성에서 `Allow Join During Mission = ON`을 선택한 뒤 처음 연 Room Settings의 Selector와 상태 문구가 모두 `ON`으로 일치한다. 화면을 여는 것만으로 정책 변경 Pending이 다시 시작되지 않는다. ✅ 2026-07-19
- [x] Editor 재시작 후 첫 PIE에서 `RPMissionSelectionPanelNative`, Bureau Ready Panel 또는 `RPMissionTerminalScreenNative`의 `IA_UI_Back` parent activatable ensure가 다시 발생하지 않는다. Terminal은 E hold 확정과 Q/Escape 닫기도 함께 확인한다. ✅ 2026-07-20
- [x] Observer는 Native fallback 또는 파생 WBP로 `SPECTATING · ACTIVE NEXT MISSION`을 본다. ✅ 2026-07-19
- [x] Ready Player Row Observer는 `WAITING NEXT MISSION`이며 Ready count에 포함되지 않는다. ✅ 2026-07-19
![[Pasted image 20260715095255.png]]

### 2.5 Host Room Management Invite

Host Room Management Invite는 Bureau의 ESC 방 관리 화면에서 Steam 친구 초대 Overlay를 여는 진입점이다. Ready Panel은 월드 표시 전용으로 유지하고, Host만 사용하는 세션 조작은 먼저 완성한 Room Settings에 둔다. Blueprint가 Steam API를 직접 호출하지 않고 `URPSessionSubsystem` 경계를 사용하는지 확인한다.

대상:

```text
WBP_RPInGameMenu
└─ Content/RP/Blueprints/Widgets/Menus/SideMenu/WBP_RPRoomSettings
   (부모: URPRoomSettingsWidgetBase)
```

- [x] `WBP_RPRoomSettings` 부모가 `URPRoomSettingsWidgetBase`인지 확인한다. ✅ 2026-07-15
- [x] `WBP_RPRoomSettings`에 `InviteButton` 이름의 `URPButtonBase` 또는 일반 Button을 추가한다. ✅ 2026-07-15
- [x] Host에서는 보이고 Client에서는 숨겨진다. ✅ 2026-07-15
- [x] 다른 session operation Pending 중에는 Native에서 비활성화되고 완료 뒤 다시 활성화된다. ✅ 2026-07-15
- [x] 클릭은 Native `RequestInviteOverlay`로 자동 연결되므로 별도 BP 클릭 그래프를 만들지 않는다. ✅ 2026-07-15
- [x] 별도 Steam API Blueprint node를 추가하지 않는다. ✅ 2026-07-15
- [x] `WBP_RPBureauReadyPanel`에는 `InviteButton`과 Steam/Session 조작 그래프가 없다. ✅ 2026-07-15

저장 후 `Content` diff에는 실제로 편집한 WBP만 남긴다. `Config/DefaultEditor.ini`와 `Docs/docs/.obsidian` 자동 변경은 섞지 않는다.

---

## 3. Editor / PIE 기능 확인

이 구간은 저장된 WBP와 Native 코드가 Editor 및 Listen Server 환경에서 실제로 함께 동작하는지 확인한다. Steam Overlay와 두 계정 검색 정책은 PIE 결과만으로 완료 처리하지 않는다.

### 3.1 1 Player / Host

1 Player 검증은 Native class 로드, 메뉴/맵 열기, Host Create와 Host 전용 UI 노출 같은 로컬 조립 상태를 빠르게 확인한다. 원격 Client 참가와 서버 권위 Observer 전이는 증명하지 않는다.

- [x] UE 5.8 Editor를 재시작하고 새 native class/부모 로드 오류가 없다. ✅ 2026-07-19
- [x] `L_MultiplayerMenu_Dev`와 `L_BureauRoom_Dev`가 정상 로드된다. ✅ 2026-07-19
- [x] JoinMenu 진입 즉시 `Searching for rooms...`가 보이고, 검색 중 즉시 Back해 HostMenu로 이동해도 늦은 `No rooms found`가 나타나지 않는다. ✅ 2026-07-19
- [x] JoinMenu 검색 완료 뒤 Back해도 완료 문구가 HostMenu로 따라오지 않는다. ✅ 2026-07-19
- [x] Host Create가 Pending -> Success로 표시되고 Bureau listen travel이 성공한다. ✅ 2026-07-19
- [x] Ready Panel에는 InviteButton이 없고 Player/Ready/구역/Observer 현황만 표시된다. ✅ 2026-07-19
- [x] Host가 ESC Room Settings에 들어가면 InviteButton이 보이며 Client에게는 Room Settings 진입 또는 버튼이 노출되지 않는다. ✅ 2026-07-19
- [x] Steam provider가 아닌 임시 진단 환경에서는 Overlay/Provider unavailable 안내가 확인형으로 보인다. ✅ 2026-07-19

### 3.2 2 Players / Listen Server

2 Players Listen Server 검증은 Host/Client Ready, Mission Start, PreLogin 차단, Observer 생성·관전·승격처럼 서버 권위 흐름을 확인한다. 한 PC의 PIE이므로 실제 Steam 친구 초대와 provider 검색 결과의 최종 근거는 아니다.

- [x] 중복 Create/Find/Join/Leave 입력이 두 operation을 동시에 시작하지 않는다. ✅ 2026-07-19
- [x] Client Leave 뒤 Host session과 Ready 상태가 유지된다. ✅ 2026-07-19
- [x] Host/Client Ready와 Mission Start 기존 흐름이 유지된다. ✅ 2026-07-19
- [x] Mission Start 뒤 Host room metadata가 InProgress로 전환된다. ✅ 2026-07-19
- [x] 기본 OFF에서 Mission 진행 중 `PreLogin`이 원격 신규 참가를 `RP_MISSION_IN_PROGRESS`로 거절한다. ✅ 2026-07-19
- [x] ON에서 신규 참가자는 일반 `ARPCharacter` 없이 LateJoinObserver가 된다. ✅ 2026-07-19
- [x] Observer 이동/시점/Ready/상호작용이 차단되고 활성 팀원 Pawn 하나만 고정 관전한다. ✅ 2026-07-19
- [x] `IA_SpectateCycle` Axis1D를 만들고 `IMC_Player`에 LMB `+1`, RMB `-1`로 매핑한 뒤 `BP_RPPlayerController.SpectateCycleAction`에 지정한다. ✅ 2026-07-20
- [x] Observer 상태에서 LMB/RMB가 Active + Pawn 대상만 다음/이전으로 순환하고, 인게임 메뉴 또는 다른 모달 UI 클릭 중에는 관전 대상이 바뀌지 않는다. ✅ 2026-07-20
- [x] 관전 대상 Player가 나가면 다른 Active Pawn으로 자동 전환한다. ✅ 2026-07-20
- [x] Host가 ON/OFF를 실시간 변경하고 기존 Observer는 OFF 전환 후에도 유지된다. ✅ 2026-07-20
- [x] Mission `Succeeded` 뒤 Observer가 Active/Pawn/입력 복구되고 Ready=false다. ✅ 2026-07-20

PIE는 Steam Overlay와 두 계정 제품 흐름의 최종 근거가 아니다.

### 3.3 3 Players / Observer Retarget Test Harness

실제 Steam 계정 세 개 없이 관전 대상 순환과 이탈 자동 전환만 검증하는 개발 전용 절차다. 제품 Late Join 입장 정책의 대체 근거로 사용하지 않는다.

- [x] PIE를 `3 Players / Play As Listen Server`로 시작한다. ✅ 2026-07-20
- [x] Host에서 `RPPrintObserverTargets`로 PlayerId와 Active Pawn을 확인한다. ✅ 2026-07-20
- [x] Host에서 `RPForceLateJoinObserver <PlayerId>`를 실행해 한 Player를 Observer로 전환한다. ✅ 2026-07-20
- [x] Observer 창에서 LMB/RMB로 두 Active Pawn 사이를 순환하고 `RPPrintObserverTargets` 로그가 현재 ViewTarget을 표시하는지 확인한다. ✅ 2026-07-20
- [x] 현재 관전 중인 비-Host Client에서 `disconnect`를 실행하고 남은 Active Pawn으로 자동 전환되는지 확인한다. ✅ 2026-07-20
- [x] 대상이 하나만 남은 상태에서 LMB/RMB를 눌러도 Observer 자신, 다른 Observer 또는 Pawn 없는 Player를 선택하지 않는다. ✅ 2026-07-20

### 3.4 Development Mission Start Shortcut (Non-blocking)

제품 Ready UI 검증과 분리된 반복 개발용 smoke다. 미션은 사용자가 Terminal에서 먼저 선택하고 Host 콘솔에서 `RPDevReadyAllAndStartMission`을 실행한다. 이 항목은 제품 Gate를 대신하거나 Phase 16을 차단하지 않는다.

- [x] PIE 2 Players에서 Ready=false인 두 Active Player가 모두 Ready=true로 복제되고 `Server_StartMission succeeded`가 출력된다. ✅ 2026-07-20
- [x] Observer가 있으면 Ready=false와 `WAITING NEXT MISSION`을 유지하고 Active Ready 집계에서 제외된다. ✅ 2026-07-20
- [x] Client 창에서 같은 명령을 실행하면 권위 경고와 함께 거절되고 상태를 변경하지 않는다. ✅ 2026-07-20

### 3.5 Development Debug HUD (Non-blocking)

화면형 Debug 도구의 조립과 권위 경계를 확인하는 개발 편의 검증이다. 제품 Ready UI, Client별 실제 요청, Steam 참가 또는 Shipping 제품 Gate를 대신하지 않는다. 상세 계약은 [Debug HUD Guide](../guides/Debug_HUD_Guide.md)를 따른다.

- [x] PIE 시작 시 `URPDebugHUDWidget` 상태가 `Hidden`이며 Debug 화면이 자동 노출되지 않는다. ✅ 2026-07-20
- [x] 상단 숫자열 `0`이 Status를 열고 다시 `0`을 누르면 닫는다. Status는 cursor, move/look, 제품 input mode를 바꾸지 않는다. ✅ 2026-07-20
- [x] 상단 숫자열 `9`가 User Management를 열고 다시 `9`를 누르면 닫는다. ✅ 2026-07-20
- [x] Status 중 `9`, User Management 중 `0`을 누르면 두 화면이 겹치지 않고 교체된다. ✅ 2026-07-20
- [x] User Management를 닫거나 Status로 전환하면 cursor, 이동, 시점 입력이 정상 복구된다. ✅ 2026-07-20
- [x] In-Game Menu, Mission Terminal 또는 다른 cursor 기반 제품 modal이 열려 있을 때 `9`가 User Management를 새로 열지 않는다. ✅ 2026-07-20
- [x] Host User Management 행에 PlayerId, Name, Participation, Ready, Ping, Pawn이 표시된다. ✅ 2026-07-20
- [x] Host의 `SET READY` / `CLEAR READY`가 `RPDevSetPlayerReady` 경계로 대상 Active PlayerState에 복제된다. ✅ 2026-07-20
- [x] LateJoinObserver와 Non-RP PlayerState의 Ready 버튼이 비활성이고 `READY ACTIVE + START` 대상에서도 제외된다. ✅ 2026-07-20
- [x] `START MISSION`은 기존 Host/전체 Active Ready/Terminal 선택/Mission 상태 검증을 우회하지 않는다. ✅ 2026-07-20
- [x] `READY ACTIVE + START`는 Active Player만 Ready로 만든 뒤 기존 Start 경로를 호출한다. ✅ 2026-07-20
- [x] Client User Management는 Player 목록만 표시하고 `READ ONLY · HOST CONTROLS DISABLED` 상태로 모든 변경 버튼이 비활성이다. ✅ 2026-07-20
- [x] Shipping package에서 상단 숫자열 `0`/`9`, Debug HUD 생성과 CheatManager 명령이 모두 비활성이다. ✅ 2026-07-20

### 3.6 Development Mission Outcome Commands (Non-blocking) - 추후 컨텐츠 쪽 작업들어가면 재검증 진행예정

성공·실패 terminal 결과 뒤 Session/Observer/UI 반응을 실제 콘텐츠 없이 빠르게 확인하는 개발용 검증이다. `Failed`는 실패 처리와 관리국 복귀까지 끝난 결과를 뜻하며 전멸 판정·정산·실제 레벨 왕복을 검증하지 않는다.

- [x] Host가 Terminal에서 미션을 선택하고 시작한 뒤 `RPDevForceMissionSuccess`를 실행하면 `Succeeded / ReturnToBureau / MissionCompleted / bMissionSucceeded=true`가 복제된다. ✅ 2026-07-20
- [x] 별도 실행에서 Host가 `RPDevForceMissionFailure`를 실행하면 `Failed / ReturnToBureau / MissionFailed / bMissionSucceeded=false`가 복제된다. ✅ 2026-07-20
- [x] 성공과 실패 모두 Session이 Waiting/BUREAU ROOM으로 돌아가고 기존 LateJoinObserver가 Active, Ready=false, 정상 Pawn 상태로 승격된다. ✅ 2026-07-20
- [x] 실패 뒤 Terminal에서 새 미션을 선택하면 다음 미션을 정상 시작할 수 있다. ✅ 2026-07-20
- [x] 선택 전·Start 전·Client 실행·이미 반대 terminal 결과인 상태에서는 명령이 상태를 바꾸지 않고 명확한 거절 로그를 남긴다. ✅ 2026-07-20
- [x] 호환 별칭 `RPForceCompleteMission`이 `RPDevForceMissionSuccess`와 같은 성공 결과를 만든다. ✅ 2026-07-20
- [x] Shipping package에서는 신규 두 명령과 호환 별칭 모두 사용할 수 없다. ✅ 2026-07-20

---

## 4. Windows Development - Steam 두 계정·두 기기

이 구간은 동일한 Development package와 서로 다른 Steam 계정/기기에서 실제 Lobby 검색, P2P travel, 초대, Join 정책과 실패 복구를 검증하는 제품 흐름 Gate다.

패키징/실행 준비는 [Phase 16 Steam Packaging Guide](../guides/Phase_16_Steam_Packaging_Guide.md)를 따른다.

### 4.1 기본 Create / Find / Join / Leave

기본 lifecycle 검증이다. Host가 방을 광고하고 Client가 검색·참가·퇴장·재참가하며, Client 동작이 Host 세션을 잘못 종료하지 않는지 확인한다.

- [x] 동일 package를 두 기기에 배포하고 서로 다른 Steam 계정으로 실행한다. ✅ 2026-07-20
- [x] 양쪽 diagnostics가 Steam provider와 SteamNetDriver를 표시한다. ✅ 2026-07-20
- [x] Host Create -> Waiting 광고 -> Bureau listen travel 성공 ✅ 2026-07-20
- [x] Client Find row에 방 이름, Host, 현재/최대 인원, Map, Ping, Waiting 표시 ✅ 2026-07-20
- [x] Client stable Join -> Bureau travel 성공 ✅ 2026-07-20
- [x] Client Leave -> Multiplayer menu 복귀, Host 유지 ✅ 2026-07-20
- [x] Client 재검색/재참가 성공 ✅ 2026-07-20
- [x] Host Leave/종료 뒤 새 방 생성 가능 ✅ 2026-07-20

### 4.2 Invite / Join Game

Room List 외의 Steam 진입 경로를 확인한다. Overlay 초대와 친구 메뉴 Join Game이 별도 우회 로직이 아니라 같은 RP Join 검증·실패 UX로 합류해야 한다.

- [x] Waiting Host가 ESC Room Settings의 InviteButton으로 Steam Overlay를 연다. ✅ 2026-07-20
- [x] 초대 수락 Client가 같은 common Join 경로로 Bureau에 들어온다. ✅ 2026-07-20
- [x] Steam 친구 메뉴 `Join Game`도 같은 결과다. ✅ 2026-07-20
- [x] 게임 시작 직후 초대 수락처럼 PlayerController가 늦는 경로가 첫 local world 준비 뒤 처리된다. ✅ 2026-07-20
- [x] 이미 방에 있는 사용자 또는 Pending operation 사용자는 자동 Leave 없이 안내를 받는다. ✅ 2026-07-20

### 4.3 Join Policy

Waiting/InProgress, Host 정책, 정원, BuildUniqueId가 Steam 검색 노출과 최종 참가 결과에 올바르게 반영되는지 확인한다. 제품 JoinMenu는 참가 가능한 Waiting/Observer ON 방만 노출하며 OFF/Full/Version mismatch는 provider 결과가 오더라도 RP에서 한 번 더 숨긴다.

- [x] Full Lobby는 새 Refresh 결과에 노출되지 않는다. ✅ 2026-07-20
- [x] 다른 BuildUniqueId Lobby는 provider 결과가 전달돼도 JoinMenu에 노출되지 않는다. ✅ 2026-07-20
- [x] 새 Find 뒤 이전 selection Join은 stale/unavailable로 거절된다. ✅ 2026-07-20
- [x] Waiting row `MapText`는 `BUREAU ROOM`이다. ✅ 2026-07-20
- [x] Mission Start + ON 뒤 row는 `IN PROGRESS` + 선택 위치명이다. ✅ 2026-07-20
- [x] OFF에서는 새 Refresh 결과에서 row가 미노출되고 Overlay/친구 Join Game/직접 참가가 모두 거절된다. ✅ 2026-07-20
- [x] ON에서는 Room List/Invite/Join Game이 Observer로 참가된다. ✅ 2026-07-20
- [x] Full/Version mismatch는 ON이어도 미노출되고 Invite/Join Game/직접 참가가 거절된다. ✅ 2026-07-20
- [x] N/A (Phase 16) - 실제 Waiting/Bureau 레벨 귀환과 다음 미션 정상 참가 E2E는 TargetMap/레벨 전환 및 콘텐츠 루프 구현 이후 `ACT-19-003`에서 검증한다. Phase 16에서는 Mission `Succeeded` 뒤 Active/Pawn/입력 복구/Ready=false까지 확인했다. ✅ 2026-07-20

### 4.4 Failure Recovery

Provider 실패, Timeout, Host 종료처럼 정상 성공 콜백이 오지 않는 상황에서 UI가 멈추거나 유령 세션이 남지 않는지 확인한다. 실패 이유를 안내하고 로컬 세션을 정리한 뒤 메뉴에서 다시 시도할 수 있어야 한다.

- [x] Steam 미실행 Development package에서 Create를 누르면 HostMenu를 떠나거나 provider Create/travel을 시작하지 않고 `Steam is not ready. Open Steam, sign in, then restart the game before creating a room.` 확인형 notice가 표시된다. ✅ 2026-07-20
- [x] Steam 미실행 상태에서 Create를 다시 눌러도 `AlreadyInRoom`으로 바뀌지 않고 같은 readiness 안내가 유지된다. ✅ 2026-07-20
- [x] Steam 로그인 뒤 게임 프로세스를 재시작하면 동일 입력으로 정상 Create/Waiting 광고/Bureau listen travel이 된다. ✅ 2026-07-20
- [x] Join provider 실패가 확인형 notice다. ✅ 2026-07-20
- [x] Create/Find/Join/Leave timeout이 확인형 notice다. ✅ 2026-07-20
- [x] blocking notice 확인 뒤 표시는 사라지고 action history는 diagnostics에 유지된다. ✅ 2026-07-20
- [x] hosted metadata/`StartSession` 실패가 `HostedState` typed blocking notice로 표시된다. ✅ 2026-07-20
- [x] Create/Join timeout 직후 재시도는 late callback 정리 전까지 Busy이며, 늦은 success/travel이 발생하지 않는다. ✅ 2026-07-20
- [x] Host process 강제 종료 뒤 Client 로컬 session이 정리된다. ✅ 2026-07-20
- [x] 방 참가 완료 뒤 Host process를 종료하면 Client가 `L_RPTitleScreen`으로 돌아가며 다시 `L_MultiplayerMenu_Dev`로 강제 이동하지 않는다. ✅ 2026-07-20
- [x] 위 Title 복귀 직후 `HOST DISCONNECTED`가 중앙에 한 번 표시되고, Multiplayer menu에 다시 들어가야 뒤늦게 보이는 형태가 아니다. ✅ 2026-07-20
- [x] Client가 Join/ClientTravel 중일 때 Host process를 종료해도 입력 불가 검은 화면으로 멈추지 않고 `L_RPTitleScreen`으로 돌아간다. ✅ 2026-07-20
- [x] Join 중 실패 복귀 직후 Title에서 `JOIN FAILED` 또는 연결 실패 blocking notice가 한 번 표시되고, 확인 뒤 Multiplayer/Join menu에 다시 진입할 수 있다. ✅ 2026-07-20
- [x] Join timeout 뒤 stale Row를 다시 눌러 Join failure를 받은 다음 Host가 같은 Steam 계정으로 방을 재생성해도 Client가 자동 접속하지 않는다. 새 검색 결과에서 사용자가 다시 Join해야만 접속한다. ✅ 2026-07-20
- [x] Join provider callback 또는 ClientTravel 중 `CANCEL`을 누르면 모달이 즉시 닫히고 Title로 강제 이동하지 않으며, Host가 방을 재생성해도 자동 접속하지 않는다. ✅ 2026-07-20
- [x] Cancel하지 않은 채 이전 Lobby에 접속 중 Host가 나갔다가 같은 endpoint로 새 Lobby를 만들어도 `RPExpectedRoomId` 불일치로 새 Lobby에 들어가지 않으며, Client 프로세스가 종료되지 않고 Title의 연결 실패 안내로 끝난다. ✅ 2026-07-20
- [x] 위 Room Instance 거절 뒤 새 Find 결과를 선택해 명시적으로 Join하면 새 Lobby에는 정상 접속한다. ✅ 2026-07-20
- [x] 사용자가 정상적으로 Leave하면 기존처럼 Multiplayer menu로 복귀하며 disconnect popup을 표시하지 않는다. ✅ 2026-07-20
- [x] Host Migration을 시도하지 않는다. ✅ 2026-07-20

---

## 5. Windows Shipping Smoke - 지금 말고 추후 컨텐츠 테스트때 진행 예정

Shipping Smoke는 개발용 콘솔과 Editor 의존성 없이 Build/Cook/Stage/Package 및 기본 메뉴 UI가 실행되는지 확인한다. 현재는 AppID 480 단일 기기 smoke이며 실제 제품 AppID 출시 승인이나 Shipping 두 기기 전체 회귀를 뜻하지 않는다.

- [ ] Shipping Build/Cook/Stage/Package 성공
- [ ] 실행 및 Title -> Multiplayer menu 진입 성공
- [ ] Shipping UI가 console/CheatManager 없이 동작한다.
- [ ] 현재 AppID 480 smoke이며 실제 제품 AppID release 완료로 기록하지 않는다.

Shipping 두 기기 전체 검증은 현재 Phase 필수 완료 기준이 아니다.

---

## 6. Phase 13~15 회귀

Phase 16의 세션·Observer 확장이 기존 Host 옵션, Room List 조작, Ready 복제와 Mission Select/Start/Complete 흐름을 깨지 않았는지 확인한다.

- [x] HostMenu room name/max players/public 입력 유지 ✅ 2026-07-20
- [x] Room List Refresh/selection/Back/focus 유지 ✅ 2026-07-20
- [x] Bureau Ready Panel Host/Client Ready 복제와 표시 전용 계약 유지 - Invite/Leave/Start 같은 세션 조작 없음 ✅ 2026-07-20
- [x] Mission Select/Start/Door Status/MissionCompleted 유지 ✅ 2026-07-20
- [x] Client Leave/재참가 뒤 Ready와 Mission 흐름 재실행 가능 ✅ 2026-07-20

---

## 7. Done 검수 자료

이 구간은 체크 결과를 Phase Done 판단에 다시 사용할 수 있도록 package, 로그와 스크린샷 위치를 모으는 증거 기록란이다. 실행하지 않은 검증은 빈칸으로 두고 추정으로 채우지 않는다.

```text
검증일:
phase/16 Late Join code integration: 15b1ccd
hardening commit/integration: f3653c3 / 2c7f4ca
late join feature commit/integration: d4c0629 / 15b1ccd
편집한 WBP 목록:
PIE 1 Player:
PIE 2 Players / Listen Server:
Development package 경로/hash:
Host log:
Client log:
Invite/Join Game screenshot:
Waiting/Location/Observer ON screenshot, InProgress OFF/Full/Version mismatch 미노출 로그:
Observer overlay/Ready row/승격 screenshot/log:
Host disconnect notice screenshot/log:
Shipping smoke:
비고:
```

모든 필수 항목과 근거가 끝나기 전에는 Phase 16을 Done으로 바꾸거나 `phase/16`을 `main`에 병합하지 않는다.
