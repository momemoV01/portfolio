---
title: "Session Room Lifecycle"
description: "Session Room Lifecycle의 사용자 흐름, 상태 소유권과 시스템 간 책임을 설명합니다."
section: "flow"
sourcePath: "reference/flows/Session_Room_Lifecycle.md"
status: "Current"
documentType: "Feature Flow"
lastReviewed: "2026-07-20"
searchKeywords:
  - "CreateRoom"
  - "CreateReadiness"
  - "Steam login"
  - "Online Identity"
  - "Null override"
  - "FindRooms"
  - "CancelFindRooms"
  - "JoinRoom"
  - "CancelJoinRoom"
  - "ShowInviteOverlay"
  - "LeaveRoom"
  - "Session Notice"
  - "Room List"
  - "방 생성"
  - "Steam 로그인"
  - "방 검색"
  - "참가 취소"
  - "연결 실패"
order: 10
---
- **Status:** Current
- **Document Type:** Feature Flow
- **Flow ID:** FLOW-SESSION-ROOM-LIFECYCLE
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer, QA
- **Primary Domains:** Online Session, Frontend UI, Travel Recovery
- **Last Contract Review:** 2026-07-20
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** CreateRoom, CreateReadiness, Steam login, Online Identity, Null override, FindRooms, CancelFindRooms, JoinRoom, CancelJoinRoom, ShowInviteOverlay, LeaveRoom, Session Notice, Room List, 방 생성, Steam 로그인, 방 검색, 참가 취소, 연결 실패

## User Goal

사용자는 방을 만들거나 검색하고, 선택한 바로 그 방에 참가하거나 참가를 취소하며, 실패하면 입력이 갇히지 않은 상태로 Frontend에 돌아와야 한다. UI는 Steam API나 raw OnlineSubsystem 타입을 직접 다루지 않는다.

## End-To-End Flow

```text
Widget input
-> native UI base or parent screen
-> URPSessionSubsystem provider-neutral request
-> provider callback / travel / server revalidation
-> FRPSessionActionState and domain completion event
-> active screen Session Notice or Room List rendering
```

### 1. Create Room

1. HostMenu가 입력을 정리해 `FRPCreateRoomOptions`를 만든다.
2. `CreateRoom`은 provider 호출 전에 configured provider, active provider, session interface와 Local User 0의 identity/login/user id를 검사한다.
3. 제품 경로는 configured/active provider가 모두 Steam이고 Local User 0이 `LoggedIn`이며 유효한 UniqueNetId를 가질 때만 계속한다. `DefaultPlatformService=Null`과 active Null이 함께 확인된 경우만 임시 개발 override로 허용한다.
4. Steam 설정에서 Null fallback이 active이거나 identity가 준비되지 않았으면 provider `CreateSession`을 호출하지 않고 `ProviderUnavailable`로 종료한다.
5. readiness를 통과하면 Steam용 Waiting room을 만들고 V4 schema, `BUREAU ROOM`, Host의 `bAllowJoinDuringMission` 초기값을 광고한다.
6. `CreateRoom` 반환값은 요청 시작 여부다. 최종 결과는 `OnCreateRoomCompleted`와 `OnSessionActionStateChanged`로 전달된다.
7. 제품 Host 흐름은 성공 후 `L_BureauRoom_Dev?listen`으로 이동한다.

`FRPCreateRoomOptions`에는 별도의 Join In Progress 입력이 없다. 내부 joinable 값은 Waiting에서 true, InProgress에서 유효한 `bAllowJoinDuringMission` 값으로 산출한다.

provider가 Create 요청을 동기 또는 비동기로 실패시키며 named session residue를 남긴 경우 Subsystem은 실패 completion을 UI에 전달하기 전에 failure cleanup을 시작한다. cleanup이 끝나기 전 새 session action은 recovery barrier에서 거절되며, 실제 hosted room으로 오인해 `AlreadyInRoom`을 반환하지 않는다.

### 2. Find, Refresh, And Cancel

1. `URPJoinMenuScreenBase`가 활성화되면 진행 중 Find를 인수하거나 `FindRooms`를 시작한다.
2. 완료 시 `OnRoomsUpdated`가 최신 generation의 **제품 목록에 노출 가능한** `FRPLobbySearchResult` 배열을 전달한다.
3. Blueprint는 `ClearChildren`, row 생성, `SetRoomListItemFromSearchResult`, row event binding만 수행한다.
4. Refresh 버튼은 Subsystem을 직접 호출하지 않고 `RefreshRooms`를 사용한다.
5. Full, Version mismatch, InProgress OFF, unavailable처럼 `bCanJoin=false`인 provider 결과는 cache/JoinMenu에서 숨긴다.
6. JoinMenu가 Find를 소유한 채 비활성화되면 `CancelFindRooms`가 provider delegate, timeout, cache와 nonblocking notice를 정리한다.

