---
title: "UI Foundation and Input API Contract"
description: "UI Foundation and Input API Contract의 공개 계약, 완료 신호, 수명주기와 실패 경계를 설명합니다."
section: "api"
sourcePath: "reference/ui/UI_Foundation_Input_API.md"
status: "Current"
documentType: "API Contract"
lastReviewed: "2026-07-20"
searchKeywords:
  - "ARPPlayerController"
  - "OpenInGameMenuLocal"
  - "CloseInGameMenuLocal"
  - "URPFrontendScreenBase"
  - "URPUIInputSubsystem"
  - "URPMissionTerminalScreenBase"
  - "IA_UI_Back"
  - "IA_OpenInGameMenu"
  - "IA_SpectateCycle"
  - "IMC_Player"
  - "WASD"
  - "CommonUI"
  - "ESC"
  - "Back"
  - "Focus"
  - "LateJoinObserver"
  - "LMB"
  - "RMB"
order: 22
---
- **Status:** Current
- **Document Type:** API Contract
- **Domain:** UI / Foundation and Input
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer
- **Canonical Symbols:**
  - `ARPPlayerController`
  - `URPFrontendScreenBase`
  - `URPUIInputSubsystem`
  - `URPMissionTerminalScreenBase`
- **Source Files:**
  - `Source/RP/Player/RPPlayerController.h`
  - `Source/RP/UI/Foundation/RPFrontendScreenBase.h`
  - `Source/RP/UI/Foundation/RPUIInputSubsystem.h`
  - `Source/RP/UI/InGame/Mission/RPMissionTerminalScreenBase.h`
- **Last Contract Review:** 2026-07-20
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** ARPPlayerController, OpenInGameMenuLocal, CloseInGameMenuLocal, URPFrontendScreenBase, URPUIInputSubsystem, URPMissionTerminalScreenBase, IA_UI_Back, IA_OpenInGameMenu, IA_SpectateCycle, IMC_Player, WASD, CommonUI, ESC, Back, Focus, LateJoinObserver, LMB, RMB

## Boundary

이 계약은 화면 활성화/Back/초기 Focus, 인게임 메뉴의 로컬 수명주기, CommonUI Menu 모드의 WASD 탐색을 소유한다. 메뉴의 시각 배치와 애니메이션은 WBP가 담당하고, 세션·Ready·미션 상태 판단은 이 계층이 소유하지 않는다.

## Public Contract

### ARPPlayerController In-Game Menu

| API / Detail | 역할 |
|---|---|
| `OpenInGameMenuLocal` | `InGameMenuScreenClass`를 생성·Player Screen에 추가·활성화하고 초기 Focus 적용 |
| `CloseInGameMenuLocal` | 화면 비활성/제거 뒤 gameplay input config 복구 |
| `IsInGameMenuOpen` | viewport와 CommonUI activation을 함께 확인 |
| `OpenInGameMenuAction` | `IA_OpenInGameMenu` 지정; Started로 메뉴 open 요청 |
| `InGameMenuScreenClass` | `WBP_RPInGameMenu` 파생 화면 지정 |
| `InGameMenuZOrder` | Player Screen 표시 순서, 기본 200 |
| `SpectateCycleAction` | `IA_SpectateCycle` Axis1D 지정; LateJoinObserver일 때 LMB/RMB 다음·이전 Active Pawn 요청 |

PlayerController는 화면 instance, Back delegate, CommonUI activation과 gameplay 입력 복구를 한 곳에서 소유한다. BP가 같은 수명주기를 다시 만들지 않는다.

### URPFrontendScreenBase

`UCommonActivatableWidget` 기반 공통 화면 부모다. Native 기본값으로 Back Handler를 사용하며 원하는 input config는 `Menu + NoCapture + IgnoreMove/Look`이다. 단, Activatable Stack에 들어가지 않는 월드 표시 패널과 PlayerController가 `AddToPlayerScreen`으로 직접 수명주기를 관리하는 `URPMissionTerminalScreenBase`는 Back Handler를 끈다.

| API / Event | 역할 |
|---|---|
| `OnBackRequested` | 화면이 Back을 처리해 부모/소유자에게 닫기 요청 전달 |
| `RequestBack` | BP Back 버튼과 Native Back을 같은 경로로 통합 |
| `SetInitialFocusWidgetName` | 활성화 시 Focus 대상 이름 설정 |
| `GetInitialFocusWidget` | 이름, optional binding과 CommonUI 규칙으로 대상 해석 |
| `FocusInitialWidget` | 활성화/애니메이션 후 Focus 재적용 |
| `On RP Back Requested` | Blueprint 시각/하위화면 전환 hook |

