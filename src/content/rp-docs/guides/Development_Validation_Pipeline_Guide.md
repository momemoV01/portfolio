---
title: "Development Validation Pipeline Guide"
description: "Development Validation Pipeline Guide의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Development_Validation_Pipeline_Guide.md"
status: "Current"
documentType: "Guide"
searchKeywords:
  - "development pipeline"
  - "Iteration"
  - "Closure Gate"
  - "Validate_RP"
  - "Validate_ReferenceDocs"
  - "API Contract"
  - "Feature Flow"
  - "Reference 검사"
  - "Git 승인"
  - "read-only Git"
  - "branch"
  - "commit"
  - "merge"
  - "push"
  - "Unity build"
  - "Non-Unity build"
  - "Automation Test"
  - "ReportExportPath"
  - "Phase 11 smoke"
  - "개발 파이프라인"
  - "반복 검증"
  - "마감 검증"
order: 42
---
Status: Current
Applies To:
- RP_Live UE 5.8 구현 작업
- `Tools/Build/Validate_RP.ps1`
- Codex와 개발자의 Git/검증 승인 경계

Last Verified: 2026-07-19

Search Keywords: development pipeline, Iteration, Closure Gate, Validate_RP, Validate_ReferenceDocs, API Contract, Feature Flow, Reference 검사, Git 승인, read-only Git, branch, commit, merge, push, Unity build, Non-Unity build, Automation Test, ReportExportPath, Phase 11 smoke, 개발 파이프라인, 반복 검증, 마감 검증

## Purpose

기본 개발 루프는 빠른 `Iteration`, 마감 검증은 명시적으로 요청하는 `Gate`, Git 변경은 별도 요청형 작업으로 분리한다.

```text
현재 checkout에서 구현
-> Iteration: 영향 범위만 빠르게 검증
-> 사용자 요청 시 Gate: 동결된 입력을 한 번 전체 검증
-> 사용자 요청 시에만 Git mutation
```

검증 성공은 commit, merge, push, Phase Done을 자동 승인하지 않는다. Git 작업 성공도 Editor/PIE/Steam/패키징 검증을 대신하지 않는다.

## Git Authorization Boundary

읽기 전용 Git 점검은 작업 상태와 사용자 변경을 안전하게 파악하기 위해 항상 실행할 수 있다.

| 구분 | 예시 | 기본 권한 |
|---|---|---|
| 읽기 전용 | `status`, `diff`, `diff --check`, `log`, `show`, `branch --list`, `ls-files`, `rev-parse` | 항상 허용 |
| 브랜치/worktree 변경 | branch 생성·전환·삭제, worktree 생성·제거 | 명시 요청 시만 |
| index/history 변경 | `add`, `commit`, `merge`, `rebase`, `cherry-pick`, `revert`, `tag` | 각 작업을 명시 요청한 경우만 |
| 작업 트리 임시 이동 | `stash`, tracked 파일 이동/복원 | 명시 요청 시만 |
| 원격 변경 | `push`, 원격 branch/tag 삭제 | 명시 요청 시만 |
| 파괴적 작업 | `reset --hard`, 강제 checkout, force-push, 대량 삭제 | 구체적 대상 확인과 별도 승인 필요 |

`구현해줘`, `수정해줘`, `계속 진행`, `알아서 진행`은 Git mutation 권한이 아니다. 예를 들어 commit만 요청하면 branch 생성이나 push까지 확장하지 않는다.

현재 checkout이 이미 적절한 `phase/<번호>` 또는 요청된 작업 브랜치이면 그 자리에서 구현한다. `main`처럼 프로젝트 편집에 부적절한 checkout이라면 자동으로 branch를 만들거나 전환하지 않고, 편집 전에 사용자에게 branch 선택과 전환 권한을 요청한다.

dirty worktree의 사용자 `.uasset`, `.umap`, 문서 변경은 그대로 보존한다. 자동 stash, 임시 보존 branch, scoped commit, reset으로 정리하지 않는다.

## Validation Modes

### Iteration — 기본

구현 중 피드백을 빠르게 얻는 모드다.

