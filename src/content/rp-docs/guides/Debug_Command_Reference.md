---
title: "RP 디버그 콘솔 명령 레퍼런스"
description: "RP 디버그 콘솔 명령 레퍼런스의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Debug_Command_Reference.md"
status: "Current"
documentType: "Guide"
lastReviewed: "2026-07-20"
searchKeywords:
  - "RPDebugCheatManager"
  - "Exec"
  - "콘솔 명령"
  - "Ready"
  - "Session"
  - "Mission"
  - "Carry"
  - "GAS"
  - "Performance"
  - "Headless Smoke"
  - "LateJoinObserver"
  - "RPForceLateJoinObserver"
  - "RPPrintObserverTargets"
  - "RPDevReadyAllAndStartMission"
  - "RPDevSetPlayerReady"
  - "RPDevForceMissionSuccess"
  - "RPDevForceMissionFailure"
  - "RPForceCompleteMission"
  - "RPToggleDebugStatusHUD"
  - "RPToggleDebugUserManagement"
  - "DebugExecBindings"
order: 40
---
Status: Current

Applies To: RP_Live UE 5.8 Development / PIE / Headless smoke

Source Of Truth: `Source/RP/Debug/RPDebugCheatManager.h`

Last Reviewed: 2026-07-20

Search Keywords: RPDebugCheatManager, Exec, 콘솔 명령, Ready, Session, Mission, Carry, GAS, Performance, Headless Smoke, LateJoinObserver, RPForceLateJoinObserver, RPPrintObserverTargets, RPDevReadyAllAndStartMission, RPDevSetPlayerReady, RPDevForceMissionSuccess, RPDevForceMissionFailure, RPForceCompleteMission, RPToggleDebugStatusHUD, RPToggleDebugUserManagement, DebugExecBindings

## 1. 목적

이 문서는 현재 사용할 수 있는 RP 개발 콘솔 명령과 사용 경계를 정리한다.
과거 Phase 문서에 남아 있는 퇴역 명령보다 이 문서와 `AGENTS.md`의 현재 명령 목록을 우선한다.

숫자열 `0`/`9`로 여는 화면형 도구의 상태, 입력 소유권과 Shipping 제외 계약은 [Debug HUD Guide](Debug_HUD_Guide.md)를 따른다. 이 문서는 해당 키가 호출하는 Exec 명령과 서버 권위 변경 경계를 기록한다.

디버그 명령은 제품 UI가 아니다. 다음 목적에만 사용한다.

- PIE에서 서버 RPC와 복제 결과를 빠르게 확인
- 아직 최종 입력/UI가 없는 기능의 상태 전이를 검증
- 로그 스냅샷을 남겨 문제를 재현
- Codex가 UE 5.8 headless 회귀를 실행

## 2. 공통 사용 규칙

1. Phase 15 제품 흐름은 `RPSessionSetReady`와 `RPSessionStartMission`을 사용한다.
2. `RPDevReadyAllAndStartMission`은 반복 개발 검증을 줄이는 단축 명령이며 제품 Ready UI 검증을 대신하지 않는다.
3. `RPSetReady`처럼 SessionSubsystem을 거치지 않는 명령은 저수준 RPC/복제 진단에만 사용한다.
4. PIE 2 Players에서는 명령을 입력한 Host/Client 창을 먼저 확인한다. 각 창의 CheatManager는 해당 로컬 PlayerController를 기준으로 실행된다.
5. 상태 변경 전후에 가능한 경우 `RPPrint...` 명령을 함께 실행한다.
6. 요청을 보냈다는 로그와 서버가 승인했다는 로그를 구분한다. 최종 성공은 서버 로그와 복제 상태로 판정한다.
7. `RPRun...Smoke`는 일반 수동 플레이 명령이 아니라 Codex/headless 회귀 전용이다.
8. Shipping 제품 UX나 Blueprint 제품 로직이 `URPDebugCheatManager`에 의존하면 안 된다.
9. Debug Status/User Management는 Shipping에서 생성·입력·명령이 모두 비활성이다.
10. `Failed`는 사망 순간이 아니라 실패 처리와 관리국 복귀까지 끝난 terminal 결과다. 강제 실패 명령은 실패 판정·정산·연출·실제 travel을 대신하지 않는다.

