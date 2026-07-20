---
title: "Phase 18 - Recoverable Item Drop / Physics / Deposit Flow"
description: "Phase 18 - Recoverable Item Drop / Physics / Deposit Flow의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "phases/Phase_18_Recoverable_Item_Drop_Physics_Deposit_Flow.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 18 - Recoverable Item Drop / Physics / Deposit Flow"
order: 32
---
> 회수품을 들고, 버리고, 내려놓고, 제출 후보로 모은 뒤 서버 권위로 최종 제출하는 감각을 만드는 Phase다.

---

## 0. 문서 상태

```text
Status:
Planned

Index:
Docs/CODEX_INDEX.md

Kickoff Plan:
착수 전 docs/plans/Phase_18_Kickoff_Plan.md 작성 필요
```

---

## 1. 목표

```text
Phase 09의 단순 반납을 정식 회수/정산 구조에 가까운 드랍, 물리, Deposit 흐름으로 확장한다.
```

Phase 18은 완성형 인벤토리나 경제 시스템이 아니라 회수품을 물리적으로 다루는 감각을 검증하는 단계다.

---

## 2. 선행 조건

```text
[x] Phase 08 RecoverableItem 손/수납 슬롯 토대
[x] Phase 09 회수품 반납 미션 성공 흐름
[ ] Phase 17 관리국 룸 회수/정산 구역 후보 배치
[ ] Phase 18 Kickoff Plan 작성
```

---

## 3. 이번 Phase에서 만드는 것

```text
아이템 흐름:
- RecoverableItem 드랍 물리 후보
- 손/수납 슬롯에서 내려놓기
- 줍기 / 다시 들기
- 제출 후보 상태

정산 흐름:
- Recovery Deposit Zone 후보
- Deposit Zone 안의 제출 후보 수집
- TurnInStation에서 E로 최종 제출 확정
- 서버 권위 제출 판정

복제:
- 아이템 소유권 변경
- 물리 상태 전환
- 제출 후보 상태 표시
```

---

## 4. 이번 Phase에서 만들지 않는 것

```text
완성형 인벤토리
가치/등급/가격 경제
상점/보상 정산 전체
복잡한 물리 퍼즐
아이템 파손/오염 정식 시스템
```

---

## 5. 예상 변경 범위

```text
Source/RP/Item/*
Source/RP/Mission/*
Source/RP/Interaction/*
Content/RP/Blueprints/Items/*
Content/RP/Maps/Dev/L_BureauRoom_Dev.umap
Content/RP/Maps/Tutorial/L_Tutorial_Recovery.umap, 회귀 배치 필요 시
Docs/docs/plans/Phase_18_Kickoff_Plan.md
Docs/docs/checklists/Phase_18_Editor_Verification_Checklist.md
Docs/docs/reports/Phase_18_Work_Report.md
```

---

## 6. 구조 규칙

```text
아이템 소유권과 제출 확정은 서버 권위다.
Client는 들기/내려놓기/제출 요청만 보낸다.

권장 책임 분리는 아래를 기본값으로 둔다.
- URPCarryComponent: 플레이어 손/수납 슬롯과 들기/내려놓기 요청 검증
- ARPRecoverableItem: 월드 아이템 상태, 보유자, 드랍/물리 표현용 복제 상태
- Recovery Deposit Zone: 제출 후보 감지와 표시, 최종 제출 확정은 하지 않음
- TurnInStation: 제출 확정 요청 입구, 서버 검증 후 MissionDirector 또는 GameState 경계로 전달
- ARPMissionDirector / ARPGameStateBase: 미션 성공, 회수 가치, 정산 결과 같은 모두가 알아야 하는 상태 확정/복제

물리 결과는 클라이언트가 최종 소유권/제출 여부를 확정하지 않는다.
드랍 위치, 줍기 가능 상태, 제출 후보 상태는 서버 검증 후 복제되는 값으로 판단한다.
URPCarryComponent, ARPMissionDirector, TurnInStation이 과도한 허브가 되지 않게 책임 분리 후보를 Work Report에 기록한다.
전역 InventoryManager는 만들지 않는다.
```

---

## 7. 검증 기준

```text
[ ] Host가 아이템을 들고 내려놓을 수 있음
[ ] Client가 요청하면 서버 검증 후 내려놓기/줍기 상태가 복제됨
[ ] 드랍된 아이템이 시각적으로 확인 가능하고 과도하게 튀지 않음
[ ] Deposit Zone 안의 아이템이 제출 후보로 인식됨
[ ] TurnInStation 상호작용 시 서버 권위로 제출 확정
[ ] Phase 09 Mission Succeeded 흐름 회귀 성공
```

---

## 8. 다음 Phase로 넘길 것

```text
이상구역 자체 공간 확장과 회수품 배치 다양화는 Phase 19에서 다룬다.
```

---

## 변경 기록

### v0.1
- Phase 18 개별 Phase 문서 초안 작성
- RecoverableItem 드랍/물리/Deposit 흐름 범위 정리

### v0.2
- CarryComponent, RecoverableItem, Deposit Zone, TurnInStation, MissionDirector/GameState 책임 분리 기준 추가
