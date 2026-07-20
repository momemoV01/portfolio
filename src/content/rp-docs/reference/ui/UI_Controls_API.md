---
title: "UI Controls API Contract"
description: "UI Controls API Contract의 공개 계약, 완료 신호, 수명주기와 실패 경계를 설명합니다."
section: "api"
sourcePath: "reference/ui/UI_Controls_API.md"
status: "Current"
documentType: "API Contract"
lastReviewed: "2026-07-19"
searchKeywords:
  - "URPButtonBase"
  - "ButtonRootSizeBox"
  - "URPOptionControlBase"
  - "OptionRootSizeBox"
  - "OptionValueSizeBox"
  - "Selector"
  - "Slider"
  - "TextInput"
  - "Toggle"
  - "Dropdown"
  - "URPUIThemeData"
  - "Focus"
  - "Theme"
  - "옵션 UI"
  - "버튼 크기"
order: 23
---
- **Status:** Current
- **Document Type:** API Contract
- **Domain:** UI / Reusable Controls and Theme
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer
- **Canonical Symbols:**
  - `URPInteractableWidgetBase`
  - `URPButtonBase`
  - `URPOptionControlBase`
  - `URPOptionSelectorBase`
  - `URPOptionSliderBase`
  - `URPOptionTextInputBase`
  - `URPOptionToggleBase`
  - `URPOptionDropdownBase`
  - `FRPDropdownOption`
  - `FRPOptionControlConfig`
  - `FRPOptionSelectorItem`
  - `FRPOptionSelectorConfig`
  - `FRPOptionTextInputConfig`
  - `FRPOptionSliderVisualLayout`
  - `FRPOptionSliderConfig`
  - `FRPUITextStyle`
  - `FRPUIButtonStyle`
  - `FRPUIOptionStyle`
  - `URPUIThemeData`
- **Source Files:**
  - `Source/RP/UI/Foundation/RPInteractableWidgetBase.h`
  - `Source/RP/UI/Foundation/RPButtonBase.h`
  - `Source/RP/UI/Options/RPOptionControlBase.h`
  - `Source/RP/UI/Options/RPOptionSelectorBase.h`
  - `Source/RP/UI/Options/RPOptionSliderBase.h`
  - `Source/RP/UI/Options/RPOptionTextInputBase.h`
  - `Source/RP/UI/Options/RPOptionToggleBase.h`
  - `Source/RP/UI/Options/RPOptionDropdownBase.h`
  - `Source/RP/UI/Options/RPOptionTypes.h`
  - `Source/RP/UI/Theme/RPUIThemeData.h`
- **Last Contract Review:** 2026-07-19
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** URPButtonBase, ButtonRootSizeBox, URPOptionControlBase, OptionRootSizeBox, OptionValueSizeBox, Selector, Slider, TextInput, Toggle, Dropdown, URPUIThemeData, Focus, Theme, 옵션 UI, 버튼 크기

## Boundary

이 계약은 반복 사용하는 버튼/옵션 행의 Focus, 입력 이벤트, 표시 데이터, optional layout binding과 Theme 적용을 소유한다. Control은 UI 값과 요청 event만 내보내며 세션, 설정 저장, Ready나 gameplay 상태를 직접 확정하지 않는다.

## Public Contract

### URPInteractableWidgetBase

`UCommonButtonBase` 기반 공통 상호작용 부모다. Hover는 강조 상태 자체가 아니라 Focus 이동 트리거이며 실제 강조는 Focus/Enabled를 기준으로 한다.

| API | 역할 |
|---|---|
| `SetFocusOnHover` / `ShouldFocusOnHover` | Hover 시 Focus 이동 정책 |
| `IsInteractionHighlighted` | 현재 Focus 기반 강조 판정 |
| `HasInteractionHover` / `HasInteractionFocus` | raw 상호작용 상태 조회 |
| `SetUseThemeStyle` | Theme 적용 여부 |
| `SetThemeStyle` / `ApplyThemeStyle` | Theme DataAsset과 StyleId 적용 |

### URPButtonBase

MenuButton, ActionButton, BackButton 계열의 공통 부모다.

Events:

```text
OnRPButtonClicked
OnRPButtonFocused / OnRPButtonUnfocused
OnRPButtonHovered / OnRPButtonUnhovered
OnRPButtonInteractionStateChanged
```

