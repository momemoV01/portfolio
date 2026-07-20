---
title: "Phase 15 Work Report - Mission Select / Door Status Panel"
description: "Phase 15 Work Report - Mission Select / Door Status Panel의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "reports/Phase_15_Work_Report.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 15 Work Report - Mission Select / Door Status Panel"
order: 35
---
## 1. 요약

- Phase: Phase 15 - Mission Select / Door Status Panel
- 작성일: 2026-07-09, Mission Terminal 2단계 / Native Panel / Camera Presentation 패치 2026-07-12, ESC 입력 충돌 패치 및 Phase Done 2026-07-13
- 상태: Done. Mission Terminal C++, Host 카메라 Presentation, 별도 Native Mission/Door Panel, Editor/PIE/패키지 검증 완료
- 통합 커밋: `62e0e0a` Phase 15 authority hardening, `efa4744` UE 5.8 실행 진입점, `2ee844d` Review Gate/F-01/F-02 통합
- Codex 검증: 2026-07-10 통합 checkout에서 UE 5.8 RPEditor Win64 Development 성공, `RP.Mission.Selection.ObjectiveVisibility` Automation Test `Result={Success}`, Phase 11 closure headless smoke 최종 `MissionPhase=Succeeded` / `DoorStatus=MissionCompleted` / `SUCCEEDED`, scoped `git diff --check` 성공
- F-01/F-02 Patch Gate: `2ee844d` 통합 main에서 UE 5.8 preflight, Unity/`-DisableUnity` RPEditor Development, ObjectiveVisibility Automation, Phase 11 closure headless smoke를 다시 실행해 모두 통과
- Mission Terminal Gate: 2026-07-12 기능 브랜치에서 UE 5.8 preflight, 정규 Unity/`-DisableUnity` RPEditor Development, Mission Selection Automation 3종, Phase 11 closure headless smoke를 모두 통과
- ESC 입력 충돌: 2026-07-13 Terminal BlendingIn 및 Esc/E 거의 동시 입력에서 메뉴와 Terminal Focus가 경쟁하는 문제를 선점 순서 상호 배제로 보정했다. Unity/Non-Unity 빌드, Mission Selection Automation 3종, Phase 11 smoke와 사용자 PIE 재검증을 모두 통과했다.
- 사용자/Editor 검증: F-01/F-02 Targeted PIE, TerminalViewCamera, 별도 Mission Status Display, Door WidgetComponent, PIE 1 Player와 2 Players / Listen Server, Phase 13/14 회귀를 완료했다.
- 패키지 검증: Windows Development에서 Steam CreateRoom/listen, Mission Terminal 흐름과 Native 패널의 텍스트 외 투명 배경을 확인했다.
- 다음 행동: Phase 16은 `Next` 후보이며 실제 착수 전 Kickoff Plan을 작성한다. GPT Pro Web 정적 검수는 별도 요청 시에만 진행한다.

판정:

- Phase 15 C++ 1차 토대를 구현했고, v1.05에서 선택 권위/Objective 표시/DoorStatus 수명주기 계약을 보정했다.
- 선택 상태의 권위 복제 원본은 `ARPGameStateBase::MissionSelectionState`다.
- 선택 검증과 일반/legacy StartMission 경계는 `ARPMissionDirector`가 담당한다.
- `ARPMissionSelectionTerminal` 상호작용은 선택을 확정하지 않고 Host의 서버 검증 세션만 연다.
- `ARPPlayerController`가 활성 Terminal과 후보 Id를 서버에 보관하고 확정 RPC를 재검증한 뒤 MissionDirector에 위임한다.
- Host 로컬 PlayerController만 Terminal Camera로 ViewTarget을 전환하고 0.40초 뒤 선택 UI를 열며 닫을 때 이전 ViewTarget으로 복귀한다.
- `URPMissionTerminalScreenBase`는 후보 스냅샷만 탐색/요청하며, 공용 `URPMissionSelectionPanelBase`는 GameState 선택 스냅샷을 읽어 표시만 한다.
- 일반 제품 StartMission은 명시적으로 선택된 MissionDefinition을 요구하며, legacy fallback은 Phase 09 자동 시작과 개발/회귀 경로로만 분리한다.
- Phase 15는 Done이다. 네이티브 빌드/자동화/회귀 스모크, F-01/F-02, Terminal Camera, 별도 Mission/Door Status, PIE Host/Client와 Windows Development 패키지 검증을 완료했다. 최종 WBP는 Phase 20 범위다.

---

## 2. 구현된 작업

코드:

- `Source/RP/Mission/RPMissionTypes.h`
- `Source/RP/Data/RPMissionDefinition.h`
- `Source/RP/Data/RPMissionDefinition.cpp`
- `Source/RP/Data/RPMissionDefinitionAutomationTest.cpp`
- `Source/RP/System/RPGameStateBase.h`
- `Source/RP/System/RPGameStateBase.cpp`
- `Source/RP/Mission/RPMissionDirector.h`
- `Source/RP/Mission/RPMissionDirector.cpp`
- `Source/RP/Player/RPPlayerController.h`
- `Source/RP/Player/RPPlayerController.cpp`
- `Source/RP/Player/RPPlayerControllerMissionTerminal.cpp`
- `Source/RP/Mission/RPMissionSelectionTerminal.h`
- `Source/RP/Mission/RPMissionSelectionTerminal.cpp`
- `Source/RP/UI/RPMissionTerminalData.h`
- `Source/RP/UI/RPMissionTerminalData.cpp`
- `Source/RP/UI/RPMissionTerminalDataAutomationTest.cpp`
- `Source/RP/UI/RPMissionTerminalInputAutomationTest.cpp`
- `Source/RP/UI/RPMissionTerminalScreenBase.h`
- `Source/RP/UI/RPMissionTerminalScreenBase.cpp`
- `Source/RP/UI/RPMissionSelectionPanelBase.h`
- `Source/RP/UI/RPMissionSelectionPanelBase.cpp`
- `Source/RP/UI/RPMissionSelectionPanelNative.h`
- `Source/RP/UI/RPMissionSelectionPanelNative.cpp`

데이터/상태:

- `ERPMissionDoorStatus`
  - NoMissionSelected
  - MissionSelected
  - EntryAuthorized: Phase 17 이후 예약 상태, Phase 15 전이에서 사용하지 않음
  - MissionInProgress
  - MissionCompleted
- `FRPMissionSelectionState`
  - 선택 여부
  - MissionDefinitionId
  - MissionDisplayName
  - LocationDisplayName
  - MissionKindId
  - MissionPurposeId
  - RiskLevelId
  - AccessAddress
  - BriefingText
  - ObjectiveText
  - RequiredExtractedValue
  - DoorStatus

GameState:

- `MissionSelectionState` 복제
- `OnRep_MissionSelectionState`
- `SetMissionSelectionState_ServerOnly`
- `SetMissionDoorStatus_ServerOnly`
- 미션 성공 시 MissionRuntimeState와 MissionCompleted DoorStatus 동시 갱신
- `GetMissionSelectionState`
- `GetMissionSelectionDebugText`

MissionDirector:

- `SelectableMissionDefinitions`
- `SelectedMissionDefinition`
- `GetSelectableMissionDefinitions`
- `GetSelectedMissionDefinition`
- `CanSelectMissionDefinition`
- `SelectMissionDefinition_ServerOnly`
- `StartSelectedMission_ServerOnly`
- `StartLegacyMissionForDebug_ServerOnly`
- 선택된 MissionDefinition을 일반 Start 경로에 적용

요청 경계:

- `ARPMissionSelectionTerminal` 서버 검증 세션 열기
- `ARPPlayerController` 활성 Terminal / 후보 Id / 거리 검증
- Client 화면 열기/결과 RPC와 Definition Id 확정 Server RPC

표시 경계:

- `FRPMissionTerminalEntry` 포인터 없는 후보 스냅샷
- `URPMissionTerminalScreenBase` 방향키 탐색 / hold 확정 / Back 취소
- `URPMissionTerminalScreenNative` WBP 없는 기능 검증용 기본 화면
- `URPMissionSelectionPanelBase`
- `URPMissionSelectionPanelNative` 전체 미션 정보 Native 월드 패널
- `URPDoorStatusPanelNative` 소형 Door Status Native 월드 패널
- optional TextBlock binding
- `OnMissionSelectionUpdated`
- `URPMissionDefinition::ResolveObjectiveDisplayText`
- 미선택 Host/Client 상태: `HOST: USE MISSION TERMINAL` / `AWAITING HOST MISSION SELECTION`
- 완료 Door/상태: `MISSION COMPLETE` / `MISSION COMPLETE - RETURN TO BUREAU`

문서:

- `Docs/docs/phases/Phase_15_Mission_Select_Door_Status_Panel.md`
- `Docs/docs/plans/Phase_15_Kickoff_Plan.md`
- `Docs/docs/checklists/Phase_15_Editor_Verification_Checklist.md`
- `Docs/docs/procedures/Phase_15/Checklist_1_2_F01_F02_Targeted_PIE.md`
- `Docs/docs/reports/Phase_15_Work_Report.md`
- `Docs/CODEX_INDEX.md`

---

## 3. 작업 중 발생한 문제와 수정 사항

### 3.1 선택 상태 소유자 확정

- 구분: 구조
- 증상: 선택 상태를 MissionRuntimeState에 섞을지, GameState 별도 상태로 둘지 결정이 필요했다.
- 원인: 기존 `FRPMissionRuntimeState`는 진행 중 미션 런타임 상태에 가깝고, 관리국 룸 선택/문 표시 상태와 수명이 다르다.
- 수정: `FRPMissionSelectionState`를 별도로 만들고 `ARPGameStateBase`가 복제하도록 했다.
- 상태: 구현 완료.

### 3.2 Host 전용 선택 검증

- 구분: 권위
- 증상: Client가 미션 선택을 확정하면 관리국 룸 흐름이 Ready/StartMission 권위 규칙과 어긋난다.
- 원인: Phase 15 선택은 Host 수동 확정 흐름이어야 한다.
- 수정: `ARPMissionDirector::CanSelectMissionDefinition`에서 서버 권위와 Listen Host local controller 기준을 확인한다.
- 상태: 코드 반영. Client Terminal 상호작용의 서버 거절 피드백은 PIE 검증 필요.

### 3.3 StartMission 적용

- 구분: 미션 시작
- 증상: 일반 StartMission이 선택 없이 기존 `MissionDefinition`으로 시작하거나, 실행 중 재요청으로 런타임 값을 초기화할 수 있었다.
- 원인: Phase 09 호환 fallback과 Phase 15 제품 시작 경계가 한 함수에 섞여 있었다.
- 수정: 일반 경로는 `StartSelectedMission_ServerOnly`, Phase 09 자동 시작/개발·회귀 경로는 `StartLegacyMissionForDebug_ServerOnly`로 분리했다. 일반 경로는 서버 권위, 미션 미진행, 유효한 Director 선택 포인터, GameState 선택 여부, 서버 포인터와 복제 선택 ID 일치, `MissionSelected` 또는 향후 `EntryAuthorized` DoorStatus를 모두 요구한다.
- 완료/재요청 규칙: 일반 경로는 실행 중 또는 `MissionCompleted`에서 런타임 값을 바꾸지 않고 거절한다. 완료 후 Terminal 재선택이 `MissionSelected`를 만든 뒤에만 다음 일반 Start를 허용한다.
- Legacy/Debug 규칙: 기존 MissionDefinition fallback과 진행 상태 강제 초기화는 BeginPlay 자동 시작과 Phase 11 smoke 내부 helper에만 허용한다. 사용자 콘솔의 `RPStartMission` / `RPStartTutorialMission`은 Phase 15 명령 정리에서 제거했다.
- 상태: 코드 반영, RPEditor 빌드와 Phase 11 headless smoke 통과. 제품 Start 불변식은 PIE에서 최종 확인 필요.

### 3.4 빌드 중 include 문제

- 구분: C++ 컴파일
- 증상: `ARPMissionSelectionTerminal`에서 `GetNameSafe(URPMissionDefinition*)` overload를 찾지 못했다.
- 원인: `.cpp`에서 `URPMissionDefinition`이 forward declaration 상태였다.
- 수정: `RPMissionSelectionTerminal.cpp`에 `../Data/RPMissionDefinition.h` include를 추가했다.
- 상태: 2026-07-10 v1.05 포함 RPEditor Win64 Development 빌드 성공.

### 3.5 Terminal / Panel UX 확정

- 구분: UX / 요청 경계
- 증상: 고정 Terminal 즉시 선택과 후보 목록형 Panel 선택이 동시에 가능한 것처럼 보였다.
- 원인: C++ 1차 토대에 PlayerController/Panel 선택 요청 API가 함께 남아 있었다.
- 수정: 당시 Phase 15 제품 UX를 `Mission Terminal 즉시 선택 + Panel 표시 전용`으로 좁혔다.
- 상태: 2026-07-12 사용자 방향 변경으로 아래 3.5.1의 서버 검증 Terminal 세션/후보 탐색 흐름으로 대체됐다. 공용 Panel 표시 전용 계약은 유지한다.

### 3.5.1 Mission Terminal 2단계 선택 흐름

- 구분: UX / 권위 / 입력
- 변경: Terminal 상호작용은 GameState를 바꾸지 않고 Host 전용 서버 세션과 `FRPMissionTerminalEntry` 목록만 연다.
- 서버 검증: PlayerController가 활성 Terminal, 350cm 거리, Host, 제시 후보 Id를 확인하고 기존 `MissionDirector::SelectMissionDefinition_ServerOnly`에 최종 위임한다.
- Client 데이터: DataAsset 포인터 대신 공개 정책이 적용된 이름/설명/주소/Objective 스냅샷만 Client RPC로 전달한다.
- 입력: Up/Down/W/S 순환, E/Enter/Gamepad Accept 0.75초 hold, Q/Esc/Gamepad Back 취소, 성공 후 약 0.6초 자동 닫기와 입력 복구를 제공한다.
- 구조: PlayerController 기본 파일 비대화를 피하도록 Terminal 전용 구현을 `RPPlayerControllerMissionTerminal.cpp`로 분리했다.
- 상태: UE 5.8 UHT/compile과 Editor 종료 후 정규 Unity/Non-Unity 전체 link를 통과했다. 사용자 PIE Host/Client 검증도 완료했다.

### 3.5.2 Native Mission Status / Door Status 월드 패널