## 3. 빠른 선택표

| 목적 | 우선 사용할 명령 |
|---|---|
| 숫자열 0 Status HUD | `RPToggleDebugStatusHUD` |
| 숫자열 9 User Management | `RPToggleDebugUserManagement` |
| Host가 지정 Active Player Ready 변경 | `RPDevSetPlayerReady <PlayerId> <0|1>` |
| 제품 Ready 요청 | `RPSessionSetReady 1`, `RPSessionSetReady 0` |
| 제품 미션 시작 요청 | `RPSessionStartMission` |
| 개발 중 모든 Active 플레이어 Ready 후 시작 | `RPDevReadyAllAndStartMission` |
| Ready 복제만 빠르게 확인 | `RPSetReady`, `RPToggleReady`, `RPPrintReadyStates` |
| 미션 선택/진행/문 상태 확인 | `RPPrintMissionState` |
| 선택·시작된 미션 강제 성공 | `RPDevForceMissionSuccess` |
| 선택·시작된 미션 강제 실패 종료 | `RPDevForceMissionFailure` |
| 세션 생성/검색/참가/퇴장 | `RPCreateRoom`, `RPFindRooms`, `RPJoinRoom`, `RPLeaveRoom` |
| 세션 캐시/Provider 진단 | `RPPrintRooms`, `RPPrintSessionDiagnostics` |
| 3 Players PIE Observer 대상 전환 | `RPPrintObserverTargets`, `RPForceLateJoinObserver` |
| 손/수납 상태 확인과 조작 | `RPPrintCarryState`, `RPSetActiveHand`, `RPStashActiveItem`, `RPStashActiveItemToSlot`, `RPDropActiveItem` |
| 정의 DataAsset 발견 상태 확인 | `RPPrintDefinitionAssets` |
| 테스트 GAS 효과 적용/확인 | `RPApplyTestMentalContamination`, `RPApplyTestPanic`, `RPPrintEffectState` |
| Low/Medium/High 성능 프리셋 | `RPLowTest`, `RPMediumTest`, `RPHighTest` |
| Phase 09/10/Ready 핵심 회귀 | `RPRunPhase11ClosureRegressionSmoke` |

### 3.1 화면형 Debug HUD Exec 경계

`Config/DefaultInput.ini`의 `DebugExecBindings`는 상단 숫자열을 다음 명령에 연결한다. 제품 IA/IMC에 Debug 전용 키를 추가하지 않는다.

| 명령 | 기본 키 | 동작 |
|---|---|---|
| `RPToggleDebugStatusHUD` | 상단 숫자열 `0` | 읽기 전용 Status와 Hidden을 전환 |
| `RPToggleDebugUserManagement` | 상단 숫자열 `9` | User Management와 Hidden을 전환. Client는 read-only |

두 화면은 동시에 보이지 않는다. Status 중 `9`는 User Management로, User Management 중 `0`은 Status로 교체한다. 제품 In-Game Menu, Mission Terminal 또는 cursor 기반 modal이 입력을 소유하면 새 User Management 열기는 거절된다.

## 4. 제품 Ready / Mission Start 경로

### `RPSessionSetReady <0|1>`

| 항목 | 내용 |
|---|---|
| 대상 | 사용자 PIE / Host와 Client 각각 |
| 경로 | CheatManager → `URPSessionSubsystem::RequestReady` → PlayerController Server RPC → `ARPPlayerState.bIsReady` 복제 |
| 권위 상태 소유자 | `ARPPlayerState` |
| 용도 | 실제 세션 UI가 사용할 Ready 요청 경계 검증 |

```text
RPSessionSetReady 1
RPSessionSetReady 0
```

PIE 2 Players에서 두 플레이어를 Ready로 만들려면 Host 창과 Client 창에서 각각 `RPSessionSetReady 1`을 실행한다.

### `RPSessionStartMission`

