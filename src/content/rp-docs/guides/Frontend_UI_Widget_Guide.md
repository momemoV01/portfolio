---
title: "Frontend UI Widget Guide"
description: "Frontend UI Widget Guide의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Frontend_UI_Widget_Guide.md"
status: "Current"
documentType: "Guide"
searchKeywords:
  - "Frontend UI"
  - "WBP_RPMenuButton"
  - "WBP_RPActionButton"
  - "WBP_RPOptionSelector"
  - "WBP_RPSlider"
  - "WBP_RPOptionTextInput"
  - "ButtonRootSizeBox"
  - "OptionRootSizeBox"
  - "HostMenu"
  - "Focus"
  - "Hover"
  - "Theme"
  - "방 생성"
order: 43
---
Status: Current
Applies To:
- RP_Live UE 5.8
- 현재 구현된 `Source/RP/UI` 기준
Last Verified:
- 2026-07-18

Search Keywords: Frontend UI, WBP_RPMenuButton, WBP_RPActionButton, WBP_RPOptionSelector, WBP_RPSlider, WBP_RPOptionTextInput, ButtonRootSizeBox, OptionRootSizeBox, HostMenu, Focus, Hover, Theme, 방 생성

## Source Of Truth

짧은 함수/변수 설명은 C++ `ToolTip` metadata가 원본이다.
이 문서는 Blueprint 연결 순서와 위젯 분류 기준을 설명한다.

상세 Editor 검증 절차는 `../checklists/Phase_13_Editor_Verification_Checklist.md`를 따른다.

## Widget Families

| Role | Recommended Widget | Native Parent | Notes |
|---|---|---|---|
| Menu navigation | `WBP_RPMenuButton` | `URPButtonBase` | 화면/패널 이동. 세션 함수 직접 호출 금지 |
| Immediate command | `WBP_RPActionButton` | `URPButtonBase` | Create / Refresh / Join / Leave 같은 명령 버튼 |
| Status text | `WBP_RPStatusMessage` | UMG text wrapper | `OnSessionActionMessage` 표시 전용 |
| Option row | `WBP_RPOptionSelector`, `WBP_RPSlider`, `WBP_RPOptionTextInput` | `URPOptionControlBase` 계열 | 라벨 + 값 입력을 같은 행 규격으로 유지 |
| Room list item | `WBP_RPRoomListItem` | UMG list item | 선택/Join 요청 인덱스만 부모 메뉴에 전달 |
| Frontend screen | Host / Join / menu screen | `URPFrontendScreenBase` | 초기 Focus와 Back 요청 경계 |

## Button Rules

`URPButtonBase`의 클릭 이벤트는 `OnRPButtonClicked` 또는 BP 이벤트 `On RPButton Clicked`를 사용한다.

기본 `OnClicked`와 중복 연결하지 않는다. 같은 버튼에서 두 경로를 동시에 쓰면 요청이 두 번 실행될 수 있다.

버튼 BP 권장 바인딩 이름:

```text
ButtonRootSizeBox
Border
LabelTextBlock
```

`ButtonRootSizeBox`는 버튼 전체 Width/Height를 조절하는 optional Root SizeBox다.
`Border`가 있으면 Focus 상태에 따른 색상 또는 Theme Brush를 적용할 수 있다.
`LabelTextBlock`이 있으면 Theme의 버튼 텍스트 스타일을 적용할 수 있다.

권장 계층:

```text
ButtonRootSizeBox (Size Box)
└─ Border
   └─ LabelTextBlock
```

버튼 WBP Details의 `Button Layout`에서 Width/Height override를 각각 opt-in으로 설정한다. 부모가 HorizontalBox/VerticalBox 슬롯의 Fill을 담당하면 Root Width Override는 끄고, 공용 버튼 높이만 맞출 때는 Root Height Override만 사용한다.

버튼 자체는 `CreateRoom`, `FindRooms`, `JoinRoomByIndex`, `LeaveRoom`을 호출하지 않는다.
버튼은 클릭 이벤트만 부모 메뉴로 전달하고, 부모 메뉴가 session 요청을 호출한다.

## Option Control Rules

옵션 계열 위젯은 `FRPOptionControlConfig`를 공통으로 사용한다.