- read-only diff/path 점검
- 변경된 PowerShell 구문 점검
- Reference metadata/source/canonical/link/MkDocs nav 점검
- C++ 변경이면 incremental Unity build 1회
- Session 또는 Mission처럼 영향 범위가 분명하면 해당 Automation만 실행
- 두 영역이면 한 Editor 프로세스에서 두 suite를 묶어 실행
- 문서/도구/Content-only 변경은 불필요한 UE 전체 빌드를 생략

### Gate — 요청형 마감 검증

사용자가 `마감 검증`, `Closure Gate`, `Phase Done 검증`, `전체 검증`처럼 명시했을 때 실행한다.

- 시작 시 HEAD, changed path, 파일 hash를 고정하고 종료 시 다시 비교
- Unity build
- Non-Unity build
- 범위에 맞는 Automation과 JSON 결과 검증
- Phase 11 closure smoke
- read-only diff/prohibited-path audit 재검증
- Automation warning도 실패로 취급

실행 중 입력 파일이나 HEAD가 바뀌면 Gate를 실패시키고 동결된 상태에서 다시 실행한다. WBP 연결, Editor/PIE, 두 계정 Steam, 패키징/Shipping 검증은 별도 수동 증거로 남는다.

### Git / Publish — 별도 요청

Gate 통과 뒤에도 아무 Git mutation을 자동 실행하지 않는다. 사용자가 요청한 단위만 수행한다.

```text
branch 요청 -> branch 작업만
commit 요청 -> 범위 확인 후 stage/commit
merge 요청 -> 지정한 base/head 통합
push 요청 -> 지정한 branch push
main merge와 origin/main push -> 각각 명시 승인
```

## Scope Matrix

모든 Scope는 UE 빌드 여부와 관계없이 다음 공통 정적 검사를 먼저 실행한다.

```text
read-only diff/path 정책
-> 변경된 PowerShell 구문
-> Reference 문서 계약과 MkDocs nav 대상
-> Scope별 build/Automation 또는 CheckOnly 종료
```

Reference 검사는 C++ Scope에서도 실행한다. 선언된 canonical 심벌이나 Source 경로가 코드 변경으로 사라졌을 때 문서 stale을 같은 반복에서 발견하기 위해서다. `-CheckOnly`도 읽기 전용 Reference 검사를 생략하지 않는다.

| Scope | Iteration | Gate |
|---|---|---|
| `Docs` | diff + Reference 검사 | 같은 검사; UE build는 의도적으로 생략 |
| `Tooling` | diff + changed `.ps1` 구문 + Reference 검사 | 같은 검사; UE build는 의도적으로 생략 |
| `Content` | diff/path 검사, Editor 검증 안내 | diff/path 검사; Editor load/asset validation/PIE 증거 필수 |
| `Session` | Unity + `RP.Session` 10개 | Unity + Non-Unity + 같은 suite + Phase 11 smoke |
| `Mission` | Unity + `RP.Mission.Selection` 3개 | Unity + Non-Unity + 같은 suite + Phase 11 smoke |
| `Phase16` | Unity + 위 13개와 `RP.UI` 2개를 한 프로세스에서 실행 | Unity + Non-Unity + 같은 15개 + Phase 11 smoke |
| `Core` | Unity + `RP` 15개 | Unity + Non-Unity + `RP` 15개 + Phase 11 smoke |

`Auto`는 unstaged, staged, untracked path를 읽어서 위 범위를 보수적으로 고른다. Session/Mission 전용 경계 밖의 `Source`, `Config`, module/target 변경이 섞이면 `Core`로 올린다. clean worktree에서는 범위를 추론할 수 없으므로 `-Scope`를 명시한다.

새 Automation을 추가하거나 제거하면 `Validate_RP.ps1`의 기대 개수 manifest도 같은 변경에서 갱신한다. 이는 필터 오타나 테스트 등록 누락을 0개 성공으로 잘못 처리하지 않기 위한 계약이다.

## Commands

프로젝트 루트 `E:/Workspace/RP_Live/RP`에서 실행한다.

