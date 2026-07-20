---
title: "RP 개발용 Debug HUD 가이드"
description: "RP 개발용 Debug HUD 가이드의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Debug_HUD_Guide.md"
status: "Current"
documentType: "Guide"
lastReviewed: "2026-07-20"
searchKeywords:
  - "Debug HUD"
  - "User Management"
  - "숫자 0"
  - "숫자 9"
  - "DebugExecBindings"
  - "RPToggleDebugStatusHUD"
  - "RPToggleDebugUserManagement"
  - "RPDevSetPlayerReady"
  - "RPDevReadyAllAndStartMission"
  - "Shipping 제외"
order: 41
---
Status: Current

Document Type: Guide

Applies To: RP_Live UE 5.8 PIE / Development

Source Of Truth: `Source/RP/UI/Debug/RPDebugHUDWidget.*`, `Source/RP/Player/RPPlayerController.*`, `Source/RP/Debug/RPDebugCheatManager.*`, `Config/DefaultInput.ini`

Last Reviewed: 2026-07-20

Search Keywords: Debug HUD, User Management, 숫자 0, 숫자 9, DebugExecBindings, RPToggleDebugStatusHUD, RPToggleDebugUserManagement, RPDevSetPlayerReady, RPDevReadyAllAndStartMission, Shipping 제외

## 1. 목적과 범위

`URPDebugHUDWidget`은 PIE와 Development 반복 검증을 위한 화면형 개발 도구다. 제품 HUD, Ready Panel, Room Settings 또는 정식 관리자 UI가 아니다.

현재 Widget 하나가 다음 세 상태를 소유한다.

| 상태 | 표시 | 입력 성격 |
|---|---|---|
| `Hidden` | 아무 화면도 표시하지 않음 | 기본 시작 상태 |
| `Status` | 네트워크, 세션 플레이어, 로컬 플레이어, GAS, 상호작용, Carry, Mission 상태 | 읽기 전용, `HitTestInvisible` |
| `UserManagement` | 접속 Player 목록과 Host 개발 버튼 | 마우스 조작 가능, Client는 읽기 전용 |

상태 원본이나 제품 규칙은 Debug HUD가 소유하지 않는다. 화면은 `GameState`와 `PlayerState`를 읽고, 상태 변경 버튼은 `URPDebugCheatManager`의 Development 전용 명령을 통해 기존 서버 권위 경계로 보낸다.

## 2. 키 계약

키는 `IA_*` 또는 `IMC_Player`가 아니라 `Config/DefaultInput.ini`의 `DebugExecBindings`를 사용한다. 제품 입력 에셋에 Debug 전용 키를 섞지 않기 위한 선택이다.

| 상단 숫자열 키 | Exec 명령 | 동작 |
|---|---|---|
| `0` | `RPToggleDebugStatusHUD` | `Status <-> Hidden` 전환. User Management가 열려 있으면 Status로 교체 |
| `9` | `RPToggleDebugUserManagement` | `UserManagement <-> Hidden` 전환. Status가 열려 있으면 User Management로 교체 |

두 화면은 동시에 표시되지 않는다. 키를 다시 누르면 현재 화면이 닫힌다.

숫자키 입력은 상단 숫자열 `Zero`, `Nine` 계약이다. Numpad 0/9는 현재 별도 binding이 아니다. 콘솔 또는 제품 모달이 입력을 소유할 때는 해당 입력 소유권을 우선한다.

## 3. Status 화면

`0`으로 여는 Status 화면은 기존 Debug HUD의 읽기 전용 계기판이다.

표시 범위:

- Network mode와 Controller/Pawn role
- 접속 Player 수, RP PlayerState 수, Ready 수, PlayerId, Ping
- 로컬 PlayerState와 GAS 상태
- 현재 상호작용 대상과 마지막 결과
- 손/수납 Carry 상태
- Mission runtime과 Mission definition snapshot

Status는 마우스 cursor, move/look 잠금 또는 input mode를 바꾸지 않는다. 제품 메뉴나 Terminal 위에 표시되더라도 click과 Back을 소비하지 않는다.

## 4. User Management 화면

`9`로 여는 User Management는 접속 Player를 확인하고 반복 PIE를 단축하는 Development 전용 화면이다.

각 Player 행은 다음 정보를 표시한다.

```text
PlayerId / Name / Participation / Ready / Ping / Pawn
```

Host에서 사용할 수 있는 조작:

| 조작 | 경로 | 경계 |
|---|---|---|
| `SET READY` / `CLEAR READY` | `RPDevSetPlayerReady <PlayerId> <0|1>` | `Active` RP PlayerState만 서버에서 변경 |
| `START MISSION` | `RPSessionStartMission` | 기존 Host, Ready, Terminal 선택과 Mission 상태 검증 유지 |
| `READY ACTIVE + START` | `RPDevReadyAllAndStartMission` | 모든 Active Player만 Ready 처리한 뒤 기존 Start 경로 호출 |

`LateJoinObserver`와 Non-RP PlayerState는 행에는 보이지만 Ready 버튼이 비활성이다. Observer는 Ready 집계와 `READY ACTIVE + START` 대상에서도 제외한다.

권위별 결과:

| 실행 위치 | 목록 | 상태 변경 버튼 |
|---|---|---|
| Standalone | 표시 | 활성 |
| Listen Host | 표시 | 활성 |
| Client | 표시 | 비활성, `READ ONLY · HOST CONTROLS DISABLED` |
| Dedicated Server | 로컬 화면 없음 | 사용 불가 |

