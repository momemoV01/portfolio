---
title: "RP Project Manager 운영 가이드"
description: "RP Project Manager 운영 가이드의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Roadmap_Project_Manager_Guide.md"
status: "Current"
documentType: "Guide"
searchKeywords:
  - "Obsidian"
  - "Project Manager"
  - "Roadmap"
  - "Gantt"
  - "Kanban"
  - "RP Project Roadmap"
  - "ACT"
  - "MS"
  - "일정"
  - "담당자"
  - "의존성"
  - "작업 상태"
order: 46
---
- **Status:** Current
- **Document Type:** Guide
- **Audience:** Developer, Designer, Technical Designer, AI Worker
- **Last Verified:** 2026-07-19
- **Search Keywords:** Obsidian, Project Manager, Roadmap, Gantt, Kanban, RP Project Roadmap, ACT, MS, 일정, 담당자, 의존성, 작업 상태

Obsidian Project Manager로 RP의 일정, 담당자, 작업 상태와 의존성을 관리하는 방법을 정의한다. Roadmap은 실행 보드이며 Phase 범위나 완료 근거를 대신하지 않는다.

## 1. 문서별 원본 책임

| 문서 | 원본으로 소유하는 정보 |
|---|---|
| [RP Project Roadmap](../roadmap/index.md) | 일정, 담당자, 작업 상태, 선후행 관계 |
| `Docs/CODEX_INDEX.md` | 공식 Phase `Current` / `Done` / `Next` |
| Work Report | 실제 구현 결과, 최신 검증, 잔여 작업, 다음 세션 인수인계 |
| [Problem Resolution Records](../history/problems/index.md) | 중요한 문제의 재현, 근본 원인, 해결과 회귀 방지 |
| Editor Verification Checklist | 사용자가 수행하는 Editor/PIE/Steam 절차와 증거 |
| API Contract / Feature Flow | 현재 유효한 공개 계약과 시스템 간 기능 흐름 |

같은 정보를 여러 문서에 모두 복사하지 않는다. Roadmap 작업에는 완료 근거의 요약과 링크만 두고, 상세 로그는 Work Report나 Checklist에 남긴다.

## 2. 로컬 설정

Obsidian Vault는 다음 폴더를 연다.

```text
E:/Workspace/RP_Live/RP/Docs/docs
```

Project Manager 설정은 아래 값으로 맞춘다.

| 설정 | 값 |
|---|---|
| Projects Folder | `roadmap/data` |
| Default View | `Gantt` |
| Gantt Granularity | `Week` |
| Auto Schedule | `Off` |
| Team Members / Assignees | `User`, `Codex`, `Shared` |

기본 status ID는 `todo`, `in-progress`, `blocked`, `review`, `done`, `cancelled`를 유지한다. 화면에서 `review`의 표시 이름은 필요하면 `Verification`으로 바꿀 수 있지만 ID와 의미는 바꾸지 않는다.

`Auto Schedule`은 v1에서 끈다. 의존성 화살표는 유지하되 한 작업의 날짜를 움직였다고 후속 Phase 일정이 자동으로 대량 변경되지 않게 한다. `tentative` 태그가 붙은 날짜는 약속이 아니라 현재 계획값이다.

`.obsidian` 아래의 플러그인 설정은 개인 로컬 환경이며 Git으로 추적하지 않는다. 팀과 AI 작업자가 공유하는 계약은 이 가이드와 `roadmap/data/`의 Markdown/YAML이다.

Obsidian이 설정 파일보다 먼저 실행되어 Project Manager에 `No projects yet`가 보이면 새 프로젝트를 만들지 않는다. Project Manager 플러그인만 한 번 껐다 켜거나 Obsidian을 안전하게 다시 시작하면 `roadmap/data` 설정과 기존 `RP Project Roadmap`을 다시 읽는다.

## 3. 저장 구조

```text
roadmap/index.md
roadmap/data/RP Project Roadmap.md
roadmap/data/RP Project Roadmap_tasks/*.md
```