```powershell
# Reference 계약만 직접 검사
& .\Tools\Docs\Validate_ReferenceDocs.ps1

# 기본 반복 검증: 변경 path로 범위 자동 선택
& .\Tools\Build\Validate_RP.ps1 -Mode Iteration -Scope Auto

# 범위를 명시한 빠른 검증
& .\Tools\Build\Validate_RP.ps1 -Mode Iteration -Scope Session
& .\Tools\Build\Validate_RP.ps1 -Mode Iteration -Scope Phase16

# 요청형 마감 Gate
& .\Tools\Build\Validate_RP.ps1 -Mode Gate -Scope Phase16

# 실행 없이 실제 child command와 UE 5.8 preflight 확인
& .\Tools\Build\Validate_RP.ps1 -Mode Gate -Scope Phase16 -CheckOnly
```

`Validate_ReferenceDocs.ps1`은 PowerShell 5.1 표준 기능만 사용하며 Python/MkDocs 설치를 요구하지 않는다. MkDocs가 별도로 준비된 환경에서는 추가 렌더링 검증으로 다음을 실행할 수 있다.

```powershell
mkdocs build --strict -f Docs/mkdocs.yml
```

MkDocs가 없는 로컬은 N/A로 기록하고 Unreal Engine 내장 Python에 패키지를 설치하지 않는다.

필요할 때만 병렬도를 override한다.

```powershell
& .\Tools\Build\Validate_RP.ps1 `
  -Mode Gate `
  -Scope Phase16 `
  -UnityParallelActions 4 `
  -NonUnityParallelActions 1
```

기본값은 Unity 4, Non-Unity 1이다. 최근 Non-Unity/UBA 메모리 압박 이력 때문에 8 이상을 기본값으로 두지 않는다. 더 높은 값은 동일 change set의 별도 benchmark에서 실제 단축과 메모리 여유를 확인한 뒤 opt-in한다.

## Automation Verdict

여러 suite는 다음처럼 `+` filter로 묶고 한 번만 discovery/실행한다.

```text
Automation RunTests StartsWith:RP.Session+StartsWith:RP.Mission.Selection; Quit
```

`-TestExit="Automation Test Queue Empty"`는 로그를 보고 프로세스를 끝낼 뿐 테스트 실패를 exit code에 반영하는 판정기가 아니다. Pipeline은 `; Quit`의 종료 코드와 실행별 고유 `-ReportExportPath`의 `index.json`을 함께 검사한다.

```text
failed == 0
notRun == 0
inProcess == 0
tests.Count == summary total
requested prefix count == manifest count
```

HTML은 테스트 시작 전에 생성될 수 있으므로 성공 근거로 사용하지 않는다. 로그와 보고서는 아래 ignored 경로에 남는다.

```text
Saved/Logs/Validation/<timestamp-pid-id>-<mode>/
Saved/Automation/Pipeline/<timestamp-pid-id>-<scope>/index.json
```

## Optimization Tradeoffs

| 최적화 | 이점 | 단점/보완 |
|---|---|---|
| Iteration에서 Non-Unity 생략 | 구현 피드백 단축 | unity masking은 Gate의 Non-Unity 1회로 검출 |
| 영향 suite만 실행 | Editor startup과 테스트 시간 감소 | 경계가 섞이거나 불명확하면 `Core`로 승격 |
| Session+Mission 한 프로세스 실행 | 중복 UE startup/discovery 제거 | exact manifest와 JSON으로 각 prefix가 실제 실행됐는지 검증 |
| 문서/도구-only UE 빌드 생략 | 의미 없는 전체 빌드 제거 | PowerShell parser와 diff/path audit는 유지 |
| Git mutation 요청형 | 자동 branch/commit/merge 대기와 위험 제거 | 사용자가 원하는 Git 단계는 별도 한 문장으로 요청해야 함 |
| Gate 1회 집중 | 하위 작업마다 반복되는 full build 감소 | Gate 직전 code freeze와 실패 시 재실행 필요 |

full Unreal build나 commit/push를 Git hook에 넣지 않는다. hook은 LFS 같은 기존 필수 동작을 유지하고, 무거운 검증은 이 명시적 pipeline으로 실행한다.

현재 wrapper는 UBT/UnrealEditor child process에 임의의 hard timeout을 걸지 않는다. 정상적인 장시간 compile을 잘못 종료하지 않기 위한 초기 정책이며, 실제 hang은 수동 중단 후 `Saved/Logs/Validation` 로그로 확인한다. 반복되는 hang 시간이 측정되면 별도 watchdog hardening으로 추가한다.