- 구분: UI fallback / 복제 표시
- 변경: `URPMissionSelectionPanelBase`에 Native 갱신 지점을 추가하고 전체 정보용 `URPMissionSelectionPanelNative`, 소형 문 상태용 `URPDoorStatusPanelNative`를 추가했다.
- 데이터: 두 Native 패널은 DataAsset이나 MissionRuntimeState를 직접 읽지 않고 GameState가 복제한 `FRPMissionSelectionState`만 표시한다.
- 월드 위젯: GameState 조회를 OwningPlayer 존재 여부와 분리하고, Host/Client 안내 문구 판정만 로컬 PlayerController를 사용한다.
- 표현: 전용 리소스 없이 녹색 텍스트만 그리는 Slate 화면이다. Native C++ 배경은 `FSlateNoResource`, World WidgetComponent는 `Transparent` / Background Alpha `0`이며 입력, Focus, 선택 요청, 권위 상태 변경 기능은 없다.
- 장기 경계: Native 패널은 영구 fallback으로 유지하고 최종 WBP 3종은 Phase 20에서 기존 Base 계약을 상속해 교체한다.

### 3.5.3 Terminal Camera Presentation / 별도 Mission Status Display

- 구분: Host 로컬 카메라 / UI 표현 배치
- Terminal: `TerminalMesh`에 `TerminalViewCamera`를 붙이고 기본 FOV 50, Blend In 0.35초, 화면 표시 0.40초, Blend Out 0.25초를 BP 튜닝값으로 제공한다.
- PlayerController: 이전 ViewTarget과 입력 상태를 저장하고 BlendingIn / Active / BlendingOut 단계를 거쳐 실제 UI를 지연 생성한 뒤 복귀한다.
- 정리: 중복 진입, Terminal 파괴, EndPlay, ClientTravel, 타이머 중단 시 로컬 화면/카메라/입력을 정리하며 Camera가 없으면 기존 즉시 UI로 fallback한다.
- 공용 표시: 선택 컴퓨터에는 World WidgetComponent를 두지 않고 별도 `BP_RPMissionStatusDisplay`가 기존 `URPMissionSelectionPanelNative`를 표시한다.
- 네트워크: 기존 Client RPC에 사용 Terminal 참조만 추가하고 새 Server RPC, Replicated 변수, Build.cs 의존성은 추가하지 않았다.

### 3.6 Objective 표시 정책

- 구분: 데이터 공개 경계
- 증상: `ObjectiveVisibility`와 무관하게 공개 Objective 문구가 선택 스냅샷에 들어갈 수 있었다.
- 원인: 표시 스냅샷 생성 시 공개 정책을 해석하지 않았다.
- 수정: `URPMissionDefinition::ResolveObjectiveDisplayText`가 Visible은 PlayerFacing -> Obscured -> Debug 순 fallback, Obscured는 Obscured 문구 또는 `OBJECTIVE CLASSIFIED`만 허용하고 공개/Debug 역 fallback 금지, HiddenUntilDiscovered는 항상 `UNDISCLOSED`를 반환하도록 했다.
- 상태: `RP.Mission.Selection.ObjectiveVisibility` Automation Test와 Host/Client 동일 표시 PIE 검증을 통과했다.

### 3.7 DoorStatus 완료 수명주기

- 구분: 복제 상태
- 증상: 미션 성공 후에도 DoorStatus가 `MissionInProgress`로 남았다.
- 원인: 성공 처리에서 MissionRuntimeState만 갱신하고 선택 표시 상태의 완료 전이를 하지 않았다.
- 수정: 기존 enum 숫자를 보존하도록 `MissionCompleted`를 마지막에 추가했다. 성공 전이 한곳에서 RuntimeState와 DoorStatus를 함께 바꾸며 선택 스냅샷은 유지한다. UI는 Door에 `MISSION COMPLETE`, 상태 문구에 `MISSION COMPLETE - RETURN TO BUREAU`를 표시한다.
- 상태: Phase 11 headless smoke에서 최종 `Mission Phase: Succeeded`와 `Door Status: MissionCompleted`를 함께 확인했고 Host/Client 완료 동기화와 재선택 PIE도 통과했다.

### 3.8 Pre-Phase 15 hardening 통합

- 구분: 권위 / 무결성
- 변경: 서버 상호작용 재추적과 거리/차폐/요청 대상 일치 검증, 요청 cooldown, 미션 명시적 전이 검증, 팀 Portal 사전 배치 검사와 실패 rollback을 Phase 15 선택/문 상태 흐름에 통합했다.
- 상태 갱신: `ARPGameStateBase::SetMissionStates_ServerOnly`로 런타임 상태와 선택 표시 상태를 같은 서버 갱신 경계에서 커밋한다.
- 재시작: 완료된 미션은 fresh validated selection이 있을 때만 일반 제품 경로에서 다시 시작할 수 있고, legacy/debug 경로는 완료/진행 상태를 묵시적으로 초기화하지 않는다.
- 검증: 통합 후 UE 5.8 빌드, ObjectiveVisibility Automation Test, Phase 11 closure smoke가 모두 통과했다.

### 3.9 UE 5.8 Steam socket 설정 경고

- 구분: 엔진 마이그레이션 설정
- 증상: UE 5.8 headless 실행에서 `bAllowP2PPacketRelay`와 `P2PConnectionTimeout`이 이전 `OnlineSubsystemSteam` 섹션에서 읽힌다는 경고와 `P2PCleanupTimeout` 누락 경고가 발생했다.
- 원인: UE 5.8 `SocketSubsystemSteamIP`가 세 키를 `[SocketSubsystemSteamIP]`에서 읽지만 Engine 기본값 일부는 이전 섹션에 남아 있다.
- 수정: 기존 동작값을 보존해 `bAllowP2PPacketRelay=true`, `P2PConnectionTimeout=90`, `P2PCleanupTimeout=1.5`를 프로젝트 `DefaultEngine.ini`의 새 섹션에 명시했다.
- 검증: 경고가 사라졌고 Phase 11 closure smoke가 다시 성공했다. `RPPrintSessionDiagnostics`에서 `ActiveSubsystem=STEAM`, `SteamNetDriverDefinition=Configured`, `GameNetDriverClassLoad=Loadable`을 확인했다. 실제 두 기기 Steam 회귀는 별도 잔여 게이트다.

### 3.10 M-01 API 문서 정합성 재검증

- 구분: 문서/API 정합성
- F-01/F-02 작성 checkout `ed25755c0688e37de24c597544fe4b1f914b9aef`에는 `SetMissionStates_ServerOnly`가 없었지만, 검수 기준과 최신 main에는 해당 API가 존재한다.
- 최신 main API: `SetMissionRuntimeState_ServerOnly`, `SetMissionSelectionState_ServerOnly`, `SetMissionDoorStatus_ServerOnly`, `SetMissionStates_ServerOnly`.
- 조치: hardening 통합 문서의 `SetMissionStates_ServerOnly` 표기를 유지하고 실제 `ARPGameStateBase` 선언/구현과 다시 대조한다.
- 상태: `2ee844d` 통합 main에서 선언/구현/호출과 문서 표기가 일치함을 재확인했다.

### 3.11 Phase 15 강제 완료 디버그 명령