- 프로젝트 이름: `RP Project Roadmap`
- 프로젝트 ID: `rp-project-roadmap`
- Phase 16~20은 하나의 Master Project 안에서 관리한다.
- raw Project Manager 데이터는 MkDocs에서 제외하고 [Roadmap 홈](../roadmap/index.md)만 웹에 표시한다.
- 초기 프로젝트 파일이 이미 있으면 Project Manager에서 같은 이름의 프로젝트를 다시 만들지 않는다.

프로젝트나 작업 파일을 임의로 이동하면 Project Manager의 참조가 끊길 수 있다. 위치 변경이 필요하면 별도 문서 작업으로 프로젝트, task folder, 링크와 검사 규칙을 함께 갱신한다.

## 4. 사람이 읽는 ID

Project Manager 내부 ID와 별도로 제목 앞에 안정적인 사람이 읽는 ID를 둔다.

```text
[PH-16] Phase 16 — Steam Lobby UX Completion
[ACT-16-003] Room Settings와 In-Game Menu 연결
[MS-16-DONE] Phase 16 완료 Gate
```

| 접두사 | 의미 |
|---|---|
| `PH-XX` | Phase 부모 작업 |
| `ACT-XX-NNN` | 구현·검증·문서 작업 |
| `MS-XX-DONE` | Phase 완료 Milestone |

`ACT-*` ID는 Work Report의 `Open Action Register`와 같게 유지한다. 내부 Project Manager ID는 링크와 의존성을 위해 그대로 두며 사람이 직접 재작성하지 않는다.

## 5. 작업 본문

새 작업 본문은 [Roadmap Task Body Template](../templates/Roadmap_Task_Body_Template.md)을 사용한다.

```text
Goal
Done Criteria
Blocking Reason
Evidence
Related Docs
Notes
```

- `Goal`: 사용자 또는 프로젝트가 얻게 되는 결과
- `Done Criteria`: 상태를 `done`으로 바꿀 수 있는 구체적인 조건
- `Blocking Reason`: `blocked`일 때만 실제 차단 조건 기록
- `Evidence`: Work Report, Checklist, 로그, Automation report 링크
- `Related Docs`: Phase, Plan, API Contract, Feature Flow, PRR 링크
- `Notes`: 잠정 일정, 범위 제외, 다음 판단에 필요한 짧은 메모

상세 Editor 절차나 긴 장애 타임라인을 작업 본문에 복사하지 않는다.

## 6. 상태 의미와 전이

| 상태 | 사용할 때 | 다음 판단 |
|---|---|---|
| `todo` | 아직 시작하지 않음 | 실제 착수 시 `in-progress` |
| `in-progress` | 현재 구현 또는 문서 작업 중 | 구현 종료 후 증거 상태에 따라 `review` 또는 `done` |
| `blocked` | 외부 조건 때문에 진행할 수 없음 | `Blocking Reason` 필수 |
| `review` | 구현은 끝났지만 Editor·PIE·Steam·패키징·사용자 확인이 남음 | 근거가 기록되면 `done` |
| `done` | Done Criteria를 만족하고 근거가 연결됨 | 회귀 시 작업 또는 연결 PRR을 다시 열어 판단 |
| `cancelled` | 범위에서 제외됨 | `Blocking Reason`에 제외 이유, `Notes`에 대체 작업 기록 |

Codex 갱신 규칙:

1. 의미 있는 구현이나 문서 작업을 시작하면 `in-progress`로 바꾼다.
2. 코드·문서는 끝났지만 사용자의 Editor/PIE/Steam 확인이 남으면 `review`로 둔다.
3. 같은 차단 조건 때문에 진행할 수 없을 때만 `blocked`로 바꾸고 사유를 기록한다.
4. 완료 근거가 Work Report 또는 연결 문서에 기록된 뒤 `done`으로 바꾼다.
5. `cancelled`로 바꾸면 `Blocking Reason`에 제외 이유를 기록한다.
6. 작은 질문, 상태 설명, 읽기 전용 조사에는 Roadmap 작업을 만들거나 상태를 갱신하지 않는다.