| 항목 | 내용 |
|---|---|
| 대상 | 사용자 PIE / 성공 요청은 Listen Host 전용 |
| 경로 | CheatManager → SessionSubsystem → PlayerController Server RPC → MissionDirector |
| 성공 조건 | Listen Host, 모든 RP PlayerState Ready, Terminal 명시적 선택, 선택 ID와 DoorStatus 유효, 미션 미진행 |
| Client 결과 | 서버 거절이 정상 |

```text
RPSessionStartMission
```

선택 전에는 다음 계열 로그로 거절되어야 한다.

```text
Server_StartMission failed. Result=a mission must be selected at the mission terminal before start
```

요청 함수가 실행됐다는 사실만으로 미션 시작 성공으로 판정하지 않는다. `Server_StartMission succeeded`와 `RPPrintMissionState`의 `MissionInProgress`를 함께 확인한다.

### 개발 워크플로 단축: `RPDevReadyAllAndStartMission`

이 명령은 여러 PIE 창에 Ready 명령을 반복 입력하는 시간을 줄이기 위한 개발 도구다. 제품 Ready 버튼과 개별 Client 요청 경로를 검증할 때는 사용하지 않는다.

| 항목 | 내용 |
|---|---|
| 대상 | 로컬 Listen Host 또는 Standalone 권위 |
| Ready 처리 | 서버 `GameState.PlayerArray`의 `Active` RP PlayerState만 `SetReady_ServerOnly(true)` 적용 |
| 제외 | `LateJoinObserver`를 포함한 모든 non-Active 참여 상태 |
| 시작 처리 | 모든 Active Ready 성공 뒤 `URPSessionSubsystem::RequestStartMission` 제품 경로 호출 |
| 유지되는 검증 | Host 권위, 전체 Active Ready, Terminal 선택, 선택 ID, DoorStatus, 미션 진행 여부 |
| Shipping | 사용 불가 |

```text
RPDevReadyAllAndStartMission
```

Terminal에서 미션을 선택한 뒤 Host 창에서 실행한다. 명령의 제출 로그만으로 시작 성공을 판정하지 말고 `Server_StartMission succeeded`와 `RPPrintMissionState`를 확인한다. Active 플레이어 Ready 처리 중 하나라도 실패하면 미션 시작 요청은 보내지 않는다.

### User Management 개별 Ready: `RPDevSetPlayerReady <PlayerId> <0|1>`

User Management의 Player 행 버튼이 호출하는 Development 전용 Host 명령이다. 콘솔에서도 같은 경계를 직접 확인할 수 있다.

| 항목 | 내용 |
|---|---|
| 대상 | 로컬 Listen Host 또는 Standalone 권위 |
| Player 선택 | `GameState.PlayerArray`에서 일치하는 RP `PlayerId` 조회 |
| 허용 | `Active` PlayerState의 Ready true/false 변경 |
| 거절 | Client, Dedicated, 잘못된 PlayerId, 0/1 외 값, LateJoinObserver, Non-RP PlayerState |
| Shipping | 사용 불가 |

```text
RPPrintReadyStates
RPDevSetPlayerReady 1 1
RPDevSetPlayerReady 1 0
RPPrintReadyStates
```

이 명령은 다른 Client가 실제 Ready 버튼을 눌렀다는 근거가 아니다. 제품 Ready 요청 검증에는 `RPSessionSetReady`를 사용한다.

## 5. Ready 저수준 복제 진단

이 명령들은 SessionSubsystem 어댑터를 건너뛰지만 서버 RPC와 PlayerState 권위는 우회하지 않는다.

| 명령 | 입력 위치 | 동작 |
|---|---|---|
| `RPSetReady 1` | Host 또는 Client | 로컬 PlayerController가 Ready=true를 서버에 요청 |
| `RPSetReady 0` | Host 또는 Client | 로컬 PlayerController가 Ready=false를 서버에 요청 |
| `RPToggleReady` | Host 또는 Client | 현재 로컬 PlayerState Ready의 반대 값을 요청 |
| `RPPrintReadyStates` | 어느 창이든 가능 | 현재 월드 `GameState.PlayerArray`의 모든 RP PlayerState Ready 상태 출력 |

제품 Ready 경로를 검증할 때는 `RPSetReady` 대신 `RPSessionSetReady`를 사용한다.