- 목적: 실제 회수/귀환 콘텐츠를 반복하지 않고 Native Mission Status와 Door Status의 완료 표시를 검증한다.
- 명령: Host 콘솔의 `RPForceCompleteMission`.
- 권위: CheatManager는 요청만 하고 `ARPMissionDirector::ForceCompleteMissionForDebug_ServerOnly`가 서버 권위와 선택/시작 상태를 검증한다. Client 콘솔 호출은 거절한다.
- 전이: 현재 활성 단계부터 기존 허용 전이를 순서대로 커밋하고, 요구 회수값을 충족한 뒤 `Succeeded/ReturnToBureau`와 `DoorStatus=MissionCompleted`를 함께 커밋한다.
- 제외: 실제 아이템 제출, Portal 이동, 플레이어 위치 변경은 수행하지 않는 표시/수명주기 검증 전용 명령이다.

### 3.12 디버그 명령 정리

- 유지: 제품 경로 `RPSessionSetReady` / `RPSessionStartMission`, Ready 저수준 복제 진단, 세션/상태 출력, 아이템/효과/성능 3단계, `RPForceCompleteMission`, Phase 11 closure smoke.
- 제거: 완전 중복 별칭 `RPMidTest`, 제품 Ready/명시적 선택을 우회하던 `RPStartMission`, 호환 별칭 `RPStartTutorialMission`.
- C++ 정리: 사용처 없는 `StartTutorialMission_ServerOnly` 별칭을 제거했다.
- 회귀 보존: `StartLegacyMissionForDebug_ServerOnly`는 BeginPlay 호환과 Phase 11 closure smoke가 직접 사용하므로 Exec 명령 없이 내부 경로로만 유지한다.
- 현재 수동 Phase 15 검증 명령은 `RPSessionSetReady`, `RPSessionStartMission`, `RPPrintMissionState`, `RPForceCompleteMission`이다.
- 상세 카탈로그: [RP 디버그 콘솔 명령 레퍼런스](../guides/Debug_Command_Reference.md).

F-03 turn-in 원자성과 F-04 Localization manifest 이식성의 상세 판단은 [Phase 15 P3 Design Review](Phase_15_P3_Design_Review.md)에 기록했다.

---

## 4. 구조 규칙 준수/예외

```text
[x] 새 상태 소유자를 GameState 복제 상태로 명확히 했다.
[x] MissionDirector가 선택 검증과 StartMission 적용을 담당한다.
[x] Mission Terminal만 선택 요청 경계로 동작한다.
[x] Widget은 표시 스냅샷만 읽고 권위 상태를 소유하거나 선택 요청을 보내지 않는다.
[x] Client request -> Server validation -> ServerOnly mutation -> Replication 흐름을 유지했다.
[x] Steam / OnlineSubsystem 타입을 Phase 15 UI에 노출하지 않았다.
[x] 새 Build.cs 의존성을 추가하지 않았다.
[x] Debug HUD 문자열 파싱에 의존하지 않았다.
```

책임 검토:

```text
새 상태 소유자:
- ARPGameStateBase::MissionSelectionState

클라이언트 요청 경로:
- ARPMissionSelectionTerminal interaction

서버 검증 경계:
- ARPMissionDirector::CanSelectMissionDefinition
- ARPMissionDirector::SelectMissionDefinition_ServerOnly

복제 경계:
- FRPMissionSelectionState

UI 표시 경계:
- URPMissionSelectionPanelBase cached MissionSelectionState

다음 Phase 전에 리팩터링이 필요한가:
- Phase 15 Editor/PIE 검증 전 대규모 분리는 하지 않는다.
- ARPMissionDirector.cpp는 hardening 통합 후 약 1,495줄이며 선택/시작/Portal/회수/성공 처리를 함께 조율하므로 Phase 15 Editor/PIE 검증 직후 우선 분리 후보로 기록한다.
- Objective/Reward/Failure 또는 실제 Gate/Entry 흐름을 더 붙이기 전에 selection/start helper, explicit Director reference, objective/reward/failure helper 분리를 별도 구조 세션에서 검토한다.
```

예외 또는 후속 후보:

- `ERPMissionDoorStatus::EntryAuthorized`, Open Gate, 실제 진입 허가 전환은 Phase 15에서 사용하지 않고 Phase 17 이후 문/게이트 서버 권위 흐름에서 확정한다.
- `Start Mission On Begin Play`가 true인 기존 테스트 설정은 Phase 15 수동 선택 검증과 충돌할 수 있다. Phase 15 검증 맵에서는 false로 둔다.
- 기존 고정 MissionDefinition fallback은 일반 제품 Start에 사용하지 않고 Phase 09 호환 자동 시작과 개발/회귀에만 사용한다.
- MissionPurposeId는 현재 표시 스냅샷에 유지한다. Objective 발견/해금 상태와 ObjectiveRevealRequirementId 판정은 후속 Objective/Journal 흐름으로 넘긴다.
- 선택 가능한 MissionDefinition 후보 목록은 아직 DataRegistry/AssetManager 기반 자동 수집이 아니라 MissionDirector Details 설정이다.
- Phase 15에서 실제 검증할 후보는 현재 런타임과 호환되는 SameWorldZone / RecoverAndExtract 계열로 제한한다. 다른 EntryMode/Objectives의 실제 라우팅과 성공 판정은 후속 Phase 범위다.

---

## 5. 현재 남은 이슈

- 최종 Terminal / Mission Selection / Door Status WBP와 Case File/CRT 리소스는 Phase 20 작업이며 기능 검증에는 필요하지 않다.
- `EntryAuthorized`, Open Gate, 실제 문/Portal 이동과 필수 Pawn 이동 실패 rollback은 Phase 17 이후 해당 기능 구현 Gate에서 검증한다.
- Turn-in은 CarryComponent에서 아이템을 추출한 뒤 미션 상태를 커밋한다. 극히 늦은 상태 커밋 실패 시 아이템 추출 rollback이 없으므로, 후속 transaction helper 분리 시 보강해야 한다.
- `ARPMissionDirector.cpp`와 `RPPlayerControllerMissionTerminal.cpp`는 후속 구조 정리에서 transition/portal transaction과 presentation helper 분리 후보로 유지한다. Phase 15 완료를 위해 대규모 이동하지 않는다.

---

## 6. 사용자가 Unreal Editor에서 해야 하는 작업

상세 절차:

```text
Docs/docs/checklists/Phase_15_Editor_Verification_Checklist.md
Docs/docs/procedures/Phase_15/Checklist_1_2_F01_F02_Targeted_PIE.md
Docs/docs/procedures/Phase_15/Checklist_3_Native_Mission_Door_Panels.md
```

