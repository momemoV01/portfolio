---
title: "Late Join Observer"
description: "Late Join Observer의 사용자 흐름, 상태 소유권과 시스템 간 책임을 설명합니다."
section: "flow"
sourcePath: "reference/flows/Late_Join_Observer.md"
status: "Current"
documentType: "Feature Flow"
lastReviewed: "2026-07-19"
searchKeywords:
  - "LateJoinObserver"
  - "Allow Join During Mission"
  - "bAllowJoinDuringMission"
  - "PreLogin"
  - "HandleStartingNewPlayer"
  - "spectator"
  - "observer"
  - "다음 미션"
  - "중간 참가"
  - "관전"
  - "IA_SpectateCycle"
  - "LMB"
  - "RMB"
  - "RPForceLateJoinObserver"
order: 12
---
- **Status:** Current
- **Document Type:** Feature Flow
- **Flow ID:** FLOW-SESSION-LATE-JOIN-OBSERVER
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Game Designer, QA
- **Primary Domains:** Online Session, Gameplay Authority, Player Participation, In-Game UI
- **Last Contract Review:** 2026-07-19
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** LateJoinObserver, Allow Join During Mission, bAllowJoinDuringMission, PreLogin, HandleStartingNewPlayer, spectator, observer, 다음 미션, 중간 참가, 관전, IA_SpectateCycle, LMB, RMB, RPForceLateJoinObserver

## User Goal

Host가 허용한 경우 미션 도중 들어온 플레이어는 현재 미션에 영향을 주지 않는 고정 관전자이며, Bureau 반납까지 완료된 다음 정상 플레이어가 된다. 기본 정책은 OFF이고, 정책이나 metadata를 신뢰할 수 없으면 참가를 허용하지 않는다.

## Room Display And Join Result

| Gameplay 상태 | Room 표시 | 위치 표시 | 신규 참가 |
|---|---|---|---|
| `Inactive` / `Succeeded` / `Failed` | `WAITING` | `BUREAU ROOM` | 정상 `Active` 참가 |
| `InProgress` / `Tutorial` / `RecoveryReview`, 정책 OFF | `IN PROGRESS` | 미션 친화적 위치명 | 차단 |
| 같은 미션 활성 상태, 정책 ON | `IN PROGRESS` | 미션 친화적 위치명 | `LateJoinObserver` 후보 |

Room metadata는 목록과 사전 판정용 mirror다. 실제 미션 상태 원본은 GameState/MissionDirector, 참가 자격 원본은 서버 GameMode/PlayerState가 소유한다.

## Host Policy Lifecycle

1. 방 생성 시 `FRPCreateRoomOptions.bAllowJoinDuringMission`의 기본값은 false다.
2. HostMenu 초기 설정은 hosted session의 desired/effective 정책으로 이어진다.
3. 인게임 `WBP_RPRoomSettings`는 Host만 `SetAllowJoinDuringMission`을 요청한다.
4. OFF는 서버 `PreLogin`에 즉시 반영한다.
5. ON은 provider metadata 갱신 성공 뒤에만 effective true가 된다.
6. 동시 RoomState/Location/정책 요청은 revision 기반으로 합쳐 최신 snapshot을 최종 적용한다.
7. provider 실패는 한 번 재시도하고 `HostedState + NetworkFailure` warning을 남기지만 gameplay 미션 상태를 rollback하지 않는다.

정책을 OFF로 바꿔도 이미 접속이 확정된 Observer를 강제 퇴장시키지 않는다.

## Server Authority Flow

### PreLogin

1. `ARPGameModeBase`가 `RPExpectedRoomId`를 현재 hosted session ID와 비교한다.
2. 실제 `ERPMissionPhase`를 읽는다.
3. 미션 활성 상태라면 `TryGetEffectiveAllowJoinDuringMission_ServerOnly`를 다시 확인한다.
4. Room instance, 미션 상태 또는 정책을 읽지 못하거나 정책이 OFF면 fail-closed로 거절한다.
5. 통과한 연결만 LateJoinObserver 후보가 된다.

### HandleStartingNewPlayer

