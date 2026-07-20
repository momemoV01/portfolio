---
title: "Phase 20 - Visual / UX Polish Pass"
description: "Phase 20 - Visual / UX Polish Pass의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "phases/Phase_20_Visual_UX_Polish_Pass.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 20 - Visual / UX Polish Pass"
order: 34
---
> 검증된 세션, 준비, 미션 선택, 회수 루프 위에 시각/청각/사용성 밀도를 올리는 Phase다.

---

## 0. 문서 상태

```text
Status:
Planned

Index:
Docs/CODEX_INDEX.md

Kickoff Plan:
착수 전 docs/plans/Phase_20_Kickoff_Plan.md 작성 필요
```

---

## 1. 목표

```text
기능 토대를 크게 바꾸지 않고, 플레이어가 실제 게임처럼 느끼도록 UI, 레벨, 피드백을 다듬는다.
```

Phase 20은 구조 대개편이 아니라 이미 검증된 흐름의 표현과 사용성을 끌어올리는 단계다.

---

## 2. 선행 조건

```text
[ ] Phase 16 Steam Lobby UX 흐름 검증
[ ] Phase 17 관리국 룸 블록아웃 검증
[ ] Phase 18 회수품 Drop / Deposit 흐름 검증
[ ] Phase 19 이상구역 블록아웃 확장 검증
[ ] Phase 20 Kickoff Plan 작성
```

---

## 3. 이번 Phase에서 만드는 것

```text
UI/UX:
- Fab UI 시스템 또는 선택한 UI 스타일의 제한적 적용
- 버튼/패널/상태 표시 시각 정리
- 실패/성공 메시지 톤 정리
- Ready / Mission / Door / Recovery 상태의 일관된 표현

레벨:
- 관리국 룸 조명/머티리얼 1차 정리
- 이상구역 분위기 1차 정리
- 주요 동선 안내 시각 요소
- 문 LED / Terminal / Deposit Zone 시각 강화

연출:
- UI 사운드 후보
- 문 상태 사운드 후보
- 회수품 드랍/제출 피드백 후보
- 미션 시작/성공 피드백 후보
```

---

## 4. 이번 Phase에서 만들지 않는 것

```text
기능 구조 대개편
새 온라인 provider 추가
AccountServer
최종 상용 퀄리티 전체 아트
대규모 레벨 재작성
괴이 AI 정식 완성
```

---

## 5. 예상 변경 범위

```text
Content/RP/Blueprints/Widgets/*
Content/RP/Maps/Dev/*
Content/RP/Maps/Tutorial/*
Content/RP/Materials/*
Content/RP/Sounds/*, 필요 시
Source/RP/UI/*, 필요 시
Docs/docs/plans/Phase_20_Kickoff_Plan.md
Docs/docs/checklists/Phase_20_Editor_Verification_Checklist.md
Docs/docs/reports/Phase_20_Work_Report.md
```

---

## 6. 구조 규칙

```text
시각/사운드/UX 작업은 서버 권위 게임 상태를 직접 변경하지 않는다.
Widget은 요청과 표시만 담당한다.

Fab UI 또는 외부 UI 시스템은 제한적으로 적용한다.
기존 흐름을 대체하거나 프로젝트 구조를 크게 바꾸지 않는다.

Debug HUD, DebugCheat, 테스트 Widget은 제품 UI의 기반 클래스로 승격하지 않는다.
제품 UI는 Phase 13~16에서 검증한 RP session/gameplay 표시 데이터를 읽고, Debug 전용 문자열이나 콘솔 명령에 의존하지 않는다.
외부 UI 시스템을 도입하더라도 Ready, Mission 선택, Deposit, 세션 상태의 서버 권위 소유자는 바꾸지 않는다.
Polish 중 기능 구조 대개편이 필요해 보이면 Phase 20 범위에서 처리하지 말고 후속 Phase 후보로 분리한다.
```

---

## 7. 검증 기준

```text
[ ] 메뉴 -> 방 생성/참가 -> 관리국 룸 -> Ready -> 미션 선택 -> 시작 흐름이 눈으로 이해됨
[ ] 관리국 룸에서 무엇을 해야 하는지 테스트 플레이어가 UI와 공간만 보고 추론 가능
[ ] 회수품 드랍/제출 피드백이 명확함
[ ] Host/Client UI 상태가 서로 어긋나지 않음
[ ] 시각/사운드 작업이 서버 권위 게임 상태를 직접 변경하지 않음
```

---

## 8. 다음 Phase로 넘길 것

```text
Phase 20 이후는 테스트 플레이 결과를 기준으로 괴이 AI, 정산/보상, Journal/Intel, 레벨 스트리밍, 상용 UX 중 다음 우선순위를 다시 결정한다.
```

---

## 변경 기록

### v0.1
- Phase 20 개별 Phase 문서 초안 작성
- Visual / UX Polish 범위와 non-goals 정리

### v0.2
- Debug UI와 제품 UI 분리, 외부 UI 시스템의 권위 상태 변경 금지, Polish 범위 이탈 기준 추가