- 기능 검증 시 PlayerController `MissionTerminalScreenClass`를 비워 C++ 기본 화면을 사용한다.
- Terminal의 기존 `MissionSelectionDisplay`는 제거하고 inherited `TerminalViewCamera`를 모니터 정면에 맞춘다.
- 별도 `BP_RPMissionStatusDisplay`와 Bureau Door에 Native Panel용 World Space WidgetComponent를 추가한다.
- `URPMissionSelectionPanelNative`와 `URPDoorStatusPanelNative`를 배치하고 Tick Automatic / Manual Redraw Off / No Collision을 확인한다.
- Phase 20 최종 그래픽 작업 시 세 WBP는 기존 Base 계약에서 파생하고 Widget Class만 교체한다.
- 별도 `BP_RPMissionStatusDisplay`에 `MissionStatusDisplay`를 연결한다.
- 기존 `BP_Portal_BureauDoorToAnomaly`에 `DoorStatusDisplay`를 연결하고 `L_BureauRoom_Dev`에서 위치를 조정한다.
- MissionDirector의 `SelectableMissionDefinitions`에 현재 런타임과 호환되는 검증용 MissionDefinition을 설정한다.
- ObjectiveVisibility Visible / Obscured / HiddenUntilDiscovered 표시를 확인할 검증 데이터를 준비한다.
- Phase 15 검증 맵에서는 `Start Mission On Begin Play`를 false로 둔다.
- PIE 1 Player와 PIE 2 Players / Listen Server에서 Host 세션/탐색/hold 확정, Client 거절/공용 표시, 선택 필수 Start, MissionCompleted와 재선택을 확인한다.

---

## 7. 테스트해야 하는 항목

### Codex 빌드

- [x] 2026-07-09 C++ 1차 foundation RPEditor Win64 Development
- [x] 2026-07-09 당시 Phase 15 touched files whitespace check
- [x] 2026-07-10 v1.05 변경 포함 UE 5.8 RPEditor Win64 Development
- [x] 2026-07-10 `RP.Mission.Selection.ObjectiveVisibility` Automation Test
- [x] 2026-07-10 `RPRunPhase11ClosureRegressionSmoke 0.5 1`
  - Phase 09 / Ready / Phase 10 성공
  - 최종 `Door Status: MissionCompleted` 확인
- [x] 2026-07-10 hardening 통합 이후 위 Automation / smoke 재실행
  - ObjectiveVisibility `Result={Success}`
  - `MissionPhase=Succeeded`, `DoorStatus=MissionCompleted`, final `SUCCEEDED`
  - UE 5.8 SocketSubsystemSteamIP 설정 키 이동 경고 제거 후 재통과
- [x] v1.05 touched files scoped `git diff --check`
- [x] MkDocs nav/Markdown 상대 링크 정적 확인
  - 현재 Python 환경에 `mkdocs` 모듈이 없어 사이트 build는 N/A이며 Phase 15 완료 차단 조건이 아니다.
- [x] Phase 15 범위 `git diff --check`
  - 전체 worktree의 기존 사용자 변경은 건드리지 않았으며 완료 근거는 scoped check를 사용한다.

### 1차 Patch Gate 재검증 - 2026-07-10

- [x] `Tools/Build/RP_EnginePreflight.ps1`
  - UE `5.8.0`, EngineAssociation `5.8`, Target `BuildSettingsVersion.V7` / `Unreal5_8` 확인
- [x] Unity RPEditor Win64 Development
  - `Build_RP.ps1 -Target RPEditor -Configuration Development -MaxParallelActions 4`
  - `Result: Succeeded`
- [x] Non-Unity RPEditor Win64 Development
  - 위 명령에 `-DisableUnity` 추가
  - 50 actions에서 `RPCarryComponent.cpp`, `RPMissionDirector.cpp`, `RPMissionDefinitionAutomationTest.cpp` 개별 컴파일, `Result: Succeeded`
- [x] `RP.Mission.Selection.ObjectiveVisibility`
  - `Test Completed. Result={Success}`, 1 test
  - 로그: `Saved/Logs/Codex_Phase15_ObjectiveVisibility_PatchGate.log`
- [x] `RPRunPhase11ClosureRegressionSmoke 0.5 1`
  - `Mission Phase: Succeeded`, `Door Status: MissionCompleted`
  - `Phase11ClosureRegression SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true`
  - 로그: `Saved/Logs/Codex_Phase15_RegressionSmoke_PatchGate.log`
- [x] 수정 범위 scoped `git diff --check`
- [x] Phase 15 범위 `git diff --check`
  - 전체 worktree는 기존 사용자 변경 `Config/DefaultEditor.ini:23: new blank line at EOF` 때문에 실패하며 이번 커밋 범위에서 제외했다.

이 재검증은 build/commandlet 근거이며 Editor 배치, PIE 1 Player, PIE 2 Players / Listen Server, Packaging, Steam Host/Client 검증을 의미하지 않는다.

### 최신 main 통합 재검증 - Codex 2026-07-10

- [x] 통합 기준: `2ee844d` (`main`)
- [x] UE 5.8 preflight
  - Engine `5.8.0`, EngineAssociation `5.8`, Target `V7` / `Unreal5_8`
- [x] Unity RPEditor Win64 Development
  - `Build_RP.ps1 -Target RPEditor -Configuration Development -MaxParallelActions 4`
  - `Result: Succeeded`
- [x] `-DisableUnity` RPEditor Win64 Development
  - 위 명령에 `-DisableUnity` 추가
  - `Result: Succeeded`
- [x] `RP.Mission.Selection.ObjectiveVisibility`
  - `Test Completed. Result={Success}`, 1 test
  - 로그: `Saved/Logs/Codex_Phase15_ObjectiveVisibility_MainGate.log`
- [x] `RPRunPhase11ClosureRegressionSmoke 0.5 1`
  - `Mission Phase: Succeeded`, `Door Status: MissionCompleted`
  - `Phase11ClosureRegression SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true`
  - 로그: `Saved/Logs/Codex_Phase15_RegressionSmoke_MainGate.log`
- [x] F-01/F-02 C++ 통합 diff와 문서 범위 `git diff --check`

이 결과는 최신 main의 코드/build/commandlet Gate 통과이며 Editor 배치와 F-01/F-02 Targeted PIE 완료를 의미하지 않는다.

### Mission Terminal 2단계 기능 브랜치 Gate - Codex 2026-07-12

- [x] 작업 기준: `f71beb4` editor/doc baseline 위 `feat/phase15-mission-terminal-flow`
- [x] UE 5.8 preflight
  - Engine `5.8.0`, EngineAssociation `5.8`, EngineRoot `F:\UE_5.8`
- [x] 정규 Unity RPEditor Win64 Development
  - `Build_RP.ps1 -MaxParallelActions 4`
  - `Result: Succeeded`
- [x] 정규 Non-Unity RPEditor Win64 Development
  - `Build_RP.ps1 -DisableUnity -MaxParallelActions 4`
  - 새 Terminal 관련 소스와 모듈을 13 actions로 개별 컴파일/링크, `Result: Succeeded`
- [x] `RP.Mission.Selection` Automation 3종
  - `ObjectiveVisibility`, `TerminalData`, `TerminalInput` 모두 `Result={Success}`
  - 보고서: `Saved/Automation/Phase15MissionTerminal/index.html`
  - 로그: `Saved/Logs/Codex_Phase15_MissionTerminal_Automation.log`
- [x] `RPRunPhase11ClosureRegressionSmoke 0.5 1`
  - `Selected Mission: TutorialRecovery`, `Door Status: MissionCompleted`
  - `Phase11ClosureRegression SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true`
  - 로그: `Saved/Logs/Codex_Phase15_MissionTerminal_RegressionSmoke.log`
- [x] 첫 회귀 실행에서 DataAsset 없는 legacy tutorial 시작이 선택 스냅샷을 만들지 않는 기존 호환 공백을 발견했다.
  - legacy 시작은 정규화된 첫 후보를 우선 사용하고, 후보 DataAsset도 없는 옛 맵에는 `TutorialRecovery` 선택 스냅샷을 함께 만들어 DoorStatus 계약을 유지하도록 최소 보정했다.