## 6. 세션 생성·검색·정리와 진단

| 명령 | 대상 | 동작과 주의사항 |
|---|---|---|
| `RPCreateRoom [MaxConnections] [TravelToBureau]` | Host 후보 | 활성 Provider로 방 생성 요청. 연결 수가 0 이하면 4 사용 |
| `RPFindRooms [MaxResults]` | 참가자 | 현재 구현은 최대 결과 수를 전달하고 LAN query=true로 검색 요청 |
| `RPJoinRoom <Index>` | 참가자 | 마지막 검색 캐시의 Index로 참가 요청 |
| `RPPrintRooms` | 어느 창이든 가능 | Provider와 캐시된 방 목록의 간단한 스냅샷 출력 |
| `RPPrintSessionDiagnostics` | 어느 창이든 가능 | Provider, Steam override, NetDriver 등 상세 진단 출력 |
| `RPLeaveRoom` | Host 또는 Client | 사용자용 퇴장 경로. 세션 정리 후 기본 반환 맵으로 이동 |
| `RPDestroyRoom` | 주로 Host/Codex | 개발 중 남은 GameSession 강제 정리. 사용자 퇴장 검증에는 사용하지 않음 |

기본 방 생성:

```text
RPCreateRoom 4
```

### Observer 3 Players PIE 테스트 하네스

| 명령 | 대상 | 동작과 주의사항 |
|---|---|---|
| `RPPrintObserverTargets` | Listen Host | 모든 RP PlayerController의 PlayerId, participation, Pawn, ViewTarget 출력 |
| `RPForceLateJoinObserver [PlayerId]` | Listen Host | 기존 Player를 실제 Observer 구성 경로로 전환. `-1` 또는 생략 시 Host 자신 사용 |

이 명령은 실제 Steam 참가 정책을 대신하지 않는다. 계정 세 개 없이 수동 관전 순환과 `Logout` 자동 재지정만 검증하는 PIE/Development 도구다.

```text
RPPrintObserverTargets
RPForceLateJoinObserver 0
RPPrintObserverTargets
```

Observer 창의 LMB/RMB로 Active Pawn을 순환한 뒤 현재 관전 중인 비-Host Client에서 `disconnect`를 실행한다. Host 로그에서 이전 대상 Logout 뒤 남은 Active Pawn이 새 ViewTarget이 되는지 확인한다.

방 생성 성공 후 `L_BureauRoom_Dev`를 listen으로 열기:

```text
RPCreateRoom 4 1
```

검색과 참가:

```text
RPFindRooms 20
RPPrintRooms
RPJoinRoom 0
```

정상 사용자 퇴장과 개발 강제 정리를 혼동하지 않는다.

```text
RPLeaveRoom
RPDestroyRoom
```

## 7. 정의·아이템·Carry 명령

### 읽기 전용 진단

| 명령 | 출력 |
|---|---|
| `RPPrintDefinitionAssets` | AssetManager/DataSubsystem이 발견한 Item, Mission, Anomaly PrimaryAsset ID와 개수 |
| `RPPrintCarryState` | 활성 손, 양손 아이템, 수납 슬롯 3번 이후의 아이템/연속 슬롯 상태 |

### 상태 조작

| 명령 | 동작 |
|---|---|
| `RPSetActiveHand 0` | 왼손을 활성 손으로 요청 |
| `RPSetActiveHand 1` | 오른손을 활성 손으로 요청 |
| `RPStashActiveItem` | 활성 손 아이템을 첫 수납 가능 위치에 넣도록 서버에 요청 |
| `RPStashActiveItemToSlot <3~6>` | 표시 슬롯 번호를 지정해 수납 요청 |
| `RPDropActiveItem` | 활성 손 아이템을 월드에 내려놓도록 서버에 요청 |

대표 확인 순서:

```text
RPPrintCarryState
RPSetActiveHand 0
RPStashActiveItemToSlot 3
RPPrintCarryState
RPDropActiveItem
RPPrintCarryState
```

명령은 서버 검증 요청을 보내는 도구다. 아이템이 없거나 수납 불가 정의이거나 연속 슬롯이 부족하면 거절되는 것이 정상이다.

