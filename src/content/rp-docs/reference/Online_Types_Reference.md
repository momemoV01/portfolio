---
title: "Online Types API Contract"
description: "Online Types API Contract의 공개 계약, 완료 신호, 수명주기와 실패 경계를 설명합니다."
section: "api"
sourcePath: "reference/Online_Types_Reference.md"
status: "Current"
documentType: "API Contract"
lastReviewed: "2026-07-19"
searchKeywords:
  - "ERPOnlineProvider"
  - "ERPRoomState"
  - "ERPSessionOperation"
  - "HostedState"
  - "ERPSessionActionStatus"
  - "ERPSessionResultReason"
  - "Cancelled"
  - "FRPRoomJoinRequest"
  - "FRPSessionActionState"
  - "FRPCreateRoomOptions"
  - "FRPLobbySearchResult"
  - "ERPPlayerParticipationState"
order: 20
---
- **Status:** Current
- **Document Type:** API Contract
- **Domain:** Online Session / Provider-Neutral Types
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer
- **Canonical Symbols:**
  - `ERPOnlineProvider`
  - `ERPRoomState`
  - `ERPSessionOperation`
  - `ERPSessionActionStatus`
  - `ERPSessionResultReason`
  - `FRPRoomId`
  - `FRPOnlineUserId`
  - `FRPRoomJoinRequest`
  - `FRPSessionActionState`
  - `FRPCreateRoomOptions`
  - `FRPLobbySearchResult`
  - `ERPPlayerParticipationState`
- **Source Files:**
  - `Source/RP/Core/RPOnlineTypes.h`
  - `Source/RP/Player/RPPlayerParticipationTypes.h`
- **Last Contract Review:** 2026-07-19
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** ERPOnlineProvider, ERPRoomState, ERPSessionOperation, HostedState, ERPSessionActionStatus, ERPSessionResultReason, Cancelled, FRPRoomJoinRequest, FRPSessionActionState, FRPCreateRoomOptions, FRPLobbySearchResult, ERPPlayerParticipationState

## Boundary

UI와 gameplay는 이 문서의 RP 타입만 사용한다. Raw Steam lobby id, `FOnlineSessionSearchResult`, connect string과 provider object는 `URPSessionSubsystem` 밖으로 노출하지 않는다.

이 타입들은 표시와 요청 경계다. Room metadata는 미션 원본이 아니며, session action state는 Ready/미션/플레이어 participation을 소유하지 않는다.

## Public Contract

### Enums

#### ERPOnlineProvider

`Unknown`, `Null`, `Steam`, `EOS`, `Stove`를 구분한다. 제품 기본 provider는 Steam이며 Null은 임시 회귀/진단용이다.

#### ERPRoomState

| 값 | 의미 |
|---|---|
| `Unknown` | schema/state를 신뢰할 수 없어 Join 불가 |
| `Waiting` | Bureau 대기 중; 다른 조건도 통과하면 정상 Join |
| `InProgress` | 미션 활성; Host 정책 OFF면 차단, ON이면 Observer 후보 |

#### ERPSessionOperation

| 값 | 의미 |
|---|---|
| `Create`, `Find`, `Join`, `Leave`, `Invite` | 사용자 session operation |
| `HostedState` | Host의 room metadata/StartSession/EndSession mirror 갱신 결과 |

`HostedState` warning은 gameplay mission state를 rollback하지 않으며 새 사용자 요청 timeout을 시작하지 않는다.

#### ERPSessionActionStatus

`Idle`, `Pending`, `Succeeded`, `Failed`를 사용한다.

#### ERPSessionResultReason

| 그룹 | 값 |
|---|---|
| 정보 | `NoRoomsFound` |
| provider/overlay | `ProviderUnavailable`, `OverlayUnavailable` |
| room/join | `RoomUnavailable`, `RoomFull`, `RoomInProgress`, `AlreadyInRoom`, `VersionMismatch` |
| operation | `Busy`, `Timeout`, `Cancelled` |
| recovery | `NetworkFailure`, `TravelFailure`, `HostDisconnected` |
| fallback | `Unknown` |

`Cancelled`는 사용자가 Join을 취소한 terminal 진단 상태다. 일반 오류 banner나 blocking notice로 표시하지 않는다. UI 분기는 문자열이 아니라 enum을 사용한다.

#### ERPPlayerParticipationState

| 값 | 의미 |
|---|---|
| `Active` | 정상 Pawn/입력/Ready 집계 대상 |
| `LateJoinObserver` | 현재 미션 고정 관전, Ready 불가, `Succeeded`에서 Active 승격 |

이 enum은 Online metadata가 아니라 PlayerState의 gameplay 복제 타입이다. Late Join flow가 session 결과와 gameplay participation을 연결할 때 사용한다.

### Identity Types

#### FRPRoomId / FRPOnlineUserId

`Provider + Value`로 provider-owned identity를 RP 경계 뒤에 숨긴다. 일반 UI에는 display name을 우선하고 raw Value는 diagnostics 외에는 노출하지 않는다.

#### FRPRoomJoinRequest

| 필드 | 의미 |
|---|---|
| `SearchGeneration` | 해당 Room 결과를 만든 Find generation |
| `RoomId` | 선택 당시의 안정적인 RP room identity |

`IsValid()`인 요청만 신규 `JoinRoom`에 전달한다. 새 Find가 끝나면 이전 요청은 stale이다.

### FRPSessionActionState

| 필드 | 의미 |
|---|---|
| `Operation` | Create/Find/Join/Leave/Invite/HostedState |
| `Status` | Idle/Pending/Succeeded/Failed |
| `Reason` | provider-neutral 결과 사유 |
| `UserMessage` | UI 표시용 `FText` |
| `bIsBlocking` | 확인 전까지 유지해야 하는 실패 후보 |