- [x] 기능 브랜치 C++/문서 범위 `git diff --check`
- [x] Phase 15 범위 `git diff --check`
  - 전체 worktree에는 사용자/Editor 변경 `Config/DefaultEditor.ini:23: new blank line at EOF`만 남아 있으며 이번 커밋에서 제외한다.

이 Gate는 C++ 빌드/Automation/commandlet 근거다. GPT Pro Web 정적 검수는 현재 미요청인 비차단 선택 항목이며, Editor/PIE Host/Client 검증은 아래와 같이 사용자 확인을 완료했다.

### 1 Player PIE

- [x] Mission Select / Door Status 표시
- [x] Host Ready 이후 선택 전 일반 StartMission 거절
- [x] Host Mission Terminal 상호작용
- [x] 선택된 MissionDefinition 표시 스냅샷 갱신
- [x] ObjectiveVisibility Visible / Obscured / HiddenUntilDiscovered 표시 정책
- [x] DoorStatus `MISSION SELECTED` 표시
- [x] Host StartMission 후 `MISSION IN PROGRESS` 표시
- [x] 실행 중 StartMission 재요청 거절 및 런타임 값 유지
- [x] Phase 09 미션 루프 회귀
- [x] 성공 후 DoorStatus `MISSION COMPLETE`, 상태 문구 `MISSION COMPLETE - RETURN TO BUREAU` 표시
- [x] MissionCompleted에서 재선택 전 일반 StartMission 거절
- [x] MissionCompleted 후 Host Terminal 재선택과 다음 일반 StartMission 허용

### 2 Players / Listen Server PIE

- [x] Host/Client all-ready 이후 선택 전 Host StartMission 거절
- [x] Host 선택 가능
- [x] Client Terminal 선택 거절
- [x] Host/Client 선택 정보 동기화
- [x] Host/Client ObjectiveVisibility 표시 동기화
- [x] Host/Client DoorStatus 동기화
- [x] Host StartMission 성공
- [x] Client StartMission 거절 유지
- [x] 실행 중 Host StartMission 재요청 거절
- [x] Host/Client `MissionCompleted` 및 `MISSION COMPLETE` 동기화
- [x] 완료 후 재선택 전 Start 거절, Host 재선택 결과와 다음 Start 동기화
- [x] Phase 14 Ready Panel 회귀

### Phase 13 / Session 회귀

- [x] Create Room
- [x] Refresh Room List
- [x] Join Room
- [x] ESC / Back / Leave Room
- [x] Host recreate 후 Client rejoin

---

## 8. 완료 기준

- [x] v1.05 변경 포함 RPEditor Win64 Development 빌드 통과
- [x] ObjectiveVisibility Automation Test 통과
- [x] Phase 11 headless smoke와 최종 MissionCompleted 통과
- [x] hardening 통합 이후 UE 5.8 Automation / headless smoke 재통과
- [x] Phase 15 touched files scoped `git diff --check` 통과
- [x] 기능형 Mission Terminal 화면과 Terminal Actor 배치 확인 ✅ 2026-07-12
- [x] Terminal Camera와 별도 Mission Status / Door Status WidgetComponent 배치 완료 ✅ 2026-07-13
- [x] Terminal 상호작용만으로 무변경 / 후보 탐색 / 0.75초 hold 확정 / 취소와 입력 복구 검증 완료 ✅ 2026-07-13
- [x] PIE 1 Player 선택 필수 / Objective 표시 / MissionCompleted / 재선택 검증 완료 ✅ 2026-07-13
- [x] PIE 2 Players / Listen Server Host 권위 / Client 표시 동기화 검증 완료 ✅ 2026-07-13
- [x] Phase 13 Session / Phase 14 Ready Panel / Phase 09 미션 루프 회귀 확인 ✅ 2026-07-13
- [x] Editor 결과와 체크리스트의 Done 검수 자료를 이 Work Report에 반영 ✅ 2026-07-13
- [x] 위 근거를 기록하고 `Docs/CODEX_INDEX.md`와 Phase 문서를 Done으로 변경 ✅ 2026-07-13

---

## 9. 다음 세션 시작 지점

```text
1. AGENTS.md와 Docs/CODEX_INDEX.md에서 Phase 15 Done / Phase 16 Next 상태를 확인한다.
2. Phase_16_Steam_Lobby_UX_Completion.md를 읽고 착수 전 Phase_16_Kickoff_Plan.md를 작성한다.
3. Phase 15의 최종 WBP/CRT/ASCII 시각 작업은 Phase 20, 실제 Entry/Open Gate/Portal 이동은 Phase 17 이후 범위로 유지한다.
4. 기능 브랜치 원격 push 또는 main 병합은 사용자 승인을 받은 뒤 진행한다.
```

---

## 10. v1.05 상세 변경 기록

- Mission 선택 제품 경로를 `ARPMissionSelectionTerminal` 하나로 좁혔다.
- 일반 Start와 Phase 09 호환/개발 Start를 `StartSelectedMission_ServerOnly` / `StartLegacyMissionForDebug_ServerOnly`로 분리했다.
- 일반 Start는 선택/ID/DoorStatus/진행 상태 불변식을 검증하고, fallback과 강제 초기화는 사용자 콘솔이 아닌 Phase 09/11 내부 회귀 Start에만 허용한다.
- Phase 11 closure smoke는 Legacy/Debug 강제 시작 경로를 사용한다.
- `URPMissionDefinition::ResolveObjectiveDisplayText`를 Objective 표시 정책 경계로 기록했다.
- DoorStatus에 `MissionCompleted`를 추가하고 완료 후 재선택 계약을 기록했다.
- `EntryAuthorized` / Open Gate / 실제 문 열림·진입 허가는 Phase 17 이후로 넘겼다.
- 500줄을 넘은 `ARPMissionDirector`는 Phase 15 PIE 전 대규모 이동 없이 후속 분리 후보로 남겼다.

---

## 11. v1.11 Mission Terminal 흐름 변경 기록

- 단일 Terminal `MissionDefinition`과 즉시 선택 API를 제거했다.
- 서버 후보 스냅샷, 중복 Definition Id 거절, 활성 Terminal/거리/후보 재검증을 추가했다.
- WBP 없이 동작하는 Native 화면과 후속 `URPMissionTerminalScreenBase` WBP 교체 경계를 추가했다.
- 공용 GameState 선택 복제와 `URPMissionSelectionPanelBase` 표시 전용 계약은 변경하지 않았다.
- legacy tutorial 회귀는 첫 정규화 후보 또는 DataAsset 없는 `TutorialRecovery` 선택 스냅샷으로 기존 MissionCompleted DoorStatus 계약을 유지했다.
- UE 5.8 정규 Unity/Non-Unity 빌드, Mission Selection Automation 3종, Phase 11 closure smoke를 통과했다.
- 새 RPC/권위 경계이므로 `feat/phase15-mission-terminal-flow` 기능 브랜치에서 격리해 구현했다. GPT Pro Web 검수는 사용자 요청 시에만 추가한다.

---

## 12. v1.13 선택형 Web 검수 정책