## 8. 미션 상태와 개발용 결과 전이

### `RPPrintMissionState`

현재 `ARPGameStateBase`의 MissionSelectionState, MissionRuntimeState, DoorStatus를 출력한다.

```text
RPPrintMissionState
```

Phase 15에서는 다음 시점에 기록하는 것이 유용하다.

- Terminal 상호작용 전
- 화면을 열었지만 확정하지 않은 상태
- 0.75초 확정 직후
- `RPSessionStartMission` 직후
- `RPDevForceMissionSuccess` 또는 `RPDevForceMissionFailure` 직후

### `RPDevForceMissionSuccess`

| 항목 | 내용 |
|---|---|
| 대상 | Listen Host |
| 선행 조건 | Terminal 미션 선택 완료, `RPSessionStartMission` 성공, DoorStatus=`MissionInProgress` |
| 동작 | 허용된 MissionDirector 전이를 순서대로 적용하고 완료 상태와 DoorStatus를 함께 커밋 |
| 제외 | 실제 아이템 제출, Portal 이동, 플레이어 위치 변경 |

```text
RPDevForceMissionSuccess
```

성공 기대값:

```text
Mission Phase: Succeeded
Tutorial Step: ReturnToBureau
Mission Succeeded: true
Door Status: MissionCompleted
```

선택 전 또는 Start 전 호출이 거절되는 것이 정상이다.

기존 `RPForceCompleteMission`은 같은 성공 경로를 호출하는 호환 별칭이다. 새 절차와 문서에는 `RPDevForceMissionSuccess`를 사용한다.

### `RPDevForceMissionFailure`

| 항목 | 내용 |
|---|---|
| 대상 | 로컬 Standalone 또는 Listen Host |
| 선행 조건 | Terminal 미션 선택 완료, 미션 Start 성공, DoorStatus=`MissionInProgress` |
| 동작 | MissionDirector가 현재 active runtime과 선택 ID/문 상태를 재검증한 뒤 `Failed` terminal 결과와 `MissionFailed`를 함께 커밋 |
| 후처리 | Session Waiting/Bureau 복귀, LateJoinObserver Active 승격, Ready=false와 정상 Pawn 복구 |
| 제외 | 실패 조건 판정, 전멸/사망 처리, 보상·손실 정산, 실패 결과 연출, 실제 레벨 travel |

```text
RPDevForceMissionFailure
```

실패 기대값:

```text
Mission Phase: Failed
Tutorial Step: ReturnToBureau
Mission Succeeded: false
Door Status: MissionFailed
```

Client, 선택 전, Start 전, 이미 성공한 미션 또는 runtime/selection ID가 어긋난 상태에서는 거절되어야 한다. 실패 뒤 다음 미션은 Terminal에서 새로 선택해야 한다.

## 9. 테스트 GAS 효과

| 명령 | 기본 예시 | 설명 |
|---|---|---|
| `RPApplyTestMentalContamination <Duration> <Magnitude>` | `RPApplyTestMentalContamination 30 10` | 정신 오염 테스트 효과를 로컬 플레이어 대상으로 서버에 요청 |
| `RPApplyTestPanic <Duration> <Magnitude>` | `RPApplyTestPanic 15 1` | Panic 테스트 효과 요청 |
| `RPPrintEffectState` | `RPPrintEffectState` | PlayerState ASC 태그와 정신상태 Attribute 출력 |

Duration 또는 Magnitude에 0 이하를 전달하면 각 명령의 기본값을 사용한다.

```text
RPPrintEffectState
RPApplyTestMentalContamination 30 10
RPApplyTestPanic 15 1
RPPrintEffectState
```

## 10. 성능 프리셋

| 명령 | 현재 목적 |
|---|---|
| `RPLowTest` | 저사양 반복 테스트와 animation-safe Low 적용 |
| `RPMediumTest` | GTX 1660 / GTX 1060 6GB급 Medium 기준 적용 |
| `RPHighTest` | RTX 2060급 현재 권장 High 기준 적용 |