공통 설정:

```text
LabelText
bFocusOnHover
bReadOnly
bUseFocusVisualColors
bUseOptionRootWidthOverride / OptionRootWidthOverride
bUseOptionRootHeightOverride / OptionRootHeightOverride
OptionValueWidthOverride
OptionValueHeightOverride
```

옵션 BP 권장 바인딩 이름:

```text
OptionRootSizeBox
Border
LeftBorder
RightBorder
OptionNameText
OptionValueSizeBox
```

`OptionRootSizeBox`는 옵션 행 전체 Width/Height를 조절하는 optional Root SizeBox다.
`OptionValueSizeBox`는 Slider / Selector / Toggle / TextInput의 오른쪽 값 영역 크기를 맞추는 공통 기준이다.
두 SizeBox는 서로 다른 영역을 담당하므로 같은 값으로 묶지 않는다.
새 옵션 위젯에서 슬라이더 전용 이름을 재사용하지 않는다.

권장 계층:

```text
OptionRootSizeBox (Size Box)
└─ Border
   └─ MainHorizontalBox
      ├─ LeftBorder
      │  └─ OptionNameText
      └─ RightBorder
         └─ OptionValueSizeBox
            └─ Selector / Slider / Toggle / TextInput 표현 위젯
```

대부분의 전체 폭 메뉴에서는 Root Width Override를 끄고 부모의 Fill을 사용한다. 행 높이만 통일할 때는 `bUseOptionRootHeightOverride=true`와 원하는 높이(예: 72)를 지정한다. 오른쪽 선택 영역 폭은 별도로 `OptionValueWidthOverride`를 사용한다.

## Selector Rules

`URPOptionSelectorBase`는 좌우 선택형 옵션에 사용한다.

Phase 13 HostMenu 권장 사용:

```text
Public Room:
- Options: Public
- Default Option Id: Public
- 필요 시 bReadOnly=true

Bureau Room Style:
- Options: Default
- Default Option Id: Default
```

BP 표시 연결:

```text
GetOptionCount -> 전체 pip 개수
GetDefaultOptionIndex -> DefaultOption 표시
GetSelectedIndex -> SelectedOption 표시
GetSelectedDisplayText -> 현재 표시 텍스트
HandleOptionNavigateLeft / Right -> 좌우 화살표 버튼
HandleOptionConfirm -> 가운데 값 클릭 또는 Confirm 입력
```

`DisplayText`는 `FText`로 입력한다. `OptionId`는 내부 분기와 저장용 안정 ID로 유지한다.

## Slider Rules

`URPOptionSliderBase`는 Max Players, Volume, Sensitivity처럼 숫자 값을 다루는 공용 위젯이다.

Phase 13 HostMenu의 Max Players 권장 설정:

```text
MinValue: 1
MaxValue: 6
StepValue: 1
Value: 4
bUseCustomVisualRange: true
VisualMinValue: 0
VisualMaxValue: 6
```

부모 메뉴가 여러 Setter를 반복 호출하기보다 `DefaultSliderConfig`를 Details 패널에서 인스턴스별로 조정한다.
런타임에 바꿔야 할 때만 `ApplySliderConfig`를 한 번 호출한다.

BP 시각 동기화는 `CalculateBoundVisualLayout()` 결과를 우선 사용한다.

## Text Input Rules

Room Name / Room Display Name은 `URPOptionTextInputBase` 계열 위젯을 사용한다.

권장 Config:

```text
PlaceholderText: Room Name
EmptyFallbackText: RP Room
MaxLength: 32
bTrimWhitespace: true
bReplaceLineBreaksWithSpaces: true
bReturnFocusToOptionOnCommit: true
```

HostMenu에서 방을 만들 때는 `GetText()`가 아니라 `GetSanitizedString()` 결과를 `FRPCreateRoomOptions.RoomDisplayName`에 넣는다.

`TextInputBox` 입력 중에도 부모 옵션 행이 Focus 강조를 유지해야 한다.
Enter 커밋 후 위/아래 메뉴 이동을 이어가야 한다면 옵션 행으로 Focus를 돌린다.

## Focus And Hover

현재 규칙은 Focus 기준이다.