- Phase 기능 추가와 중간 이상 C++ 변경은 계속 기능 브랜치에서 분리한다.
- GPT Pro Web 검수는 자동 실행하지 않고 사용자가 해당 작업에 대해 명시적으로 요청할 때만 진행한다.
- 현재 Mission Terminal 작업의 Web 검수는 미요청이며 Phase Done, main 통합, Editor/PIE의 미완료 Gate가 아니다.
- 구현 완료 근거는 UE 5.8 로컬 build/Automation/smoke와 사용자 Editor/PIE 체크리스트로 관리한다.

---

## 13. v1.14 Native Mission / Door Panel

- WBP 없이 동작하는 `URPMissionSelectionPanelNative`, `URPDoorStatusPanelNative`를 영구 fallback으로 추가했다.
- 공용 Mission Selection 정보와 Door Status는 기존 GameState 선택 스냅샷만 읽으며 새 RPC/복제 상태를 추가하지 않았다.
- 최종 Native fallback은 C++에서 `FSlateNoResource`로 텍스트 외 배경을 그리지 않는다. World WidgetComponent는 `Blend Mode=Transparent`, `Background Color Alpha=0`을 사용한다.
- Native Panel WidgetComponent 연결 절차를 Phase 15 상세 절차와 체크리스트 3번에 연결했다.
- Terminal / Mission Selection / Door Status 최종 WBP와 Case File / ASCII / CRT 리소스 제작은 Phase 20으로 이관했다.

### Native Panel 기능 브랜치 Gate - Codex 2026-07-12

- [x] UE 5.8 preflight
  - Engine `5.8.0`, EngineAssociation `5.8`, EngineRoot `F:\UE_5.8`
- [x] 정규 Unity RPEditor Win64 Development
  - 새 Base/Native Panel 소스를 개별 컴파일하고 6 actions로 링크, `Result: Succeeded`
- [x] 정규 `-DisableUnity` RPEditor Win64 Development
  - 새 Base/Native Panel 소스를 개별 컴파일하고 7 actions로 링크, `Result: Succeeded`
- [x] `RP.Mission.Selection` Automation 3종
  - `ObjectiveVisibility`, `TerminalData`, `TerminalInput` 모두 `Result={Success}`
  - 보고서: `Saved/Automation/Phase15NativePanels/index.html`
- [x] `RPRunPhase11ClosureRegressionSmoke 0.5 1`
  - `Selected Mission: TutorialRecovery`, `Door Status: MissionCompleted`, `Mission Phase: Succeeded`
  - `Phase11ClosureRegression SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true`
  - 로그: `Saved/Logs/RP.log`
- [x] Native Panel C++/문서 범위 scoped `git diff --check`
- GPT Pro Web 정적 검수는 실행하지 않았다.
- 이 Gate는 Editor Blueprint의 WidgetComponent 연결이나 PIE Host/Client 시각 검증 완료를 의미하지 않는다.

---

## 14. v1.15 Terminal Camera / Separate Mission Status Display

- Host 선택 컴퓨터는 World WidgetComponent 대신 CameraComponent와 지연 Viewport UI를 사용한다.
- 공용 Mission Status는 별도 Blueprint Actor로 분리하고 기존 GameState 표시 스냅샷을 계속 읽는다.
- 기본 전환값은 Blend In 0.35초, UI 표시 0.40초, Blend Out 0.25초다.
- BlendingIn 구간의 닫기 요청과 BlendingOut 구간의 중복 닫기는 무시하고, 치명적 화면 생성 실패는 즉시 정리한다.
- 부팅 애니메이션, 사운드, Host 사용 애니메이션, `IN USE` 복제 표시는 Phase 20으로 이관한다.

### Terminal Camera / Separate Status 기능 브랜치 Gate - Codex 2026-07-12

- [x] UE 5.8 preflight
  - Engine `5.8.0`, EngineAssociation `5.8`, EngineRoot `F:\UE_5.8`
- [x] 정규 Unity RPEditor Win64 Development
  - `RPPlayerControllerMissionTerminal.cpp`를 포함한 4 actions가 컴파일·링크되고 `Result: Succeeded`로 끝났다.
- [x] 정규 `-DisableUnity` RPEditor Win64 Development
  - 최초 UBA 4병렬 실행은 시스템 메모리 압박으로 정체되어 해당 빌드 프로세스만 종료했다.
  - `-DisableUnity -MaxParallelActions=1 -NoUBA` 저메모리 재실행에서 Terminal/PlayerController 소스를 포함한 8 actions가 개별 컴파일·링크되고 `Result: Succeeded`로 끝났다.
- [x] `RP.Mission.Selection` Automation 3종
  - `ObjectiveVisibility`, `TerminalData`, `TerminalInput` 모두 `Result={Success}`
  - 보고서: `Saved/Automation/Phase15TerminalCamera/index.html`
- [x] `RPRunPhase11ClosureRegressionSmoke 0.5 1`
  - `Selected Mission: TutorialRecovery`, `Door Status: MissionCompleted`, `Mission Phase: Succeeded`
  - `Phase11ClosureRegression SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true`
  - 로그: `Saved/Logs/RP.log`
- [x] Terminal Camera C++/문서 범위 scoped `git diff --check`
- GPT Pro Web 정적 검수는 실행하지 않았다.
- 이 Gate는 별도 `BP_RPMissionStatusDisplay` 생성, Terminal Camera 구도 조정이나 PIE Host/Client 시각 검증 완료를 의미하지 않는다.

### ESC 인게임 메뉴 입력 충돌 패치 - Codex 2026-07-13

- 재현: Terminal 상호작용 직후 0.40초 BlendingIn 구간에서 Esc를 누르면 `WBP_RPInGameMenu`가 열리고, Resume 뒤 Terminal 지연 UI와 메뉴의 입력 모드/Focus가 충돌해 키보드 입력이 먹통처럼 보였다.
- 원인: `CaptureMissionTerminalInput()`이 화면 없는 전환 구간에 `FInputModeGameOnly`를 적용해 `BP_RPPlayerController`의 직접 Escape 입력 이벤트까지 허용했다. 메뉴 Resume는 다시 `SetInputMode_GameOnly`를 적용하므로 Terminal 화면의 UI Focus와 경쟁했다.
- 수정: BlendingIn과 BlendingOut에는 Focus 대상이 없는 `FInputModeUIOnly`를 적용해 gameplay Escape 입력을 차단한다. Terminal 화면이 Active가 되면 기존처럼 화면 Widget에 Focus를 지정하고, 복귀 완료 뒤에만 `FInputModeGameOnly`로 복원한다.
- 추가 재현: Esc와 E를 거의 동시에 누르되 Esc가 먼저 처리되면 인게임 메뉴가 입력을 소유한 뒤 Terminal Client RPC가 도착해 앞선 `UIOnly` 전환만으로는 두 모달 흐름이 다시 경쟁할 수 있었다.
- 상호 배제 보강: Terminal 표시 시작 직전에 기존 Cursor 또는 Move/Look 입력 잠금이 있으면 다른 로컬 모달 UI가 먼저 입력을 소유한 것으로 보고 Terminal 카메라/UI를 시작하지 않는다. 기존 서버 Terminal 세션만 닫아 인게임 메뉴와 Resume 상태는 그대로 보존한다.
- 순서 규칙: E가 먼저면 Terminal이 이기고 이후 Esc를 차단한다. Esc가 먼저면 인게임 메뉴가 이기고 뒤늦은 Terminal 표시를 취소한다.
- [x] UE 5.8 UHT와 변경 C++ 컴파일
  - 열린 Editor를 유지한 상태에서 `RPEditor Win64 Development -NoLink`로 Terminal/PlayerController 포함 4 actions 컴파일에 성공했다.
