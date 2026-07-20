---
title: "Phase 19 - Anomaly Zone Blockout Expansion"
description: "Phase 19 - Anomaly Zone Blockout Expansion의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "phases/Phase_19_Anomaly_Zone_Blockout_Expansion.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 19 - Anomaly Zone Blockout Expansion"
order: 33
---
> 튜토리얼 이상구역을 더 실제 플레이 공간처럼 확장하고, 회수/귀환 동선을 검증하는 Phase다.

---

## 0. 문서 상태

```text
Status:
Planned

Index:
Docs/CODEX_INDEX.md

Kickoff Plan:
착수 전 docs/plans/Phase_19_Kickoff_Plan.md 작성 필요
```

---

## 1. 목표

```text
이상구역의 기본 공간감과 회수 루프 반복 가능성을 블록아웃으로 검증한다.
```

Phase 19는 괴이 AI나 공포 연출 완성이 아니라, 진입, 탐색, 회수, 귀환 동선의 공간 검증 단계다.

---

## 2. 선행 조건

```text
[ ] Phase 18 회수품 Drop / Deposit 흐름 검증
[x] Phase 09 ZonePortal / RecoverableItem / TurnIn 미션 루프
[ ] 이상구역 확장 대상 맵 결정
[ ] Phase 19 Kickoff Plan 작성
```

---

## 3. 이번 Phase에서 만드는 것

```text
레벨:
- 이상구역 입구
- 탐색 구역
- 회수품 배치 후보
- 귀환 동선
- 위험 구역 후보
- 은폐/시야 차단 후보
- 추후 괴이 이동 경로 후보

미션:
- MissionDefinition 기반 진입/귀환 흐름 유지
- RecoverableItem 회수 위치 확장
- Return Portal 또는 Door 경계 검증

블록아웃:
- 벽, 문, 복도, 방, 계단/램프 후보
- 조명 후보
- 멀티플레이 시야/거리 후보
```

---

## 4. 이번 Phase에서 만들지 않는 것

```text
괴이 AI 정식 구현
공포 연출 완성
최종 배경 아트
고급 랜덤 생성
복잡한 목표/퍼즐
레벨 스트리밍 완성
```

---

## 5. 예상 변경 범위

```text
Content/RP/Maps/Tutorial/L_Tutorial_Recovery.umap 또는 신규 Dev/Tutorial 맵
Content/RP/Blueprints/Level/*
Content/RP/Blueprints/Mission/*
Source/RP/Level/*, 필요 시
Source/RP/Mission/*, 필요 시
Docs/docs/plans/Phase_19_Kickoff_Plan.md
Docs/docs/checklists/Phase_19_Editor_Verification_Checklist.md
Docs/docs/reports/Phase_19_Work_Report.md
```

---

## 6. 구조 규칙

```text
이상구역 확장은 레벨 블록아웃과 미션 흐름 검증에 집중한다.
MissionDirector, LevelZone, ZonePortal, CarryComponent 책임이 섞이지 않게 한다.

완성 아트보다 공간 스케일, 동선, 상호작용 위치, 회수품 후보 위치를 우선한다.

괴이 AI, 위험 이벤트, 스폰 연출이 필요해지는 순간 MissionDirector에 바로 흡수하지 않고 Anomaly/Threat Director 또는 별도 Actor 후보로 기록한다.
LevelZone은 구역 의미와 EntryPoint를 제공하며, 미션 성공/실패나 회수 정산을 직접 판정하지 않는다.
Debug Grid, 표식, 레벨 디자인 보조 기능이 커지면 런타임 LevelZone과 Editor/Debug 도구 분리를 Work Report에 기록한다.
```

---

## 7. 검증 기준

```text
[ ] 1 Player에서 진입 -> 탐색 -> 회수 -> 귀환 -> 제출 성공
[ ] 2 Players / Listen Server에서 Host/Client 위치와 회수 흐름 확인
[ ] RecoverableItem 배치가 동선상 의미 있게 분산됨
[ ] 귀환 경로를 찾을 수 있음
[ ] ZonePortal / MissionDirector / CarryComponent 책임이 과도하게 섞이지 않음
```

---

## 8. 다음 Phase로 넘길 것

```text
시각 밀도, 사운드, UI 스킨, 최종 UX 정리는 Phase 20에서 다룬다.
```

---

## 변경 기록

### v0.1
- Phase 19 개별 Phase 문서 초안 작성
- 이상구역 블록아웃 확장 범위와 non-goals 정리

### v0.2
- 이상구역 확장 시 MissionDirector/LevelZone/Debug 도구 비대화 방지 기준 추가