상세 수치와 복원 방법은 [Performance Test Profile Guide](Performance_Test_Profile_Guide.md)를 따른다.
이 명령들은 최종 제품 그래픽 옵션 UI가 아니다.

## 11. Codex/headless 회귀 전용

### `RPRunPhase11ClosureRegressionSmoke [EffectDuration] [QuitOnComplete]`

`L_Tutorial_Recovery`에서 다음 범위를 한 번에 확인한다.

- Phase 09 Portal / 회수 / 귀환 / 반납 루프
- 중복 미션 시작과 잘못된 Portal 순서 거절
- Ready true/false/true 경로
- Phase 10 테스트 효과 적용과 시간 경과 후 제거

사용자 PIE 체크리스트 대신 실행하는 명령이 아니며 UI, 2 Players 동기화, Steam 실기기 검증을 대체하지 않는다.

프로젝트 루트 PowerShell 예시:

```powershell
& .\Tools\Build\Run_RPCommandlet.ps1 `
  -Map '/Game/RP/Maps/Tutorial/L_Tutorial_Recovery' `
  -Game `
  -ExecCmds 'RPRunPhase11ClosureRegressionSmoke 0.5 1'
```

성공 판정은 프로세스 종료 코드만 보지 않고 반드시 최종 로그를 확인한다.

```text
Phase11ClosureRegression SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true
```

## 12. Phase 15 권장 순서

### PIE 1 Player / Listen Server

```text
RPPrintMissionState
RPSessionSetReady 1
RPSessionStartMission
```

첫 `RPSessionStartMission`은 미션 선택 전 거절 확인용이다. 이후 Terminal에서 후보를 0.75초 유지해 확정한다.

```text
RPPrintMissionState
RPSessionStartMission
RPPrintMissionState
RPDevForceMissionSuccess
RPPrintMissionState
```

### PIE 2 Players / Listen Server

1. Host 창에서 `RPSessionSetReady 1`.
2. Client 창에서 `RPSessionSetReady 1`.
3. Host가 Terminal에서 미션 확정.
4. Host 창에서 `RPSessionStartMission` 성공 확인.
5. Client 창에서 `RPSessionStartMission` 거절 확인.
6. Host 창에서 `RPDevForceMissionSuccess` 또는 별도 실행에서 `RPDevForceMissionFailure`.
7. 성공 실행은 `Succeeded/MissionCompleted`, 실패 실행은 `Failed/MissionFailed`가 Host/Client 양쪽에 동기화되는지 확인.

## 13. 퇴역 명령

| 퇴역 명령 | 대체 | 제거 이유 |
|---|---|---|
| `RPMidTest` | `RPMediumTest` | 완전히 동일한 짧은 별칭 |
| `RPStartMission` | `RPSessionStartMission` | Ready와 명시적 Terminal 선택을 우회하는 legacy 제품 혼동 경로 |
| `RPStartTutorialMission` | `RPSessionStartMission` | `RPStartMission`의 호환 별칭 |

과거 Done Phase 문서에 이 명령들이 남아 있어도 당시 검증 기록으로만 읽는다.
Phase 09/11 회귀에 필요한 `StartLegacyMissionForDebug_ServerOnly`는 콘솔에 노출하지 않고 내부 smoke helper로만 유지한다.

## 14. 명령 추가·변경 시 갱신 규칙

명령을 추가하거나 제거할 때 다음을 함께 확인한다.

- `Source/RP/Debug/RPDebugCheatManager.h`의 `UFUNCTION(Exec)` 선언
- `Source/RP/Debug/RPDebugCheatManager.cpp` 구현
- 화면형 입력 또는 HUD 계약 변경 시 [Debug HUD Guide](Debug_HUD_Guide.md)
- `AGENTS.md` 현재 명령 요약
- 이 문서의 상세 설명과 퇴역 표
- 관련 Phase 체크리스트/절차/Work Report
- `Docs/CODEX_INDEX.md`와 `Docs/mkdocs.yml` 탐색 연결

제품 규칙을 우회하는 임시 명령은 이름과 사용 대상을 명확히 하고, 해당 회귀가 Automation/smoke로 대체되면 콘솔 노출을 제거한다.