`Busy` 알림은 현재 Pending action을 대체하지 않는다. Map travel 뒤 유지할 notice는 별도의 blocking notice state로 확인한다.

### FRPCreateRoomOptions

| 필드 | 기본값/사용 |
|---|---|
| `RoomDisplayName` | 기본 `RP Room`; UI는 sanitized input 사용 |
| `MaxPublicConnections` | 기본 4, C++에서 1~6 clamp |
| `bIsLANMatch` | Steam에서 false로 내부 보정 |
| `bShouldAdvertise` | public room은 true |
| `bAllowJoinDuringMission` | 기본 false; ON이면 미션 중 Observer 참가 허용 |
| `MapName` | 기본 `L_BureauRoom_Dev`; 실제 engine map |
| `bTravelToMapOnSuccess` | 제품 Host 흐름은 true |
| `bOpenMapAsListenServer` | 제품 Host 흐름은 true |

### FRPLobbySearchResult

| 필드 | UI 사용 | 주의 |
|---|---|---|
| `SearchResultIndex` | legacy index Join | 화면 순서 index로 재계산 금지 |
| `SearchGeneration` | stable Join | 새 Find 뒤 이전 값 stale |
| `RoomId` | stable identity | raw Value 일반 표시 금지 |
| `HostUserId` | diagnostics | gameplay identity로 사용 금지 |
| `RoomDisplayName` | Room row | UI overflow 고려 |
| `HostDisplayName` | Room row | 비어 있으면 `--` |
| `MapName` | diagnostics/fallback | 실제 engine map 이름 |
| `LocationDisplayName` | Room `MapText` | Waiting은 `BUREAU ROOM`, 미션 중 친화적 위치명 |
| `RoomState` | WAITING/IN PROGRESS | gameplay mission 원본 아님 |
| `OpenPublicConnections` / `MaxPublicConnections` | 현재/최대 인원 | 현재 인원은 `Max - Open` |
| `PingMs` | Room row | 음수/Steam `9999`는 `-- ms` |
| `bIsLANMatch` | diagnostics | Steam UI 정책 분기 금지 |
| `bBuildCompatible` | version 판정 | false이면 Join 불가 |
| `bAllowJoinDuringMission` | InProgress 정책 mirror | 서버가 effective 정책 재검증 |
| `bWillJoinAsObserver` | 참가 안내 | true이면 Join 활성 + 다음 미션 안내 |
| `bCanJoin` | 노출/Join 사전 판정 | false인 provider 결과는 제품 JoinMenu에서 숨김 |
| `JoinBlockReason` | diagnostics/방어적 row 표시 | typed reason 우선 |
| `JoinBlockMessage` | diagnostics/방어적 사용자 설명 | 문자열 파싱 대신 reason 사용 |

Utilities는 `IsValid`, `MakeJoinRequest`, `ToDebugString`이다.

## Inputs And Completion

| 입력 타입 | 소비자 / 완료 타입 |
|---|---|
| `FRPCreateRoomOptions` | `URPSessionSubsystem.CreateRoom`; 최종 결과는 action state와 Create event |
| `FRPRoomJoinRequest` | `URPSessionSubsystem.JoinRoom`; provider/travel/server 재검증 뒤 terminal state |
| `FRPLobbySearchResult` | Room row 표시와 stable request 생성 |
| `FRPSessionActionState` | Session Notice와 요청 Pending 잠금 |
| `ERPPlayerParticipationState` | PlayerState 복제, Ready row와 Observer overlay |

## Lifecycle

1. Subsystem이 provider 결과를 RP identity와 display type으로 변환한다.
2. UI는 `FRPLobbySearchResult`에서 표시와 stable request만 읽는다.
3. 요청은 RP 타입으로 Subsystem에 되돌아간다.
4. Subsystem은 typed action state/reason으로 진행과 terminal 결과를 알린다.
5. 실제 미션/participation은 서버 framework가 별도로 재검증하고 복제한다.

## Invariants And Warnings

- `RoomState`, `LocationDisplayName`, `bAllowJoinDuringMission`은 광고 metadata mirror다.
- 제품 Find cache는 `bCanJoin=true`이면서 `JoinBlockReason=Unknown`인 결과만 JoinMenu에 노출한다. Full/Version mismatch/InProgress OFF row는 일반 제품 목록에 나타나지 않는다.
- `bCanJoin=true`도 Host `PreLogin` 통과를 보장하지 않는다.
- `SearchResultIndex`만 저장한 선택은 refresh 뒤 다른 방을 가리킬 수 있다. stable request를 사용한다.
- `UserMessage` 문자열을 state machine 입력으로 사용하지 않는다.
- `Unknown` 값은 낙관적으로 허용하지 않고 fail-closed로 처리한다.

## Contract Links

- **State Owner:** [Session Subsystem API Contract](Session_Subsystem_API_Reference.md)
- **UI Consumer:** [UI Session Widgets API Contract](ui/UI_Session_Widgets_API.md)
- **Delegates To:** [Session Room Lifecycle](flows/Session_Room_Lifecycle.md)
- **Delegates To:** [Late Join Observer](flows/Late_Join_Observer.md)

## Deprecated / Migration Notes

- `FRPCreateRoomOptions.bAllowJoinInProgress`는 제거됐다. Waiting/InProgress joinable은 RoomState와 유효한 `bAllowJoinDuringMission`에서 내부 산출한다.
- 신규 UI는 `SearchResultIndex` 단독 Join 대신 `FRPRoomJoinRequest`를 사용한다.
