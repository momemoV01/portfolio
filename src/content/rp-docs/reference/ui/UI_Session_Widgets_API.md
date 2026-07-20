---
title: "UI Session Widgets API Contract"
description: "UI Session Widgets API Contract의 공개 계약, 완료 신호, 수명주기와 실패 경계를 설명합니다."
section: "api"
sourcePath: "reference/ui/UI_Session_Widgets_API.md"
status: "Current"
documentType: "API Contract"
lastReviewed: "2026-07-19"
searchKeywords:
  - "URPJoinMenuScreenBase"
  - "URPRoomListItemBase"
  - "HostText"
  - "MapText"
  - "RoomStateText"
  - "JoinBlockReasonText"
  - "URPSessionNoticeWidgetBase"
  - "ModalPending"
  - "URPReadyPanelBase"
  - "URPReadyPlayerRowBase"
  - "URPRoomSettingsWidgetBase"
  - "AllowJoinDuringMissionSelector"
  - "InviteButton"
  - "LateJoinObserver"
order: 24
---
- **Status:** Current
- **Document Type:** API Contract
- **Domain:** UI / Session and Ready Presentation
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer, QA
- **Canonical Symbols:**
  - `URPJoinMenuScreenBase`
  - `FRPRoomListItemData`
  - `URPRoomListItemBase`
  - `ERPSessionNoticeTone`
  - `FRPSessionNoticeViewData`
  - `URPSessionNoticeWidgetBase`
  - `FRPReadyPlayerRowData`
  - `URPReadyPlayerRowBase`
  - `URPReadyPanelBase`
  - `URPRoomSettingsWidgetBase`
  - `URPLateJoinObserverOverlayBase`
  - `URPLateJoinObserverOverlayNative`
- **Source Files:**
  - `Source/RP/UI/Frontend/RoomList/RPJoinMenuScreenBase.h`
  - `Source/RP/UI/Frontend/RoomList/RPRoomListItemBase.h`
  - `Source/RP/UI/Frontend/Session/RPSessionNoticeWidgetBase.h`
  - `Source/RP/UI/InGame/Ready/RPReadyPlayerRowBase.h`
  - `Source/RP/UI/InGame/Ready/RPReadyPanelBase.h`
  - `Source/RP/UI/InGame/Session/RPRoomSettingsWidgetBase.h`
  - `Source/RP/UI/InGame/Session/RPLateJoinObserverOverlayBase.h`
- **Last Contract Review:** 2026-07-19
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** URPJoinMenuScreenBase, URPRoomListItemBase, HostText, MapText, RoomStateText, JoinBlockReasonText, URPSessionNoticeWidgetBase, ModalPending, URPReadyPanelBase, URPReadyPlayerRowBase, URPRoomSettingsWidgetBase, AllowJoinDuringMissionSelector, InviteButton, LateJoinObserver

## Boundary

이 계약은 provider-neutral session/gameplay 표시 데이터를 Widget에 반영하고 사용자의 UI 요청을 상위 도메인 경계로 전달한다. Widget은 Steam API, raw search result, 미션 권위 상태나 PlayerState 값을 직접 확정하지 않는다.

## Public Contract

### URPJoinMenuScreenBase

JoinMenu의 Find 시작/완료/취소 수명주기를 CommonUI activation에 묶는다.

| API | 역할 |
|---|---|
| `RefreshRooms` | 기존 소유 검색을 정리하고 새 Find 시작; Refresh 버튼의 유일한 진입점 |
| `CancelRoomSearch` | 이 화면이 소유한 진행 중 Find만 취소 |
| `IsRoomSearchOwnedByThisScreen` | Find 소유 여부 조회 |

기본값은 `bRefreshRoomsOnActivated=true`, `MaxSearchResults=20`, `bLANQuery=true`다. Steam에서는 Subsystem 정책이 lobby/LAN=false로 보정한다. BP는 `OnRoomsUpdated`에서 목록 표현만 재구성한다.

### URPRoomListItemBase

`FRPLobbySearchResult`를 `FRPRoomListItemData`와 stable `FRPRoomJoinRequest`로 변환한다.

| API / Event | 역할 |
|---|---|
| `SetRoomListItemFromSearchResult` | 방/Host/인원/위치/Ping/상태/차단 사유 일괄 적용 |
| `GetRoomJoinRequest` / `HasStableJoinRequest` | generation+RoomId 요청 조회 |
| `CanRequestSelect` / `CanRequestJoin` | 상세 선택과 Join 가능 여부 분리 |
| `OnRPRoomListItemSelected` | 상세/강조용 선택 요청 |
| `OnRPRoomListItemStableJoinRequested` | 신규 제품 Join 요청 |
| `OnRPRoomListItemJoinRequested` | index 기반 legacy 이벤트 |