1. Pawn을 만들기 직전에 실제 미션 상태와 effective 정책을 다시 검사한다.
2. 경합 중 미션이 끝났다면 정상 `Active` 플레이어로 시작한다.
3. 경합 중 정책이 OFF가 됐다면 Pawn spawn 전에 연결을 종료한다.
4. 아직 활성+ON이면 `ARPPlayerState.ParticipationState=LateJoinObserver`, `Ready=false`를 적용하고 일반 `ARPCharacter`를 spawn하지 않는다.

Metadata가 ON이라고 해서 클라이언트나 UI가 Observer 여부를 확정하지 않는다.

## Observer Runtime

- 서버가 활성 팀원 Pawn 한 명을 고정 관전 대상으로 지정한다.
- Observer의 LMB/RMB는 서버 `CanSpectate` 검증을 거쳐 Active + Pawn 목록에서 다음/이전 고정 대상을 선택한다. 자신, 다른 Observer, Pawn 없는 Player는 제외한다.
- 자유 시점, 이동, interaction, Ready 요청은 사용할 수 없다.
- 관전 대상이 이탈하면 다른 활성 팀원 Pawn으로 자동 전환한다.
- `ARPPlayerController`는 participation 복제를 읽어 `SPECTATING · ACTIVE NEXT MISSION`과 LMB/RMB 대상 변경 안내 overlay를 표시한다.
- Ready Panel row에는 `WAITING NEXT MISSION`으로 보이지만 Ready 분자/분모에서는 제외된다.
- v1 재접속은 새 참가와 동일하게 Observer로 처리하며 Observer도 세션 정원을 차지한다.

## Promotion

1. GameState 서버 mission commit을 GameMode가 구독한다.
2. 활성 미션에서 `Succeeded` 또는 `Failed` terminal로 바뀌는 시점은 귀환과 Bureau 결과 처리가 끝난 경계다. 현재 `Failed`는 `RPDevForceMissionFailure`가 이 최종 결과만 시뮬레이션하며 실제 전멸 판정·정산·travel은 후속 범위다.
3. GameMode가 모든 `LateJoinObserver`를 `Active`로 바꾸고 `Ready=false`를 유지한다.
4. 정상 Pawn을 spawn/possess하고 gameplay 입력을 복구한다.
5. SessionSubsystem은 별도로 `EndSession` 후 Waiting/`BUREAU ROOM` metadata 복귀를 수행한다.

Observer 승격과 provider metadata 완료는 서로 다른 책임이다. 한쪽 실패를 이유로 이미 확정된 gameplay 상태를 되돌리지 않는다.

## State And Responsibility

| 상태/판정 | 소유자 |
|---|---|
| 미션 활성/terminal 결과 원본 | `ARPMissionDirector`, `ARPGameStateBase` |
| 접속 허용 재검증, Observer 구성/관전/승격 | `ARPGameModeBase` |
| `Active` / `LateJoinObserver`, Ready 차단과 복제 | `ARPPlayerState` |
| provider metadata mirror와 effective Host policy | `URPSessionSubsystem` |
| Room/Ready/Overlay 표시 | UI session widget bases |

## Contract Links

- **Input Type:** [Online Types API Contract](../Online_Types_Reference.md)
- **State Owner:** [Session Subsystem API Contract](../Session_Subsystem_API_Reference.md)
- **UI Consumer:** [UI Session Widgets API Contract](../ui/UI_Session_Widgets_API.md)
- **Delegates To:** [Session Room Lifecycle](Session_Room_Lifecycle.md)

## Non-Goals And Validation Boundary

실제 TargetMap 이동/ServerTravel, 사망·부활·보상, 자유 유령 능력과 Host Migration은 이 계약의 범위가 아니다. `RPForceLateJoinObserver`는 3 Players PIE retarget 검증용이며 실제 Steam 입장 근거가 아니다. WBP, PIE 2~3 Players와 Steam 두 기기 결과는 [Phase 16 Editor Verification Checklist](../../checklists/Phase_16_Editor_Verification_Checklist.md)에 별도로 기록한다.
