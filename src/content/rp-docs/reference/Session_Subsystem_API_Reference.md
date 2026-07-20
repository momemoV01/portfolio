---
title: "Session Subsystem API Contract"
description: "Session Subsystem API Contract의 공개 계약, 완료 신호, 수명주기와 실패 경계를 설명합니다."
section: "api"
sourcePath: "reference/Session_Subsystem_API_Reference.md"
status: "Current"
documentType: "API Contract"
lastReviewed: "2026-07-20"
searchKeywords:
  - "URPSessionSubsystem"
  - "CreateRoom"
  - "CreateReadiness"
  - "Steam login"
  - "Online Identity"
  - "Null override"
  - "FindRooms"
  - "CancelFindRooms"
  - "JoinRoom"
  - "CancelJoinRoom"
  - "RoomInstance"
  - "FRPRoomJoinRequest"
  - "FRPSessionActionState"
  - "GetAllowJoinDuringMission"
  - "IsHostedMissionJoinPolicyUpdatePending"
  - "ShowInviteOverlay"
  - "BlockingSessionNotice"
  - "Timeout"
  - "HostDisconnected"
order: 21
---
- **Status:** Current
- **Document Type:** API Contract
- **Domain:** Online Session / Steam Provider Boundary
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer, QA
- **Canonical Symbols:**
  - `URPSessionSubsystem`
- **Source Files:**
  - `Source/RP/System/RPSessionSubsystem.h`
- **Last Contract Review:** 2026-07-20
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** URPSessionSubsystem, CreateRoom, CreateReadiness, Steam login, Online Identity, Null override, FindRooms, CancelFindRooms, JoinRoom, CancelJoinRoom, RoomInstance, FRPRoomJoinRequest, FRPSessionActionState, GetAllowJoinDuringMission, IsHostedMissionJoinPolicyUpdatePending, ShowInviteOverlay, BlockingSessionNotice, Timeout, HostDisconnected

## Boundary

`URPSessionSubsystem`은 Steam-backed RP session의 유일한 public facade다. UI와 gameplay는 Steam API, raw `FOnlineSessionSearchResult`, provider connect string을 직접 다루지 않는다.

내부 구현은 `Source/RP/System/Session`의 provider policy, Create/Find, Join/Leave, ActionState/복구, Steam Invite와 Diagnostics로 나뉘지만 외부 소비자는 `RPSessionSubsystem.h`만 사용한다. Ready, 미션과 participation 권위 상태는 PlayerState/GameState/GameMode/MissionDirector에 남는다.

## Public Contract

### Blueprint Events

| Event | 의미 | 기본 소비자 |
|---|---|---|
| `OnRoomsUpdated` | Find 완료 뒤 최신 `FRPLobbySearchResult` 배열 | JoinMenu 목록 rebuild |
| `OnCreateRoomCompleted` | Create provider callback 완료 | 기존 세부 완료 처리 |
| `OnJoinRoomCompleted` | Join provider callback 완료 또는 travel 전 실패 | 기존 세부 완료 처리 |
| `OnSessionActionMessage` | 문자열 action/error | legacy WBP |
| `OnSessionActionStateChanged` | typed Pending/Succeeded/Failed/reason/blocking | 제품 Session Notice |
| `OnHostedMissionJoinPolicyChanged` | Host policy metadata 완료/실패와 실제 적용값 | Room Settings 잠금 해제 |

새 UI는 `OnSessionActionStateChanged`와 typed reason을 우선한다.

### Create, Find, Join

#### CreateRoom

```text
bool CreateRoom(const FRPCreateRoomOptions& Options)
```

- Steam Waiting room에 `RP_PHASE16_SESSION_V4`, `RP_ROOM_STATE=Waiting`, `RP_LOCATION_DISPLAY_NAME=BUREAU ROOM`, `RP_ALLOW_JOIN_DURING_MISSION`, Map과 BuildUniqueId를 광고한다.
- provider 호출 전 configured/active provider, session interface, identity interface, Local User 0 login과 UniqueNetId를 검사한다.
- 제품 경로는 configured Steam + active Steam + `LoggedIn` + valid user id만 Ready다. configured provider와 active provider가 모두 Null일 때만 명시적인 개발 override로 identity 검사를 우회한다.
- Steam 설정의 Null fallback, 누락된 identity/login/user id와 지원하지 않는 provider는 `ProviderUnavailable`이다. 이 경우 `CreateSession`을 호출하지 않는다.
- 별도 Join In Progress 입력은 없다. engine joinable은 Waiting에서 true, InProgress에서 effective mission policy로 산출한다.
- 반환값은 요청 시작 여부, 최종 결과는 event다. Timeout은 10초다.
- 동기 또는 일반 비동기 Create 실패가 named session residue를 남기면 failure completion/broadcast 전에 cleanup을 시작한다. pending cleanup은 recovery barrier가 새 요청을 막고, 완료 뒤 기존 실패 action은 그대로 유지된다.

#### FindRooms

```text
bool FindRooms(int32 MaxSearchResults = 20, bool bLANQuery = true)
bool CancelFindRooms()
bool IsFindRoomsInProgress() const
```