| API | 역할 |
|---|---|
| `SetUseFocusVisualColor` / `SetFocusVisualColors` | Focus Border 색상 정책 |
| `SetButtonRootWidthOverride` / `ClearButtonRootWidthOverride` | 버튼 전체 Root 폭 설정/해제 |
| `SetButtonRootHeightOverride` / `ClearButtonRootHeightOverride` | 버튼 전체 Root 높이 설정/해제 |
| `SynchronizeButtonWidgets` | Root layout과 Focus 시각 재적용 |

Optional bindings:

```text
ButtonRootSizeBox
Border
LabelTextBlock
```

`ButtonRootSizeBox`가 없거나 override가 꺼져 있으면 기존 BP layout을 유지한다. 부모 슬롯이 폭을 채우는 버튼은 Width를 끄고 Height만 고정하는 구성이 안전하다.

### URPOptionControlBase

Selector, Slider, TextInput, Toggle, Dropdown이 공유하는 옵션 행 부모다.

| API | 역할 |
|---|---|
| `ApplyControlConfig` | label, Focus, read-only, Root/Value layout 일괄 적용 |
| `SetLabelText` / `GetLabelText` | 옵션 라벨 |
| `SetIsReadOnly` / `IsReadOnly` / `CanChangeValue` | 값 변경 잠금 |
| `SetUseFocusVisualColors` / `SetFocusVisualColors` | Left/Right Border 상태 색상 |
| `HandleOptionNavigateLeft` / `HandleOptionNavigateRight` / `HandleOptionConfirm` | 키보드/패드/버튼 공통 입력 |
| `SetOptionRootWidthOverride` / `SetOptionRootHeightOverride` | 옵션 행 전체 Root 크기 |
| `SetOptionValueWidthOverride` / `SetOptionValueHeightOverride` | 오른쪽 값 영역 크기 |
| `GetBoundOptionValueWidth` | Slider 시각 계산용 실제 값 영역 폭 |
| `SynchronizeOptionControlWidgets` | binding에 설정 재적용 |

Optional bindings:

```text
OptionRootSizeBox
Border
LeftBorder
RightBorder
OptionNameText
OptionValueSizeBox
```

`OptionRootSizeBox`는 전체 행, `OptionValueSizeBox`는 오른쪽 값 영역에만 적용된다.

### Selector, Slider, TextInput

| 타입 | 주요 API와 완료 이벤트 |
|---|---|
| `URPOptionSelectorBase` | `ApplySelectorConfig`, `SetOptions`, `SetSelectedIndex/Id`, `GetSelectedId`, `OnOptionSelectorSelectionChanged`, `OnOptionSelectorConfirmed` |
| `URPOptionSliderBase` | `ApplySliderConfig`, `SetRange`, `SetValue`, visual range/layout API, `OnOptionSliderValueChanged` |
| `URPOptionTextInputBase` | `ApplyTextInputConfig`, `SetText`, `GetSanitizedText/String`, `FocusTextInput`, changed/committed events |

Selector는 `OptionId`를 안정적인 의미 값으로 사용하고 `DisplayText`는 현지화 가능한 표현으로 사용한다. `SetSelectedIndex/Id`는 `bBroadcast=false`여도 `On RP Selector Selection Changed` BP 이벤트로 표시를 즉시 동기화하고, 이때 외부 `OnOptionSelectorSelectionChanged` multicast만 억제한다. 따라서 BP 이벤트는 값 텍스트/rotator 같은 표현만 갱신하고, 세션·저장 요청은 multicast에 연결한다. Slider의 logical range와 visual range는 분리할 수 있다. Room Name처럼 실제 요청에 사용할 문자열은 `GetText`보다 `GetSanitizedString`을 사용한다.

### Toggle And Dropdown

| 타입 | 주요 계약 |
|---|---|
| `URPOptionToggleBase` | `SetIsOn`, `SetCanToggle`, `CanToggle`; 값 변경과 toggle 가능 상태 event |
| `URPOptionDropdownBase` | `FRPDropdownOption` 배열, selected index/id, open/close/toggle; selection/open event |

