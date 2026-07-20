---
title: "In-Game Menu Navigation"
description: "In-Game Menu Navigation의 사용자 흐름, 상태 소유권과 시스템 간 책임을 설명합니다."
section: "flow"
sourcePath: "reference/flows/InGame_Menu_Navigation.md"
status: "Current"
documentType: "Feature Flow"
lastReviewed: "2026-07-19"
searchKeywords:
  - "OpenInGameMenuLocal"
  - "CloseInGameMenuLocal"
  - "IA_OpenInGameMenu"
  - "IA_UI_Back"
  - "IMC_Player"
  - "CommonUI"
  - "WASD"
  - "Escape"
  - "Room Settings"
  - "인게임 메뉴"
  - "뒤로가기"
order: 11
---
- **Status:** Current
- **Document Type:** Feature Flow
- **Flow ID:** FLOW-UI-INGAME-MENU-NAVIGATION
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer, QA
- **Primary Domains:** Player Input, CommonUI, In-Game UI
- **Last Contract Review:** 2026-07-19
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** OpenInGameMenuLocal, CloseInGameMenuLocal, IA_OpenInGameMenu, IA_UI_Back, IMC_Player, CommonUI, WASD, Escape, Room Settings, 인게임 메뉴, 뒤로가기

## User Goal

Escape 하나로 인게임 메뉴를 열고, 열린 상태에서는 가장 안쪽 하위화면부터 닫으며, 최상위 메뉴를 닫은 뒤에는 gameplay 입력과 마우스 캡처를 복구한다. 메뉴가 열린 동안 W/A/S/D는 방향키처럼 Focus를 이동하지만 텍스트 입력을 방해하지 않는다.

## Input Asset Contract

```text
IMC_Player (항상 활성)
├─ IA_OpenInGameMenu = Escape
└─ IA_UI_Back = Escape

BP_RPCommonUIInputData.EnhancedInputBackAction = IA_UI_Back
IMC_UI 교체 없음
```

메뉴를 열고 닫을 때 Mapping Context를 교체하지 않는다. `IA_OpenInGameMenu`는 닫힌 메뉴를 여는 gameplay action, `IA_UI_Back`은 활성 CommonUI 계층의 Back action이다.

## Open Flow

1. `IA_OpenInGameMenu`의 Started가 `ARPPlayerController.OpenInGameMenuLocal`로 들어간다.
2. 로컬 Controller인지, 메뉴가 이미 열렸는지, 다른 로컬 modal UI가 입력을 소유하는지, `InGameMenuScreenClass`가 지정됐는지 확인한다.
3. `WBP_RPInGameMenu`를 생성해 Player Screen에 추가하고 `URPFrontendScreenBase`로 활성화한다.
4. 기본 input config는 `Menu + NoCapture + IgnoreMove/Look`이며 초기 Focus를 적용한다.
5. 화면 instance와 input 수명주기는 PlayerController가 소유한다. BP는 Create Widget, Add/Remove, Input Mode, `IMC_UI` 추가/제거를 중복 구현하지 않는다.

## Back Hierarchy

```text
Escape / IA_UI_Back
-> CommonUI가 가장 안쪽 활성 화면에 전달
-> 하위 Room Settings가 활성: 하위 화면 RequestBack/Deactivate
-> 하위 화면 없음: 최상위 InGameMenu RequestBack
-> ARPPlayerController.CloseInGameMenuLocal
```

Room Settings 같은 하위화면은 `URPFrontendScreenBase`로 활성화하고, Deactivated Visibility를 `Collapsed`로 둔다. Back 버튼과 Escape는 같은 `RequestBack` 계약을 사용한다.

같은 Escape가 `IA_UI_Back`과 `IA_OpenInGameMenu`에 매핑되어 있어도 `LastInGameMenuCloseFrame`이 닫힌 같은 프레임의 재오픈을 차단한다.

## WASD Navigation

`URPUIInputSubsystem`은 LocalPlayer별 Slate navigation config를 설치한다.

- CommonUI input mode가 `Menu`일 때만 W/A/S/D를 Up/Left/Down/Right로 변환한다.
- Editable Text 계열에 Focus가 있으면 문자를 소비하지 않는다.
- Ctrl/Alt/Cmd 조합도 그대로 통과시킨다.
- LocalPlayer 종료 시 이전 per-user navigation config를 복원한다.

별도의 방향 Input Action이나 UI 전용 Mapping Context를 추가하지 않는다. 각 위젯은 CommonUI Focus와 navigation 규칙에 맞는 계층/Navigation 설정만 제공한다.

## Close And Restore

1. `CloseInGameMenuLocal`이 활성 화면을 비활성화하고 제거한다.
2. CommonUI router에 `Game + CapturePermanently + LockOnCapture` config를 적용한다.
3. Move/Look ignore를 해제하고 마우스 커서를 gameplay 상태로 돌린다.
4. CommonUI router가 없는 비정상 조립에서도 `GameOnly`로 최소 복구한다.

LateJoinObserver의 이동/시점 제한은 participation 정책이다. 메뉴가 만든 UI 입력 잠금만 해제하며 Observer를 정상 플레이어 입력으로 승격시키지 않는다.

## Failure Boundaries

- `InGameMenuScreenClass`가 비어 있으면 메뉴를 만들지 않고 warning을 남긴다.
- Mission Terminal처럼 다른 modal UI가 입력을 소유하면 메뉴 open을 거절한다.
- Mission Terminal은 현재 PlayerController가 `AddToPlayerScreen`과 자체 키 입력으로 수명주기를 관리하므로 CommonUI Back Handler를 등록하지 않는다. Activatable Stack으로 이관할 때만 전역 Back 계약을 다시 사용한다.
- 하위화면과 최상위 화면이 한 Escape를 동시에 닫도록 BP에서 raw Escape 분기를 추가하지 않는다.
- `Set Input Mode`, cursor, Mapping Context를 WBP마다 별도로 복구하지 않는다.

## Contract Links

- **State Owner:** [UI Foundation and Input API Contract](../ui/UI_Foundation_Input_API.md)
- **UI Consumer:** [UI Session Widgets API Contract](../ui/UI_Session_Widgets_API.md)
- **Delegates To:** [Session Subsystem API Contract](../Session_Subsystem_API_Reference.md)

## Validation Boundary

Editor asset 지정과 PIE Back 계층 검증은 [Phase 16 Editor Verification Checklist](../../checklists/Phase_16_Editor_Verification_Checklist.md)에 증거를 남긴다. C++/Automation 결과만으로 WBP Focus와 애니메이션 조립을 통과했다고 보지 않는다.