Optional bindings:

```text
Border
RoomNameText
HostText
PlayersText
MapText
PingText
RoomStateText
JoinBlockReasonText
JoinButton
```

Row 변환의 방어적 표시 규칙:

```text
Waiting joinable -> JoinBlockReasonText hidden
InProgress OFF -> MISSION IN PROGRESS, Join disabled
InProgress ON -> JOIN AS OBSERVER · NEXT MISSION, Join enabled
Full / Version mismatch / unavailable -> 전달된 경우 typed reason has priority
negative or Steam 9999 ping -> -- ms
LocationDisplayName empty -> MapName fallback
```

제품 `FindRooms` cache는 `bCanJoin=false`인 Full/Version mismatch/InProgress OFF/unavailable 결과를 숨기므로 일반 JoinMenu에는 해당 row가 나타나지 않는다. 위 차단 문구는 synthetic/Automation이나 직접 전달된 표시 데이터에서도 안전하게 동작하기 위한 fallback 계약이다.

### URPSessionNoticeWidgetBase

`FRPSessionActionState`와 map-persistent blocking notice를 `FRPSessionNoticeViewData`로 변환한다. 포함된 `UCommonActivatableWidget`의 activation을 추적해 nonblocking notice를 현재 활성 화면에만 표시한다.

| Tone | 표시와 기본 수명 |
|---|---|
| `Hidden` | 숨김 |
| `Pending` | 현재 화면 작업 중; 완료 또는 화면 비활성까지 |
| `ModalPending` | Join 중앙 팝업, throbber, Cancel; terminal 결과/취소까지 |
| `Success` / `Information` / 일반 `Error` | 기본 5초 뒤 자동 숨김 |
| `BlockingError` | 확인 전까지 GameInstance 수명으로 유지 |

| API / Event | 역할 |
|---|---|
| `RefreshSessionNotice` | 현재 화면에서 persistent blocking notice만 복원 |
| `AcknowledgeSessionNotice` | blocking notice 확인/clear |
| `GetSessionNoticeData` | 현재 view data 조회 |
| `CanCancelSessionJoin` | Join ModalPending 취소 가능 여부 |
| `OnSessionNoticeChanged` / `On RP Session Notice Changed` | C++/BP 표시 갱신 |

Optional bindings:

```text
NoticeRoot
NoticeMessageText
AcknowledgeButton
BackgroundBlur
DimBackground
ModalInputBlocker
ConnectionThrobber
CancelJoinButton
```

Native가 auto-dismiss, 화면 전환 clear, acknowledgement와 Cancel click을 소유한다. WBP는 Tone별 스타일만 적용하고 Delay/Timer나 별도 cancel 로직을 만들지 않는다. Host/Join/Multiplayer/Title 화면에 재사용 notice를 배치하되 새 화면은 확인 전 BlockingError만 복원한다.

### URPReadyPlayerRowBase And URPReadyPanelBase

`URPReadyPanelBase`는 GameState PlayerArray와 `ARPPlayerState` 복제를 `FRPReadyPlayerRowData` 배열로 바꾸는 읽기 전용 월드 현황판이다.

| API | 역할 |
|---|---|
| `RefreshReadyPlayers` | PlayerArray/PlayerState 재조회와 cache 갱신 |
| `GetReadyPlayerRows` | 최신 row data |
| `GetReadyCount` / `GetRPPlayerCount` | Ready 분자와 Active 집계 대상 분모 |
| `AreAllPlayersReady` / `IsLocalPlayerReady` | 표시용 Ready 판정 |
| `CanLocalPlayerRequestStartMission` | Listen Host와 전체 Ready 표시용 판정; 실제 요청 아님 |
| `GetReadyPanelStatusText` | 읽기 전용 현황 문구 |

Panel optional bindings는 `PlayerListPanel`, `ReadyCountText`, `StatusMessageText`다. Row optional bindings는 `Border`, `PlayerNameText`, `ReadyStateText`, `PingText`, `LocalStateText`, `HostStateText`, `ReadyIndicator`, `NotReadyIndicator`다.

`ParticipationState=LateJoinObserver` row는 `WAITING NEXT MISSION`으로 표시하고 Ready 집계에서 제외한다. Ready Panel은 Invite/Leave/Start 조작을 소유하지 않는다.

### URPRoomSettingsWidgetBase

ESC 인게임 메뉴의 Host 방 관리 하위화면이다.

Optional bindings:

```text
AllowJoinDuringMissionSelector
RoomSettingsStatusText
InviteButton
```

`AllowJoinDuringMissionSelector`는 `URPOptionSelectorBase` 파생 WBP이며 OptionId와 표시값을 `OFF`, `ON`으로 둔다.