진행률은 상태와 모순되지 않게 유지한다. `done`은 100%, 시작하지 않은 `todo`는 0%가 기본이다. 날짜가 없는 backlog는 억지로 Gantt에 배치하지 않는다.

## 7. Phase 완료 Mirror 규칙

Roadmap의 `[MS-XX-DONE]`은 공식 완료 판정의 원본이 아니라 결과를 반영하는 mirror다.

Phase 완료 순서:

1. Phase 문서의 완료 기준을 충족한다.
2. 필요한 Editor/PIE/Steam/패키징 근거를 Checklist와 Work Report에 기록한다.
3. Work Report의 잔여 Gate와 완료 경계를 갱신한다.
4. `Docs/CODEX_INDEX.md`의 공식 Phase 상태를 갱신한다.
5. 마지막으로 Roadmap의 Phase Milestone을 `done`으로 바꾼다.

Roadmap만 `done`이거나 날짜가 지났다는 이유로 Phase를 완료하지 않는다. 반대로 Work Report와 `CODEX_INDEX.md`가 완료됐는데 Roadmap만 오래된 경우 Roadmap을 최신 상태로 맞춘다.

## 8. 단일 작성자 규칙

Project Manager UI와 외부 Markdown 편집을 동시에 하면 저장 순서에 따라 최신 변경이 덮일 수 있다. 한 파일에는 한 시점에 한 작성자만 둔다.

### Obsidian에서 Codex로 넘길 때

1. Project Manager 편집을 마치고 필드가 파일에 저장됐는지 확인한다.
2. 해당 작업의 입력을 멈춘다.
3. Codex가 현재 파일을 다시 읽은 뒤 수정한다.
4. Obsidian이 외부 변경을 읽은 것을 확인하고 다시 편집한다.

### Codex에서 Obsidian으로 넘길 때

1. Codex가 Roadmap 파일 수정을 끝냈다는 보고를 기다린다.
2. Project Manager 화면을 다시 열거나 Vault 갱신을 기다린다.
3. 제목, 상태, 날짜, 의존성이 파일과 같은지 확인한다.
4. 오래 열린 편집 화면의 값을 그대로 저장하지 않는다.

충돌이 의심되면 Project Manager 화면보다 Markdown frontmatter를 먼저 비교하고, 내부 ID나 dependency를 추측해 새 값으로 만들지 않는다. v1에서는 Roadmap과 Work Report 사이의 양방향 자동 동기화를 사용하지 않는다.

## 9. 의존성과 잠정 일정

- Phase 17 이후 부모 Phase는 앞 Phase의 완료 Milestone에 의존한다.
- 실제 병렬 진행이 가능한 작업만 같은 기간에 둔다.
- 사용자 Editor 작업과 Codex 코드 작업이 서로 필요하면 의존성을 명시한다.
- 단순 참고 관계는 dependency로 만들지 않고 `Related Docs`에 링크한다.
- 잠정 날짜를 옮겨도 Work Report의 과거 검증 시각은 바꾸지 않는다.
- Auto Schedule이 꺼져 있으므로 선행 작업이 늦어지면 후속 날짜는 사람이 검토해 조정한다.

## 10. 운영 점검

초기 설정 또는 구조 변경 후 다음을 확인한다.

- [ ] `RP Project Roadmap`이 중복 없이 한 번 표시된다.
- [ ] Phase 16~20 부모와 하위 작업이 계층으로 보인다.
- [ ] Gantt가 Week 단위로 표시된다.
- [ ] 의존성 화살표가 올바른 Milestone을 가리킨다.
- [ ] 잠정 작업 하나를 드래그했을 때 예상한 Markdown만 변경된다.
- [ ] Obsidian 재시작 후 날짜와 상태가 유지된다.
- [ ] 외부 Markdown 수정이 Project Manager에 다시 반영된다.
- [ ] `done` 작업의 진행률이 100%다.

문서 계약 검사는 프로젝트 루트에서 실행한다.

```powershell
& .\Tools\Docs\Validate_Docs.ps1
```

전체 문서 책임과 Work Report/PRR 작성 규칙은 [Documentation Workflow](../03_Documentation_Workflow.md)를 따른다.