두 Control 모두 표현 값을 부모 메뉴에 전달할 뿐 실제 설정 저장이나 서버 요청을 수행하지 않는다. 미션 중 참가 설정의 현재 제품 WBP는 Toggle 대신 `URPOptionSelectorBase`의 `OFF`/`ON` OptionId를 사용한다.

### Config And Theme

| 타입 | 역할 |
|---|---|
| `FRPOptionControlConfig` | 공통 label, Focus, read-only, Root/Value layout |
| `FRPOptionSelectorItem` / `FRPOptionSelectorConfig` | option id/display/enabled와 기본 선택 |
| `FRPOptionTextInputConfig` | placeholder, fallback, 길이/공백/commit 입력 정책 |
| `FRPOptionSliderConfig` / `FRPOptionSliderVisualLayout` | logical/visual range와 BP 시각 동기화 결과 |
| `FRPUITextStyle` | font/color 적용 |
| `FRPUIButtonStyle` | button brush/color/text state |
| `FRPUIOptionStyle` | option root/left/right brush, color, label/text input style |
| `URPUIThemeData` | `ButtonStyles`, `OptionStyles`, `FindButtonStyle`, `FindOptionStyle` |

Theme는 시각 튜닝 데이터다. 입력, 세션이나 gameplay 상태를 소유하지 않는다.

## Inputs And Completion

| 입력 | 완료 신호 |
|---|---|
| 공통 click/confirm/navigation | 각 Control의 `OnRP...` multicast와 BP implementable event |
| Config 적용 | 즉시 widget sync 후 Config Applied BP event가 있는 파생 Control에서 전달 |
| read-only 변경 | `OnRPOptionReadOnlyChanged` |
| Selector 값 설정/복원 | BP 표시 이벤트는 항상 동기화; `bBroadcast=true`일 때만 외부 changed multicast |
| Slider/Toggle/Dropdown 값 변경 | 타입별 changed event |
| TextInput 입력 | changed 또는 committed event; 실제 사용 값은 sanitized getter로 읽음 |

Control event는 사용자 입력/표시 값의 완료일 뿐 외부 세션·저장·provider 작업의 완료가 아니다.

## Lifecycle

1. PreConstruct/Construct에서 default config와 optional binding을 동기화한다.
2. Hover는 Focus를 이동하고 Focus/Enabled가 공통 시각 상태를 결정한다.
3. Control은 입력을 값 변경과 typed event로 변환한다.
4. 부모 메뉴가 값을 읽어 도메인 API를 요청한다.
5. 외부 요청의 Pending/성공/실패는 부모/도메인 완료 event가 다시 Control의 read-only/값을 갱신한다.

## Invariants And Warnings

- 기본 `OnClicked`와 `OnRPButtonClicked`를 같은 동작에 동시에 연결하지 않는다.
- Theme style과 BP의 매 프레임 수동 색상 갱신을 섞지 않는다.
- Width/Height override는 해당 optional SizeBox가 있을 때만 의미가 있다.
- UI label에는 `FText`, 논리 identity에는 `FName OptionId`를 사용한다.
- Selector의 BP Selection Changed 이벤트에서 외부 설정을 요청하지 않는다. 무방송 상태 복원도 이 이벤트를 사용해 외형만 다시 그린다.
- Dropdown/Toggle/Selector가 직접 SessionSubsystem이나 gameplay state를 변경하지 않는다.
- TextInput의 IME 조합 중간값을 sanitize해 덮어쓰지 않고 commit 경계를 사용한다.

## Contract Links

- **UI Consumer:** [UI Session Widgets API Contract](UI_Session_Widgets_API.md)
- **Delegates To:** [UI Foundation and Input API Contract](UI_Foundation_Input_API.md)
- **Input Type:** [Online Types API Contract](../Online_Types_Reference.md)

## Deprecated / Migration Notes

- `URPOptionControlBase.SetRowWidthOverride/ClearRowWidthOverride`는 `SetOptionValueWidthOverride/ClearOptionValueWidthOverride`로 이관한다.
- `SetRowHeightOverride/ClearRowHeightOverride`도 Value 영역 API로 이관한다. 새 Root 크기는 `SetOptionRootWidthOverride/HeightOverride`를 사용한다.
- `URPOptionSliderBase.SetSliderTrackWidthOverride/ClearSliderTrackWidthOverride`는 공통 `OptionValueSizeBox` API로 이관한다.