```text
Hover:
- Focus 이동 트리거
- 색상 강조 기준이 아님

Focus:
- 버튼/옵션의 시각 강조 기준
- 마우스, 키보드, 게임패드 선택 상태를 같은 경로로 맞춤

Unhover:
- Focus를 지우지 않음
- 다른 버튼/옵션이 Focus를 받을 때까지 기존 강조 유지
```

BP에서 `OnUnhovered`에 `ClearFocus`를 연결하지 않는다.
Hover 전용 색상 그래프를 만들지 않고, Focus 색상 또는 Theme Highlighted 스타일을 사용한다.

## CommonUI Input And WASD

Frontend와 인게임 메뉴는 `URPFrontendScreenBase`의 CommonUI Menu input config를 사용한다. 메뉴마다 Mapping Context를 교체하지 않는다.

```text
IMC_Player (항상 활성)
├─ IA_OpenInGameMenu = Escape
└─ IA_UI_Back = Escape

BP_RPCommonUIInputData.EnhancedInputBackAction = IA_UI_Back
```

`IA_OpenInGameMenu`는 gameplay에서 `ARPPlayerController.OpenInGameMenuLocal`만 연다. 활성 메뉴의 닫기는 CommonUI가 최상위 Back Handler부터 처리한다. Room Settings가 열려 있으면 첫 Escape는 Room Settings, 다음 Escape는 인게임 메뉴를 닫는다.

WASD 방향 이동은 `URPUIInputSubsystem`의 LocalPlayer별 Slate navigation config가 담당한다. CommonUI `Menu` 모드에서만 켜지므로 gameplay W/A/S/D에는 영향을 주지 않는다. `TextInputBox` 또는 내부 Editable Text에 Focus가 있으면 W/A/S/D를 navigation으로 소비하지 않는다.

BP에서 제거할 항목:

```text
IMC_UI Add/Remove
Create Widget / Add To Viewport / Remove From Parent 메뉴 수명주기
Set Input Mode / Set Ignore Move Input / Set Ignore Look Input
On RP In Game Menu Open Requested 연결
```

Resume 버튼은 `CloseInGameMenuLocal`만 호출한다. `IMC_UI` 에셋 삭제는 모든 참조를 제거하고 PIE 검증한 뒤 Unreal Editor에서 수행한다.

## Theme Rules

중앙 스타일은 `URPUIThemeData`로 관리한다.

권장 StyleId 예:

```text
MenuButton
ActionButton
BackButton
HostMenuOption
SettingsOption
```

버튼은 ButtonStyle의 Border Brush / Border Color / TextStyle을 사용한다.
옵션 행은 OptionStyle의 Root / Left / Right Border Brush와 Label / TextInput 색상 스타일을 사용한다.

Theme를 아직 쓰지 않는 BP는 기존 Details 설정을 fallback으로 유지한다.

## HostMenu Create Room Flow

HostMenu 연결 순서:

```text
Room Name Text Input -> GetSanitizedString
Public Room Selector -> Phase 13에서는 Public 고정 또는 표시 전용
Bureau Room Style Selector -> Default 단일 옵션
Max Players Slider -> 1~6 정수
Create Room Action Button -> 부모 HostMenu 이벤트
부모 HostMenu -> URPSessionSubsystem.CreateRoom
```

`FRPCreateRoomOptions` 권장 값:

```text
RoomDisplayName: Room Name GetSanitizedString 결과
bShouldAdvertise: true
MaxPublicConnections: Slider 값, 최종 1~6 clamp
MapName: L_BureauRoom_Dev
bTravelToMapOnSuccess: true
bOpenMapAsListenServer: true
```

## Changelog

### v0.3
- `URPButtonBase`의 전체 크기용 `ButtonRootSizeBox`와 Width/Height override 계약 및 권장 계층 추가

### v0.2
- 공용 옵션 행 전체 크기용 `OptionRootSizeBox`와 Root Width/Height override 계약 추가
- `OptionRootSizeBox`와 오른쪽 값 영역 `OptionValueSizeBox`의 역할 및 권장 계층 구분

### v0.1
- Phase 13 HostMenu / Room List UI 위젯 분류와 Focus / Theme / Config 규칙 정리