- Find마다 generation을 증가시키고 이전 cache를 비운다.
- Steam은 lobby query/LAN=false로 보정한다.
- RP schema를 통과해도 Full, Version mismatch, InProgress OFF, unavailable처럼 non-joinable인 결과는 cache와 제품 JoinMenu에서 숨긴다.
- 결과 0개는 `Succeeded + NoRoomsFound`다.
- Timeout은 10초다.
- Cancel은 active Find에서 provider delegate, timeout, search/cache와 nonblocking action message를 비우고 빈 `OnRoomsUpdated`와 Idle을 방송한다. 취소 자체는 오류 notice를 만들지 않는다.

`URPJoinMenuScreenBase`가 화면 수명에 맞춰 Cancel을 호출한다.

#### JoinRoom

```text
bool JoinRoom(APlayerController* PlayerController, const FRPRoomJoinRequest& JoinRequest)
bool CancelJoinRoom()
bool IsJoinRoomInProgress() const
```

- 최신 cache의 `SearchGeneration + RoomId`가 모두 일치해야 시작한다.
- Version, capacity, identity와 InProgress 정책을 사전 판정한다.
- provider callback timeout은 15초, ClientTravel 완료 대기는 30초다.
- provider 성공은 travel 성공이 아니다. `PostLoadMap` 뒤 최종 Join 성공을 확정한다.
- ClientTravel URL에 `RPExpectedRoomId`를 고정하고 Host `PreLogin`이 현재 hosted session ID와 비교한다.
- `CancelJoinRoom`은 provider 대기, stale cleanup, ClientTravel 구간을 처리한다. 늦은 callback은 격리되어 travel하지 않는다.
- Cancel은 `Failed + Cancelled` 진단 상태지만 blocking/transient 오류 notice는 만들지 않는다.

#### JoinRoomByIndex

기존 WBP/디버그 호환 API다. 해당 결과의 stable request를 만들어 공통 Join 경로로 보낸다. 신규 Room List는 `JoinRoom`을 사용한다.

### Leave And Invite

```text
bool LeaveRoom(APlayerController* PlayerController, FName ReturnMapName = NAME_None)
bool ShowInviteOverlay(int32 LocalUserNum = 0)
```

- Leave는 Host/Client named session을 정리하고 기본 `L_MultiplayerMenu_Dev`로 돌아간다. Timeout은 5초다.
- Invite는 Steam의 Waiting 또는 InProgress+effective ON hosted room에서만 overlay를 연다.
- 초대 수락과 Steam Join Game은 V4 mapping/stable Join 정책을 사용한다.
- 이미 방에 있거나 다른 operation이 Pending이면 자동 Leave하지 않고 `AlreadyInRoom`/`Busy`로 거절한다.

### Action State And Notice

```text
FRPSessionActionState GetCurrentSessionActionState() const
bool HasBlockingSessionNotice() const
FRPSessionActionState GetBlockingSessionNotice() const
void AcknowledgeBlockingSessionNotice()
void ClearBlockingSessionNotice()
```

- Create/Find/Join/Leave/Invite 중 하나만 active일 수 있다.
- `Busy` 알림은 기존 Pending을 덮어쓰지 않는다.
- Provider/Join/Timeout/Network/Travel/Host disconnect 같은 확인형 오류는 blocking notice로 map travel 간 유지할 수 있다.
- Acknowledge는 notice만 지우고 마지막 action history는 바꾸지 않는다.
- `GetCurrentSessionActionState`의 완료된 transient action은 새 메뉴에서 다시 표시하라는 지시가 아니다.

### Gameplay Bridge And Host Policy

```text
bool RequestReady(APlayerController* PlayerController, bool bNewReady)
bool RequestStartMission(APlayerController* PlayerController)
bool MarkHostedSessionInProgress_ServerOnly(const FString& LocationDisplayName)
bool MarkHostedSessionWaiting_ServerOnly()
bool SetAllowJoinDuringMission(bool bAllowJoinDuringMission)
bool GetAllowJoinDuringMission() const
bool IsHostedMissionJoinPolicyUpdatePending() const
bool TryGetEffectiveAllowJoinDuringMission_ServerOnly(bool& OutAllowJoinDuringMission) const
bool ValidateIncomingRoomInstance_ServerOnly(const FString& ExpectedRoomId, FString& OutErrorCode) const
```

| API | 계약 |
|---|---|
| `RequestReady` / `RequestStartMission` | PlayerController 서버 권위 경로로 요청만 전달 |
| `MarkHostedSessionInProgress_ServerOnly` | 최신 위치/policy metadata 뒤 `StartSession` |
| `MarkHostedSessionWaiting_ServerOnly` | `EndSession` 뒤 Waiting/`BUREAU ROOM` metadata |
| `SetAllowJoinDuringMission` | Host desired policy 변경; OFF 즉시, ON provider 성공 뒤 effective |
| `GetAllowJoinDuringMission` | Host가 요청한 desired 값 조회 |
| `IsHostedMissionJoinPolicyUpdatePending` | provider 완료를 기다리는지 조회 |
| `TryGetEffectiveAllowJoinDuringMission_ServerOnly` | PreLogin/starting player용 effective 서버 재검증 |
| `ValidateIncomingRoomInstance_ServerOnly` | 선택 당시 RoomId와 현재 hosted room instance 비교 |