| API | 역할 |
|---|---|
| `RefreshRoomSettings` | Host/desired 설정/pending 상태 재조회 |
| `RequestAllowJoinDuringMission` | Host provider-neutral 정책 변경 요청 |
| `IsRoomSettingsRequestPending` | Selector 입력 잠금 |
| `GetRoomSettingsStatusText` | Host-only/Updating/결과 문구 |
| `CanLocalPlayerRequestInviteOverlay` | Listen Host와 non-Pending 사전 판정 |
| `RequestInviteOverlay` | Subsystem 경유 Steam overlay 요청 |

Native가 사용자 선택 multicast를 Host API에 전달하고 pending 동안 read-only로 잠근 뒤 완료 callback의 실제 적용값을 broadcast 없이 복구한다. 무방송 복원도 Selector의 BP 표시 이벤트는 실행하므로 `OFF`/`ON` 텍스트가 실제값과 함께 갱신되며, 별도 Host API 재요청은 발생하지 않는다. `InviteButton`도 Host 표시/Pending 잠금/click을 Native로 연결한다.

### URPLateJoinObserverOverlayBase

`SPECTATING · ACTIVE NEXT MISSION`과 `LMB / RMB · CHANGE TARGET` 안내를 표시한다. PlayerController가 복제된 participation에 따라 자동 생성/제거하며 WBP class가 없으면 `URPLateJoinObserverOverlayNative`를 사용한다. 클릭은 overlay가 아니라 `IA_SpectateCycle` Enhanced Input으로 처리한다.

## Inputs And Completion

| UI 입력 | 도메인 완료 신호 |
|---|---|
| JoinMenu `RefreshRooms` | `URPSessionSubsystem.OnRoomsUpdated`와 action state |
| Room row stable Join | Join `FRPSessionActionState`; travel 후 최종 완료 |
| Session Notice Cancel | `CancelJoinRoom`; `Cancelled` terminal state는 오류 banner로 표시하지 않음 |
| Room Settings 정책 변경 | `OnHostedMissionJoinPolicyChanged`의 성공/실패와 실제 적용값 |
| Invite | Invite action state; overlay 호출 반환만으로 초대 수락 완료를 뜻하지 않음 |
| Ready/participation 변경 | PlayerState 복제와 Panel/Row refresh |

## Lifecycle

1. 화면/Widget Construct가 Subsystem 또는 owning screen event에 바인딩한다.
2. Native base가 provider-neutral 값을 view data로 변환한다.
3. Optional bindings가 있으면 C++에서 기본 표시/활성/visibility를 동기화한다.
4. BP implementable event는 외형/애니메이션만 갱신한다.
5. 화면 Deactivate/Destruct에서 Find, notice timer와 delegate 소유권을 정리한다.
6. map travel 뒤 새 notice는 persistent blocking error만 복원한다.

## Invariants And Warnings

- 신규 Room List는 stable event만 Join에 연결한다. stable event와 legacy index event를 한 클릭에 함께 바인딩하지 않는다.
- `ClearChildren`은 표시 row를 지울 뿐 Subsystem의 이전 Join request나 active search를 취소하지 않는다. 화면 base의 취소 계약을 사용한다.
- `MapText`는 친화적 `LocationDisplayName`을 우선한다.
- 문자열 메시지를 파싱해 Join/notice 상태를 판정하지 않는다.
- 비활성 메뉴는 다른 메뉴에서 시작된 transient action을 표시하지 않는다.
- Session Notice BP에서 타이머, acknowledgement, Join cancel과 failure travel을 중복 구현하지 않는다.
- Room Settings UI가 Host 권위나 provider metadata 성공을 스스로 확정하지 않는다.

## Contract Links

- **Input Type:** [Online Types API Contract](../Online_Types_Reference.md)
- **State Owner:** [Session Subsystem API Contract](../Session_Subsystem_API_Reference.md)
- **Delegates To:** [Session Room Lifecycle](../flows/Session_Room_Lifecycle.md)
- **Delegates To:** [Late Join Observer](../flows/Late_Join_Observer.md)
- **UI Consumer:** [UI Controls API Contract](UI_Controls_API.md)

## Deprecated / Migration Notes

- `OnRPRoomListItemJoinRequested`와 `JoinRoomByIndex`는 기존 WBP/디버그 호환 경로다. 신규 제품 UI는 stable request를 사용한다.
- Invite 진입점은 `URPReadyPanelBase`에서 `URPRoomSettingsWidgetBase`로 이동했다. Ready Panel에 `InviteButton`을 추가하지 않는다.
- 과거 `AllowJoinDuringMissionToggle` 이름 대신 정확한 binding `AllowJoinDuringMissionSelector`와 `OFF`/`ON` OptionId를 사용한다.