Client read-only 화면은 서버 권위를 우회하지 않는다. 제품 Ready UI와 각 Client의 실제 Ready 요청을 검증할 때는 이 화면 대신 제품 경로를 사용한다.

## 5. 제품 UI와 입력 경합 방지

User Management는 열릴 때 cursor를 표시하고 move/look을 잠근 뒤 `GameAndUI` input mode를 사용한다. 닫으면 Debug 화면을 열기 전 gameplay 입력으로 복귀한다.

다음 제품 UI가 입력을 소유하는 동안 새 User Management 열기 요청은 거절한다.

- In-Game Menu
- Mission Terminal 표시 또는 입력 capture
- 다른 cursor 기반 제품 modal

이미 User Management가 열려 있으면 `9` 또는 `0`으로 닫거나 다른 Debug 화면으로 전환할 수 있다. Escape는 Debug HUD 전용 닫기 키가 아니며 기존 CommonUI Back / In-Game Menu 계약을 유지한다.

## 6. Editor 설정

기본 Native 화면을 사용할 때 새 Input Action, Mapping Context 또는 Widget Blueprint 연결은 필요하지 않다.

`BP_RPPlayerController`의 `RP|Debug` 설정은 다음처럼 사용한다.

| 설정 | 권장값 | 설명 |
|---|---|---|
| `Create Debug HUD` | Development 반복 검증 시 `true` | Widget을 로컬 Player마다 만들되 시작 화면은 `Hidden` |
| `Debug HUD Widget Class` | `None` 또는 기존 `WBP_RPDebugHUDWidget` | `None`이면 Native 기본 화면. WBP는 외형/기본값 조정용 |

`Debug HUD Widget Class`를 WBP로 지정해도 서버 권위 처리나 0/9 binding을 Blueprint 그래프에 다시 만들지 않는다.

## 7. Shipping 제외 정책

Debug 기능은 릴리즈 직전에 사람이 수동으로 노드와 키를 지우는 방식으로 관리하지 않는다. 다음 경계를 코드와 빌드 설정으로 계속 유지한다.

- Shipping에서는 `ARPPlayerController`가 `URPDebugCheatManager`를 `CheatClass`로 지정하지 않는다.
- Shipping에서는 Debug HUD를 생성하지 않는다.
- Shipping에서는 Debug Status/User Management toggle과 상태 변경 명령이 실행되지 않는다.
- 제품 Widget, Session, Ready, Mission 흐름은 Debug HUD와 CheatManager에 의존하지 않는다.
- `DebugExecBindings`는 제품 IA/IMC 계약이 아니며 Shipping 제품 조작으로 사용하지 않는다.

현재 목표는 Shipping에서 Debug 기능이 생성되거나 실행될 수 없게 하는 것이다. Debug C++ 코드와 전용 asset byte까지 패키지에서 완전히 제거해야 할 정도로 규모가 커지면 별도 Developer module 또는 conditional cook을 후속 구조 작업으로 검토한다. 지금 단계에서 새 모듈을 추가하지 않는다.

## 8. 검증 절차

### PIE 1 Player

1. PIE 시작 시 화면이 `Hidden`인지 확인한다.
2. 상단 숫자열 `0`을 눌러 Status를 열고, 다시 `0`으로 닫는다.
3. `9`로 User Management를 열고, 다시 `9`로 닫는다.
4. Status 중 `9`, User Management 중 `0`을 눌러 두 화면이 겹치지 않고 교체되는지 확인한다.
5. User Management를 닫은 뒤 cursor, 이동, 시점 입력이 복구되는지 확인한다.
6. Mission Terminal 또는 In-Game Menu가 열려 있을 때 `9`가 새 User Management를 열지 않는지 확인한다.

### PIE 2 Players / Listen Server

1. Host와 Client에서 `9`를 눌러 동일한 Player 목록이 보이는지 확인한다.
2. Host의 `SET READY` / `CLEAR READY`가 대상 Active PlayerState에 복제되는지 확인한다.
3. Client 행과 하단 버튼이 read-only인지 확인한다.
4. LateJoinObserver 행의 Ready 버튼이 비활성이고 Ready 집계에 포함되지 않는지 확인한다.
5. Terminal에서 미션을 선택한 뒤 `START MISSION`과 `READY ACTIVE + START`가 각각 기존 제품 검증 결과를 유지하는지 확인한다.

### Shipping smoke

1. Shipping package를 실행한다.
2. 상단 숫자열 `0`과 `9`가 Debug 화면을 만들지 않는지 확인한다.
3. console/CheatManager 없이 Title, Multiplayer, In-Game Menu 제품 UI가 정상 동작하는지 확인한다.
4. 로그와 화면에 `RP DEBUG` 또는 User Management가 나타나지 않는지 확인한다.

상세 체크 상태는 [Phase 16 Editor Verification Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md#35-development-debug-hud-non-blocking)에만 기록한다. 이 가이드의 절차를 수행하지 않은 상태에서 PIE 또는 Shipping 성공으로 승격하지 않는다.

## 9. 관련 문서

- [Debug Command Reference](Debug_Command_Reference.md)
- [Phase 16 Work Report](../reports/Phase_16_Work_Report.md)
- [UI Foundation/Input API](../reference/ui/UI_Foundation_Input_API.md)
- [Code Architecture Rules](../06_Code_Architecture_Rules.md)
