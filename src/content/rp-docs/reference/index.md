---
title: "API Reference Index"
description: "Recovery Protocol API 계약과 기능 흐름을 찾기 위한 공식 문서 진입점."
section: "overview"
sourcePath: "reference/index.md"
status: "Current"
documentType: "Reference Index"
lastReviewed: "2026-07-19"
searchKeywords:
  - "API Reference"
  - "API Contract"
  - "Feature Flow"
  - "URPSessionSubsystem"
  - "UI Widget"
  - "Late Join"
  - "인게임 메뉴"
  - "세션"
  - "기능 흐름"
order: 0
---
- **Status:** Current
- **Document Type:** Reference Index
- **Audience:** C++ Developer, Blueprint Developer, UI Designer, Technical Designer
- **Last Contract Review:** 2026-07-19
- **Reviewed Against:** Phase 16 local working tree (UE 5.8)
- **Search Keywords:** API Reference, API Contract, Feature Flow, URPSessionSubsystem, UI Widget, Late Join, 인게임 메뉴, 세션, 기능 흐름

## 이 인덱스를 쓰는 방법

이 폴더는 API를 나열하는 곳만이 아니다. 찾으려는 질문의 종류에 따라 진입점을 나눈다.

| 찾고 싶은 것                                  | 시작 위치                          |
| ---------------------------------------- | ------------------------------ |
| "방을 찾고 참가하면 내부에서 어떤 순서로 동작하지?"처럼 하고 싶은 일 | 아래 **Feature Flow**            |
| 특정 시스템이 소유하는 공개 함수·완료 신호·실패 경계           | 아래 **API Contract**            |
| 정확한 클래스·함수·binding 이름                    | MkDocs 검색에 C++/Blueprint 이름 입력 |

함수와 변수의 짧은 역할 설명 원본은 C++ `ToolTip` metadata다. API Contract는 ToolTip을 반복하기보다 사용 위치, 완료 신호, 수명주기, 실패 경계와 다른 계약과의 관계를 설명한다.

## 하고 싶은 일 — Feature Flow

| 사용자 목표 | 문서 |
|---|---|
| 방 생성, 검색, 검색 취소, 참가, 참가 취소, 초대, Leave, 연결 실패 복귀 | [Session Room Lifecycle](flows/Session_Room_Lifecycle.md) |
| ESC로 인게임 메뉴 열기/닫기, 하위 Back, WASD 탐색, 입력 복구 | [In-Game Menu Navigation](flows/InGame_Menu_Navigation.md) |
| 미션 중 참가 정책, Observer 접속, 관전, 다음 미션 승격 | [Late Join Observer](flows/Late_Join_Observer.md) |

Feature Flow는 여러 시스템을 가로지르는 순서와 책임만 소유한다. Editor에서 위젯을 만드는 클릭 순서는 Guide/Procedure, 개별 함수의 상세 계약은 API Contract를 따른다.

## 시스템 — API Contract

### Online Session

- [Session Subsystem API Contract](Session_Subsystem_API_Reference.md) — provider-neutral 요청, 완료 이벤트, 취소, 실패 복구와 Host metadata 갱신
- [Online Types API Contract](Online_Types_Reference.md) — 방/사용자 identity, 검색 결과, action state와 result reason

### UI

- [UI Foundation and Input API Contract](ui/UI_Foundation_Input_API.md) — 공통 화면, 인게임 메뉴 수명주기, ESC/Back/WASD 입력
- [UI Controls API Contract](ui/UI_Controls_API.md) — 공통 버튼, 옵션 행, Selector/Slider/TextInput/Toggle/Dropdown, Theme와 Config
- [UI Session Widgets API Contract](ui/UI_Session_Widgets_API.md) — JoinMenu, Room row, Session Notice, Ready Panel, Room Settings, Observer Overlay

## 문서 소유 규칙

```text
API Contract = 현재 공개 계약과 실패 경계
Feature Flow = 사용자 목표가 여러 계약을 통과하는 순서
Guide / Procedure = Editor 조립과 검증 절차
Work Report = 무엇이 언제 왜 바뀌었는지와 검증 근거
Git = 파일 변경 이력
```

Reference에는 일반 Changelog를 두지 않는다. 과거 API를 계속 알아야 하는 경우만 `Deprecated / Migration Notes`에 남긴다.