Optional binding과 Details:

```text
InitialFocusWidget
InitialFocusWidgetName
bFocusInitialWidgetOnActivated
bFocusInitialWidgetOnConstruct
```

### URPUIInputSubsystem

LocalPlayer별 Slate navigation config를 설치한다. CommonUI가 `Menu` 모드일 때만 W/A/S/D를 방향 이동으로 변환한다.

```text
IMC_Player (항상 활성)
├─ IA_OpenInGameMenu = Escape
├─ IA_UI_Back = Escape
└─ IA_SpectateCycle (Axis1D)
   ├─ LMB = +1
   └─ RMB = -1

BP_RPCommonUIInputData.EnhancedInputBackAction = IA_UI_Back
IMC_UI 교체 없음
```

`ResolveMenuNavigationDirection`은 메뉴 모드, Editable Text Focus, command modifier 여부를 받아 탐색 방향을 판정하는 정적 정책 함수다.

## Inputs And Completion

| 입력 | 완료/관찰 지점 |
|---|---|
| `IA_OpenInGameMenu` Started | `OpenInGameMenuLocal` 반환값과 `IsInGameMenuOpen` |
| CommonUI `IA_UI_Back` | 가장 안쪽 활성 화면의 `RequestBack`; 최상위면 `CloseInGameMenuLocal` |
| W/A/S/D | Slate Focus 경로 변경; 별도 gameplay 상태 변경 없음 |
| `IA_SpectateCycle` Started | Observer만 `ServerViewNextPlayer/ServerViewPrevPlayer`; GameMode가 Active + Pawn 대상을 재검증 |
| Resume/최상위 Back | 화면 제거 뒤 CommonUI gameplay input config 복구 |

`OpenInGameMenuLocal`의 bool은 로컬 open을 실제 시작/유지했는지 나타낸다. 세션이나 gameplay action의 완료 신호가 아니다.

## Lifecycle

1. Local Player 생성 시 `URPUIInputSubsystem`이 해당 Slate user의 기존 config를 보존하고 RP navigation config를 설치한다.
2. `IA_OpenInGameMenu`가 PlayerController의 Native open 경로를 호출한다.
3. 화면 activation이 Menu input config와 초기 Focus를 적용한다.
4. CommonUI Back은 가장 안쪽 활성 화면부터 처리한다.
5. 최상위 메뉴 종료 시 PlayerController가 Game input config와 mouse capture를 복구한다.
6. Local Player 종료 시 이전 navigation config를 복원한다.

## Invariants And Warnings

- Editable Text 계열에 Focus가 있거나 Ctrl/Alt/Cmd가 눌리면 WASD 문자를 소비하지 않는다.
- Mission Terminal처럼 다른 로컬 modal UI가 입력을 소유하면 인게임 메뉴를 열지 않는다.
- 하위 Room Settings가 활성일 때 Back은 하위화면부터 닫혀야 한다.
- WidgetComponent 표시 위젯이나 `AddToPlayerScreen`으로 직접 표시하는 터미널처럼 Activatable Stack 밖에 있는 화면은 CommonUI Back Handler로 등록하지 않는다. 부모 Activatable Widget 없이 전역 Back을 등록하면 첫 PIE 또는 Action Router 갱신 시 CommonUI ensure가 발생한다.
- `IA_UI_Back`과 `IA_OpenInGameMenu`가 같은 Escape를 사용해도 닫힌 같은 프레임의 재오픈을 차단한다.
- LateJoinObserver 입력 제한은 gameplay participation 정책이다. 메뉴 종료는 UI가 추가한 입력 잠금만 해제한다.
- LMB/RMB 관전 순환은 자유시점이나 gameplay click이 아니다. Observer 상태에서만 작동하고 메뉴·Terminal·마우스 커서 UI가 입력을 소유하면 무시한다.
- raw Escape event, WBP별 `Set Input Mode`, cursor 복구, `IMC_UI` 추가/제거를 중복 구현하지 않는다.

## Contract Links

- **UI Consumer:** [UI Session Widgets API Contract](UI_Session_Widgets_API.md)
- **Delegates To:** [In-Game Menu Navigation](../flows/InGame_Menu_Navigation.md)
- **State Owner:** [Late Join Observer](../flows/Late_Join_Observer.md)

## Deprecated / Migration Notes

- `On RP In Game Menu Open Requested`는 기존 BP 컴파일 이관용 deprecated event다. 새 그래프는 `OpenInGameMenuLocal`을 사용하고 Create Widget/Input Mode/`IMC_UI` 수명주기 그래프를 제거한다.
- 기존 WBP의 raw Escape 처리는 CommonUI Back으로 이관한다.