검색 완료 뒤 메뉴를 나간 경우 provider 취소는 필요 없다. 현재 화면의 transient notice만 사라지고, 이전 화면의 `No rooms found`가 다음 메뉴에 복원되지 않는다.

### 3. Stable Join And User Cancel

1. Room row는 검색 당시 `SearchGeneration + RoomId`를 `FRPRoomJoinRequest`로 보존한다.
2. `OnRPRoomListItemStableJoinRequested`가 요청을 부모 JoinMenu에 전달한다.
3. 부모는 `JoinRoom(GetOwningPlayer(), JoinRequest)` 하나만 호출한다.
4. Subsystem은 generation, room identity, build, capacity와 InProgress 정책을 재검사한다.
5. provider Join 중에는 `ModalPending` Session Notice가 중앙 팝업, throbber와 Cancel을 표시한다.
6. Cancel은 `CancelJoinRoom`으로 들어가며, 이후 도착한 provider callback은 격리되어 ClientTravel을 시작할 수 없다.
7. provider 성공 뒤에도 Join은 끝난 것이 아니다. 선택 당시 RoomId를 `RPExpectedRoomId`로 URL에 고정하고 Host `PreLogin`이 현재 hosted room instance와 다시 비교한다.
8. `PostLoadMap`까지 확인된 뒤에만 최종 Join 성공으로 취급한다.

새 Find 이후의 이전 selection, 사라진 방, 같은 endpoint에 다시 생긴 다른 Lobby는 fail-closed로 끝난다. 자동으로 새 방을 선택하거나 새 Lobby에 재접속하지 않는다.

### 4. Invite

1. Listen Host의 `WBP_RPRoomSettings`가 `RequestInviteOverlay`를 요청한다.
2. `URPSessionSubsystem.ShowInviteOverlay`가 provider, hosted room, Pending operation과 join policy를 최종 확인한다.
3. Steam 초대 수락과 친구 메뉴 Join Game도 V4 mapping과 동일한 stable Join 경로로 들어간다.

Ready Panel은 플레이어 현황 표시 전용이며 Invite/Leave/Start 조작을 소유하지 않는다.

### 5. Leave And Failure Recovery

- 명시적 `LeaveRoom`은 local/named session을 정리하고 기본적으로 Multiplayer menu로 돌아간다.
- Network/Travel/Host disconnect는 best-effort cleanup 뒤 Title 복귀를 예약하고 확인 전 blocking notice를 유지한다.
- Engine이 먼저 Title을 열면 그 이동을 최종 복귀로 인정한다. 다른 맵이 열렸을 때만 corrective travel을 수행한다.
- 실패 delegate 안에서 즉시 `OpenLevel`하지 않으며 Host Migration은 시도하지 않는다.

## State And Responsibility

| 책임 | 소유자 |
|---|---|
| provider 요청, search cache, action state, blocking notice, failure recovery | `URPSessionSubsystem` |
| Room row 표시와 stable request 생성 | `URPRoomListItemBase` |
| Find의 화면 수명주기 | `URPJoinMenuScreenBase` |
| transient/modal/blocking notice 표현 | `URPSessionNoticeWidgetBase` |
| Ready/미션/Observer 실제 gameplay 상태 | PlayerState, GameState, GameMode, MissionDirector |

## Failure Boundaries

- 문자열을 비교해 실패 종류를 판정하지 않는다. `ERPSessionResultReason`을 사용한다.
- `NoRoomsFound`는 성공한 검색의 정보 결과다.
- `Cancelled`는 사용자 취소 진단 상태이며 오류 배너나 blocking popup이 아니다.
- `Busy`는 이미 Pending인 action을 덮어쓰지 않는다.
- Create readiness 실패는 `ProviderUnavailable`이며 Steam 준비 안내를 표시한다. 세부 identity/provider 원인은 로그에서만 구분한다.
- 제품 설정이 Steam인데 active provider가 Null인 상태는 개발 override가 아니라 provider mismatch다.
- provider callback 성공과 map travel 성공을 같은 완료로 보지 않는다.

## Contract Links

- **Input Type:** [Online Types API Contract](../Online_Types_Reference.md)
- **Delegates To:** [Session Subsystem API Contract](../Session_Subsystem_API_Reference.md)
- **UI Consumer:** [UI Session Widgets API Contract](../ui/UI_Session_Widgets_API.md)
- **State Owner:** [Late Join Observer](Late_Join_Observer.md)

## Validation Boundary

WBP 연결, PIE와 Steam 두 계정 검증은 [Phase 16 Editor Verification Checklist](../../checklists/Phase_16_Editor_Verification_Checklist.md)를 따른다. 이 Flow는 해당 검증을 통과했다고 대신 선언하지 않는다.