GameState 서버 mission commit을 GameMode가 구독해 InProgress/Waiting mirror를 단일 경로로 요청한다. RoomState/Location/policy 동시 갱신은 revision 기반으로 합치며 provider 실패는 한 번 재시도하고 `HostedState` warning을 남긴다. Gameplay mission state는 rollback하지 않는다.

### Diagnostics

| API | 용도 |
|---|---|
| `GetActiveProvider` | provider 확인 |
| `GetCachedSearchResults` | latest Room List rebuild |
| `GetCurrentSearchGeneration` | stable Join 진단 |
| `GetSessionDebugText` | cache/action/notice/invite/host policy state 문자열 |
| `PrintSessionDiagnostics` | Steam config, NetDriver, delegate, pending state 로그 |
| `DestroyRoom` | 개발/PIE 잔여 session cleanup |

## Inputs And Completion

| 요청 | 요청 시작 | 최종 완료/관찰 |
|---|---|---|
| Create | bool 반환 | `OnCreateRoomCompleted`, typed action state |
| Find/Cancel Find | bool 반환 | `OnRoomsUpdated`, typed action state/Idle |
| Join/Cancel Join | bool 반환 | provider/travel/server 검증 뒤 typed state; legacy Join event |
| Leave | bool 반환 | session cleanup/travel과 typed state |
| Invite | bool 반환 | overlay 요청 action state; 초대 수락은 별도 accepted invite flow |
| Host mission policy | bool 반환 | `OnHostedMissionJoinPolicyChanged`의 성공/적용값/message |
| Hosted room state | ServerOnly bool | provider completion 또는 `HostedState` warning |

public bool 반환을 provider/여행의 최종 성공으로 해석하지 않는다.

## Lifecycle

### Normal Room Lifecycle

```text
Create Waiting metadata
-> optional listen travel
-> Find/cache/stable Join
-> Host mission commit
-> InProgress metadata + StartSession
-> mission Succeeded 또는 Failed terminal
-> EndSession + Waiting/BUREAU ROOM metadata
-> Leave or next mission
```

### Failure Recovery

- Engine Network/Travel delegate는 이 GameInstance가 소유한 world/net driver만 처리한다.
- Pending Join에서 `World == nullptr`이면 PendingNetDriver를 우선하고, context가 이미 지워졌으면 active Join을 fallback 소유 신호로 사용한다.
- Host loss/Join travel failure는 local session을 best-effort cleanup하고 Title 복귀를 한 번만 예약한다.
- Engine이 먼저 Title을 열면 corrective travel을 취소하고, 다른 map일 때만 Title로 교정한다.
- provider callback timeout/사용자 cancel 뒤 늦은 completion은 cleanup barrier에서 격리한다.
- 일반 Create 실패의 stale named session도 같은 failure-cleanup barrier로 제거한다. Create timeout의 늦은 callback cleanup과는 중복 실행하지 않는다.

## Invariants And Warnings

- UI/gameplay에서 Steam API를 직접 호출하지 않는다.
- Steam 제품 설정에서 active Null fallback으로 방을 만들지 않는다. Null은 `DefaultPlatformService=Null` 명시 override에서만 허용한다.
- SessionSubsystem이 Ready/미션/participation 권위 상태를 저장하지 않는다.
- provider callback 성공과 ClientTravel 완료를 같은 상태로 보지 않는다.
- Join request가 stale이거나 room instance를 읽지 못하면 fail-closed다.
- OFF policy는 즉시 effective false, ON은 metadata 성공 전까지 false다.
- explicit Leave의 Multiplayer 복귀와 failure의 Title 복귀를 섞지 않는다.
- failure delegate 안에서 즉시 `OpenLevel`하지 않는다.
- Host Migration은 구현하지 않는다.

## Contract Links

- **Input Type:** [Online Types API Contract](Online_Types_Reference.md)
- **UI Consumer:** [UI Session Widgets API Contract](ui/UI_Session_Widgets_API.md)
- **Delegates To:** [Session Room Lifecycle](flows/Session_Room_Lifecycle.md)
- **State Owner:** [Late Join Observer](flows/Late_Join_Observer.md)

## Deprecated / Migration Notes

- `OnSessionActionMessage`, `GetLastSessionActionMessage`, `IsLastSessionActionError`는 문자열 기반 legacy WBP 호환 표면이다. 신규 UI는 `OnSessionActionStateChanged`와 typed state를 사용한다.
- `JoinRoomByIndex`는 legacy/diagnostic 호환 API다. 신규 Room List는 `FRPRoomJoinRequest` 기반 `JoinRoom`을 사용한다.
- `DestroyRoom`은 개발 cleanup용이다. 사용자 방 나가기는 `LeaveRoom`을 사용한다.
- 과거 Create 옵션의 `bAllowJoinInProgress`는 제거됐다. 내부 joinable은 RoomState와 effective mission policy로 산출한다.