- [x] 정규 RPEditor DLL 링크
  - 첫 시도는 열린 `UnrealEditor.exe`가 `Binaries/Win64/UnrealEditor-RP.dll`을 점유해 `LNK1104`가 발생했다. 저장되지 않은 Editor 작업 보호를 위해 프로세스를 강제 종료하지 않았다.
  - Editor 정상 종료 뒤 Unity 3 link actions와 `-DisableUnity -MaxParallelActions=1 -NoUBA` 8 actions가 모두 `Result: Succeeded`로 끝났다.
- [x] `RP.Mission.Selection` Automation 3종
  - `ObjectiveVisibility`, `TerminalData`, `TerminalInput` 모두 `Result={Success}`
  - 보고서: `Saved/Automation/Phase15TerminalModalRace/index.html`
- [x] Phase 11 closure smoke
  - `Door Status: MissionCompleted`, `Mission Phase: Succeeded`, 최종 `Phase11ClosureRegression SUCCEEDED`
- [x] ESC 입력 충돌 패치 범위 scoped `git diff --check`
- [x] PIE 재검증 (사용자 확인 2026-07-13)
  - E 우선 + 거의 동시 Esc에서 인게임 메뉴가 열리지 않는지 확인
  - Esc 우선 + 거의 동시 E에서 인게임 메뉴만 유지되고 Resume 뒤 입력/재상호작용이 정상인지 확인
  - Terminal Active 상태의 Q/Esc는 정상적으로 Terminal만 닫는지 확인
  - 복귀 완료 뒤 일반 Esc 인게임 메뉴와 Resume 키보드 입력이 정상인지 확인

### RPForceCompleteMission 기능 Gate - Codex 2026-07-13

- [x] 정규 Unity RPEditor Win64 Development
  - `RPDebugCheatManager.cpp`, `RPMissionDirector.cpp`를 포함한 8 actions가 컴파일·링크되고 `Result: Succeeded`로 끝났다.
- [x] 정규 `-DisableUnity` RPEditor Win64 Development
  - `-MaxParallelActions=1 -NoUBA`에서 관련 소스를 포함한 10 actions가 개별 컴파일·링크되고 `Result: Succeeded`로 끝났다.
- [x] `L_BureauRoom_Dev` headless 실제 명령 검증
  - 퇴역 전 검증 명령: `EnableCheats,RPStartMission,RPForceCompleteMission,RPPrintMissionState,Quit`
  - 이 결과는 `RPForceCompleteMission` 구현 증거로 보존하지만, 현재 수동 검증은 Terminal 선택 후 `RPSessionStartMission -> RPForceCompleteMission`을 사용한다.
  - `Mission Phase: Succeeded`, `Tutorial Step: ReturnToBureau`, `Extracted Value: 1 / 1`, `Mission Succeeded: true`, `Door Status: MissionCompleted`
- [x] `RP.Mission.Selection` Automation 3종 `Result={Success}`
  - 보고서: `Saved/Automation/Phase15ForceCompleteMission/index.html`
- [x] Phase 11 closure smoke 최종 `SUCCEEDED`
- [x] 강제 완료 C++/문서 범위 scoped `git diff --check`
- [x] PIE 1 Player / 2 Players에서 Native Mission Status와 Door Status의 실제 완료 문구를 시각 확인했다. (사용자 확인 2026-07-13)

### Debug 명령 정리 Gate - Codex 2026-07-13

- [x] `RPMidTest`, `RPStartMission`, `RPStartTutorialMission`, `StartTutorialMission_ServerOnly`의 `Source/RP` 참조가 남지 않았다.
- [x] UE 5.8 preflight 통과.
- [x] 정규 RPEditor Development가 `Target is up to date` / `Result: Succeeded`로 끝났다.
- [x] `-DisableUnity -MaxParallelActions=1`에서 `RPDebugCheatManager.cpp`, `RPMissionDirector.cpp`를 포함한 개별 C++ 컴파일이 성공했다.
- [x] Editor 종료 후 최종 `-DisableUnity` RPEditor Development 링크를 재확인했다. (2026-07-13 Done Audit, `Result: Succeeded`)
- [x] `RPRunPhase11ClosureRegressionSmoke 0.5 1` 최종 `SUCCEEDED. Phase09=true Ready=true EffectsApplied=true EffectsCleared=true`.
- [x] 현재 명령 목록을 `AGENTS.md`에서 제품 경로 / 저수준 진단 / 세션 / 상태 조작 / 성능·효과 / headless 회귀로 재분류했다.
- [x] `RPDebugCheatManager.h`의 현재 Exec 27개를 `Debug_Command_Reference.md`와 대조해 27개 모두 문서화했다.
- [x] AGENTS / CODEX_INDEX / MkDocs / Phase 15 체크리스트·Work Report 링크 경로가 실제 파일을 가리킨다.
- [x] 명령 정리 범위 scoped `git diff --check` 통과.
- 참고: 로컬 Python에 MkDocs 모듈이 없어 사이트 build는 실행하지 못했으며, nav 항목과 Markdown 상대 경로는 정적으로 확인했다.

---

## 15. Phase Done Audit - Codex / 사용자 2026-07-13

- [x] UE 5.8 Unity RPEditor Win64 Development: `Result: Succeeded`
- [x] UE 5.8 `-DisableUnity` RPEditor Win64 Development: 12 actions 컴파일/링크, `Result: Succeeded`
- [x] `RP.Mission.Selection` Automation 3/3 성공
  - 보고서: `Saved/Automation/Phase15DoneAudit/index.json`
  - 로그: `Saved/Logs/Codex_Phase15_DoneAudit_Automation.log`
- [x] Phase 11 closure regression smoke 성공
  - `Door Status: MissionCompleted`, `Mission Phase: Succeeded`, `Phase11ClosureRegression SUCCEEDED`
  - 로그: `Saved/Logs/Codex_Phase15_DoneAudit_RegressionSmoke.log`
- [x] Phase 15 변경 범위 `git diff --check` 성공
- [x] Windows Development 패키징 성공
  - `Saved/Logs/RP.log`: `BUILD SUCCESSFUL`, `Result Succeeded`, `ExitCode=0`
  - 출력: `E:/Workspace/GameBulids/RP/Windows`
- [x] 패키지 실행에서 Steam CreateRoom/listen, Mission Terminal 선택/닫기, Native 텍스트 투명 배경 확인
- [x] F-01/F-02, PIE 1 Player, PIE 2 Players / Listen Server, Phase 13/14 회귀 사용자 확인
- [x] hardening 정면 상호작용/거절과 2 Player Portal 검증 사용자 확인
- [x] 실제 Entry/Open Gate/Portal 이동 실패 rollback은 Phase 15 N/A로 판정하고 Phase 17 이후 구현 Gate로 이관

최종 판정: Phase 15 Done. GPT Pro Web 정적 검수는 미요청 선택 항목이며 완료 차단 조건이 아니다. 원격 push와 main 병합은 별도 사용자 승인 전까지 수행하지 않는다.
