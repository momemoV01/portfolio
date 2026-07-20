---
title: "Phase 17 - Bureau Room Blockout & Interaction Layout"
description: "Phase 17 - Bureau Room Blockout & Interaction Layout의 Phase 범위, 구현 결과와 검증 근거를 기록합니다."
section: "project"
sourcePath: "phases/Phase_17_Bureau_Room_Blockout_Interaction_Layout.md"
status: "Current"
documentType: "Project Record"
searchKeywords:
  - "Phase 17 - Bureau Room Blockout & Interaction Layout"
order: 31
---
> 관리국 룸을 단순 테스트 레벨에서 실제 게임 준비 공간의 블록아웃으로 확장하는 Phase다.

---

## 0. 문서 상태

```text
Status:
Next

Index:
Docs/CODEX_INDEX.md

Kickoff Plan:
착수 전 docs/plans/Phase_17_Kickoff_Plan.md 작성 필요
```

---

## 1. 목표

```text
관리국 룸의 공간 스케일, 동선, UI/문/Terminal/정산 구역 배치를 블록아웃으로 검증한다.
```

Phase 17은 완성 아트가 아니라 동선, 기능 배치, 멀티플레이 시야/거리 검증 단계다.

---

## 2. 선행 조건

```text
[x] Phase 14 Bureau Room Ready Panel 위치 요구 확인
[x] Phase 15 Mission Terminal / Door Status 위치 요구 확인
[x] Phase 16 Steam UX 흐름이 관리국 룸 진입과 충돌하지 않음
[ ] Phase 17 Kickoff Plan 작성
```

---

## 3. 이번 Phase에서 만드는 것

```text
레벨:
- 플레이어 스폰/대기 구역
- Ready Panel 벽면 또는 디스플레이 위치
- Mission Terminal 위치
- 이상구역 진입문 위치
- 회수/정산 구역 후보
- 장비/아이템 배치 후보
- 차단 벽, 복도, 문, 조명 후보

상호작용 배치:
- Terminal 상호작용 후보
- Door 상호작용 후보
- TurnIn / Deposit 위치 후보

검증 도구:
- 필요 시 LevelZone / Debug Grid / 표식 보강
```

---

## 4. 이번 Phase에서 만들지 않는 것

```text
최종 관리국 아트
고급 조명/포스트프로세스 확정
NPC/상점/장비 시스템
완성 사운드 연출
복잡한 오브젝트 파괴/물리
```

---

## 5. 예상 변경 범위

```text
Content/RP/Maps/Dev/L_BureauRoom_Dev.umap
Content/RP/Blueprints/Level/*, 필요 시
Content/BlockingStarterPack/* 사용 후보
Docs/docs/plans/Phase_17_Kickoff_Plan.md
Docs/docs/checklists/Phase_17_Editor_Verification_Checklist.md
Docs/docs/reports/Phase_17_Work_Report.md
```

---

## 6. 구조 규칙

```text
레벨 작업은 기능 검증을 위한 블록아웃으로 제한한다.
최종 아트/머티리얼/조명 확정보다 스케일과 동선을 우선한다.

상호작용 Actor가 필요하면 기존 Interaction / Mission / Level 책임 경계를 따른다.
레벨 블록아웃이 게임 상태를 직접 소유하지 않는다.

Level Blueprint나 배치된 임시 Actor가 Ready, Mission 선택, Deposit, 세션 상태를 권위 상태로 저장하지 않는다.
Terminal, Door, Deposit 위치는 상호작용 Actor/Component가 요청을 전달하는 배치 검증용으로 두고, 상태 확정은 PlayerState/GameState/MissionDirector/Item 경계에 남긴다.
LevelZone 또는 Debug Grid를 보강할 경우 런타임 Zone 의미와 레벨 디자인 보조 도구가 섞이는지 Work Report에 기록한다.
```

---

## 7. 검증 기준

```text
[ ] 2인 접속 시 서로의 위치와 UI/문/Terminal 위치가 자연스럽게 보임
[ ] Ready Panel / Mission Terminal / Door 간 이동 동선이 과하게 길거나 짧지 않음
[ ] Host/Client 모두 주요 상호작용 위치를 찾기 쉬움
[ ] 블록아웃 오브젝트가 테스트 UI나 Debug HUD를 가리지 않음
[ ] Phase 14~15 UI 흐름이 레벨 배치와 충돌하지 않음
```

---

## 8. 다음 Phase로 넘길 것

```text
회수품을 내려놓고 제출하는 물리/Deposit 흐름은 Phase 18에서 다룬다.
```

---

## 변경 기록

### v0.1
- Phase 17 개별 Phase 문서 초안 작성
- 관리국 룸 블록아웃과 상호작용 배치 범위 정리

### v0.2
- Level Blueprint/임시 Actor가 권위 상태를 소유하지 않도록 블록아웃 구조 규칙 보강

### v0.3
- Phase 16 Done에 따라 Phase 17을 Next로 변경
- Phase 14 Ready Panel, Phase 15 Terminal/Door와 Phase 16 관리국 세션 흐름의 선행 요구 확인
- 구현 착수 전 Kickoff Plan에서 Door/Portal 이관 후보와 Bureau Room 범위를 다시 확정하도록 유지
