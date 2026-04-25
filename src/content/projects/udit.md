---
title: 'udit'
description: 'Unity Editor CLI — AI 에이전트 친화적 단일 바이너리 도구. unity-cli (DevBookOfArray)에서 포크하여 3일만에 v1.0.0까지 완성.'
pubDate: '2026-04-14'
updatedDate: '2026-04-16'
coverImage: '../../assets/blog-placeholder-3.jpg'
engine: 'Other'
platforms: ['PC']
tech: ['Go', 'C#', 'Unity', 'HTTP', 'Reflection', 'GitHub Actions']
role: 'Maintainer (fork & extend)'
duration: '3일 (fork → v1.0.0)'
status: 'released'
repoUrl: 'https://github.com/momemoV01/udit'
featured: true
---

## 개요

`udit`는 Unity Editor를 **명령줄에서** 제어하는 단일 바이너리 CLI 도구.  
[unity-cli](https://github.com/youngwoocho02/unity-cli)에서 포크하여 **AI 에이전트 워크플로우**에 맞게 확장.

> No server to run. No config to write. No process to manage. Just type a command.

이름 `Udit (उदित)` — 산스크리트어로 *risen*. 원작에 대한 존중 + 새로 일어선다는 의미.

## 왜 포크했나

기존 unity-cli의 코어 디자인이 매우 견고:

1. **HTTP 브리지** — `localhost:8590` 단순 POST. 양방향 RPC 안 해도 됨
2. **리플렉션 기반 도구 발견** — `[UnityCliTool]` 붙은 static 클래스 자동 등록
3. **하트비트 파일** — Connector 위치를 CLI에 알림
4. **도메인 리로드 핸들링** — Unity 컴파일 후에도 살아남기

이게 검증돼 있어서 **변형/확장에 100% 투자** 가능했음. 처음부터 만들었으면 며칠은 코어에 다 썼을 시간을, 위에 얹는 작업으로.

원작자 [DevBookOfArray](https://github.com/youngwoocho02)의 기여는 NOTICE.md에 풀 크레딧.

## 아키텍처

```
Terminal                              Unity Editor
────────                              ────────────
$ udit editor play --wait
    │
    ├─ scans ~/.udit/instances/*.json
    │  → finds Unity on port 8590
    │
    ├─ POST http://127.0.0.1:8590/command
    │  { "command": "manage_editor",
    │    "params": { "action": "play" }}
    │                                       │
    │                                  HttpServer 수신
    │                                  CommandRouter dispatch
    │                                  ManageEditor.HandleCommand()
    │                                       │
    └─ JSON 응답 ←─────────────────────────┘
       { "success": true,
         "message": "Entered play mode." }
```

- Unity Connector (C# 패키지)가 `localhost:8590`에 HTTP 서버 오픈
- 하트비트 파일로 CLI에 위치 알림
- 메인 스레드에서 `[UditTool]` 핸들러 자동 라우팅
- 도메인 리로드 생존
- 외부 의존성 0

---

## 3일 스프린트 회고

100+ 커밋, 14 릴리스, 3일. 핵심 흐름.

### Day 01 — 포크 + Phase 1 (Foundation)

**오전: 인프라**

`Initial fork` → `Rename attribute/asmdef files` → `ROADMAP.md`. 첫 한 시간에 v0.2.0 → v1.0.0까지의 단계별 success criteria 잡음. **로드맵을 먼저 그린 게 가장 결정적인 의사결정.** 이후 매 커밋이 어디로 가는지 명확.

**Phase 1.1 — Critical 픽스 4개**

업스트림에서 잠복 중이던 버그 일괄 처리. ExecuteCsharp의 reflection 누수, EditorScreenshot deprecation, CommandRouter의 panic 미처리, buildParams quoting. **새 명세 위에 쌓기 전 코어부터.**

**Phase 1.2-1.3 — JSON envelope + Error code registry**

모든 응답을 동일한 봉투 모양으로 통합:

```json
{
  "success": true,
  "message": "Entered play mode.",
  "data": null,
  "error_code": null
}
```

에러 코드 레지스트리 도입 — `UCI-NNN` 형식, **한 번 할당하면 영구**. AI 에이전트가 retry 정책 결정할 핵심 정보.

| 범위 | 의미 |
|------|------|
| UCI-001 ~ 099 | Connector 일반 |
| UCI-100 ~ 199 | Validation |
| UCI-200 ~ 299 | State precondition |
| UCI-300 ~ 399 | Not Found |
| UCI-400 ~ 499 | Unity API errors |
| UCI-500 ~ 599 | Reserved |

`UCI-042` = GameObject not found. `UCI-043` = Component not found.

**Phase 1.4-1.5 — `.udit.yaml` + 셸 자동완성 4종**

프로젝트 설정 파일로 매번 `--port --project` 반복 회피. cwd부터 거슬러 올라가며 탐색 (git처럼). bash/zsh/PowerShell/fish 모두 지원.

**Phase 1 wrap — Korean 문서 + Node 24 + sentinel markers**

공개 직전 정비. 자동완성 스크립트가 `.bashrc`에 누적 안 되도록 sentinel 주석으로 감싸기:

```bash
# >>>UDIT-COMPLETION-START<<<
_udit_complete() { ... }
# >>>UDIT-COMPLETION-END<<<
```

→ **release v0.2.1**. Phase 1 완성, fork 정착.

---

### Day 02 — API 폭발 + 운영성 (Mutation + Watch)

**Morning: Stable IDs + Read APIs (v0.3.0 → v0.3.1)**

`StableIdRegistry` 도입. Unity의 `InstanceID`는 도메인 리로드 후 변경되는 세션 한정 ID — 자동화의 적. `go:xxxxxxxx` 8자 hex로 안정 ID 발급:

```csharp
public string GetOrCreate(GameObject go) {
    var iid = go.GetInstanceID();
    if (instanceIdToStable.TryGetValue(iid, out var stable))
        return stable;
    stable = $"go:{Guid.NewGuid().ToString("N")[..8]}";
    instanceIdToStable[iid] = stable;
    return stable;
}
```

도메인 리로드 후 `GlobalObjectId` 백업으로 재매핑. 모든 후속 기능(트랜잭션, watch, pagination)의 기반.

이 위에:
- **Scene API** (`list/active/open/save/reload + tree`) — 핵심은 `tree`로 hierarchy 통째 직렬화
- **GameObject 쿼리** (`find/inspect/path`) — pagination + Levenshtein suggestions
- **Component 쿼리** (`list/get/schema`) — 리플렉션으로 필드 노출
- **Asset 쿼리** (`find/inspect/dependencies/references`) — 자산 그래프 양방향

**Afternoon: Mutation (v0.4.0 → v0.4.2)**

쓰기 단계. 모든 mutation은 **Undo 통합** — `Object.DestroyImmediate` 대신 `Undo.DestroyObjectImmediate`. 사용자가 마음에 안 들면 Ctrl+Z 한 번. 자동화의 안전망.

- GameObject mutation (5종) + Component mutation (4종)
- ObjectReference writes (`asset:guid` prefix로 자산 참조)
- Prefab API (instantiate/unpack/apply/find-instances)
- Asset mutation (create/move/delete/label)
- **Transactions** — `tx begin/commit/rollback`. 여러 명령을 단일 Undo group으로 묶음

```bash
udit tx begin "Spawn Boss"
udit go create --name "Boss"
udit component add --id go:X --type BossAI
udit component set --id go:X --type BossAI --field hp --value 1000
udit tx commit
# Editor의 Undo 스택: "Spawn Boss" 1 entry
```

**Evening: 프로젝트 lifecycle (v0.4.3 → v0.6.0)**

- **Project** (`info/validate/preflight`) — CI 통합 가능 시점
- **Test runner** (`udit test run --output junit.xml`) — JUnit XML 표준 출력
- **Package management** (UPM 통합 6종)
- **Build subsystem** (player + IL2CPP + presets + Addressables + cancel)
- **Watch 시스템 4 슬라이스** (v0.6.0):
  1. Types + Matcher + Ignore (Unity Library/ 자동 제외)
  2. fsnotify walker + Debouncer + .meta collapse
  3. Queue runner + Circuit breaker (콜백 폭주 차단)
  4. CLI wiring + 색깔 출력

`.meta` GUID를 업스트림과 영구 분리 (둘 다 설치 시 충돌 방지). **포크의 진짜 독립성**.

**Late: 고급 직렬화 + 보안 (v0.9.0 → v0.10.0)**

Component-set이 Unity의 까다로운 타입을 다루도록 4 슬라이스로 확장:

1. **AnimationCurve** — 키프레임 + 탄젠트 + WrapMode
2. **Gradient** — color/alpha keys 분리
3. **Scene references** — GUID + fileID 페어
4. **ManagedReference** — `[SerializeReference]` polymorphic

각 슬라이스 독립 PR — 1000줄 한 PR보다 100~200줄 4 PR이 회복 가능.

병행으로:
- **Sprint 3 — 10k GameObject 벤치마크**: 모든 쿼리 1초 미만 검증

| Query | 평균 ms |
|-------|--------:|
| `scene tree` | 550 |
| `go find` (10k) | 760 |
| `asset references` | 960 |
| `asset dependencies` | 440 |

- **v0.9.1 보안 하드닝**: Go 1.26, Dependabot, SECURITY.md (trust model 명문화)
- **리팩토링**: `cmd/root.go` 3분할 (help/params/output), `ManageComponent.cs` 3 partial로 분리, `TryParseVector3` 통합
- **v0.10.0**: `install.sh`/`install.ps1`이 셸 자동완성도 같이 자동 설치

→ Day 02 끝. 14 릴리스 도달.

---

### Day 03 — v1.0 Sweep + 릴리스

**D1-D8: Pre-release 청소**

API 동결 직전 마지막 자유 변경 기회.

- **D1**: Deprecated API 제거 (이전 minor에서 예고된 항목들)
- **D2**: 명령 surface 동결 (이름/플래그 최종)
- **D3**: 에러 코드 audit — UCI-xxx 표를 `docs/ERROR_CODES.md`에 박음. **이 표가 약속 자체**
- **D4**: JSON envelope 일관성 검사 (CI linter)
- **D5**: 응답 필드 이름 동결 (`data.matches`, `data.count`, `data.has_more` 등)
- **D6-D8**: 도움말 typo, `--help` 검증, 종료 코드 일관

**R1-R5: 마지막 리팩토링 라운드**

작은 파일 통합, 변수 명명 일관, package 평탄화, comment 정비, 죽은 코드 제거. 1.0 이후엔 internal 변경도 신경 써야 (API 노출 가능성).

**보안 layer 마무리**

`udit update`에 SHA256 체크섬 검증 추가:
1. release notes에서 sha256 hash 추출
2. 다운받은 바이너리 hash 계산  
3. 미스매치 → abort, 임시 파일 삭제, atomic rename으로 부분 교체 차단

GitHub Actions에서 매 release마다 자동 체크섬 생성:

```yaml
- name: Build
  run: |
    GOOS=linux GOARCH=amd64 go build -o udit-linux-amd64 .
    sha256sum udit-linux-amd64 > udit-linux-amd64.sha256
```

**README 슬리밍 + 문서 분할**

9KB README → 3KB. 첫 방문자 30초 안에 가치 명제 + 설치 + 빠른 시작 다 보이게. 풀 레퍼런스/가이드/쿡북은 `docs/`로 분리:

| 파일 | 역할 |
|------|------|
| `docs/COMMANDS.md` | 풀 레퍼런스 |
| `docs/CUSTOM_TOOLS.md` | `[UditTool]` 작성 가이드 |
| `docs/COOKBOOK.md` | 워크플로우 레시피 |
| `docs/ERROR_CODES.md` | UCI 레지스트리 (재사용 금지) |
| `docs/ROADMAP.md` | 결정 로그 |

**🎉 release v1.0.0**

---

## v1.0 안정성 약속

| Surface | Stable from v1.0 |
|---------|------------------|
| CLI 명령 / 서브명령 이름 | ✅ |
| CLI 플래그 이름 | ✅ |
| JSON envelope shape | ✅ |
| 에러 코드 (UCI-xxx) | ✅ 절대 재사용 금지 |
| 응답 필드 이름 | ✅ |

minor 버전에서 **후방호환 추가만**, major에서만 breaking (deprecation 절차 거친 후).

## 명령어 카테고리

| Category | Commands |
|----------|----------|
| **Editor** | `play / stop / pause / refresh` |
| **Scene** | `list / open / save / tree` |
| **GameObject** | `find / inspect / create / move / rename` |
| **Component** | `list / get / set / add / remove / copy` |
| **Asset** | `find / inspect / dependencies / references / guid` |
| **Prefab** | `instantiate / unpack / apply / find-instances` |
| **Build** | `player --il2cpp / --config <preset> / addressables / cancel` |
| **Test** | EditMode / PlayMode 실행 + JUnit XML |
| **Profiler** | enable / disable / hierarchy |
| **Exec** | `udit exec "<C# 코드>"` |
| **Automation** | `log tail` (SSE) / `watch` / `run <task>` / `tx begin/commit` |

## 커스텀 도구 확장

`[UditTool]` attribute 붙은 static 클래스를 Editor 어셈블리에 두면 Connector가 자동 발견:

```csharp
[UditTool(Name = "spawn", Description = "Spawn an enemy")]
public static class SpawnEnemy
{
    public static object HandleCommand(JObject parameters)
    {
        var p = new ToolParams(parameters);
        float x = p.GetFloat("x", 0);
        var prefab = Resources.Load<GameObject>(p.Get("prefab", "Enemy"));
        var go = Object.Instantiate(prefab, new Vector3(x, 0, 0), Quaternion.identity);
        return new SuccessResponse("Spawned", new { name = go.name });
    }
}
```

```bash
udit spawn --x 5 --prefab Goblin
```

라우터 코드 안 건드려도 됨. 리플렉션이 알아서 발견.

---

## 핵심 설계 결정

**왜 포크?** unity-cli의 4 designs (HTTP 브리지, 리플렉션, 하트비트, 도메인 리로드)가 검증된 상태. 코어 재구현 비용 대신 변형에 투자.

**왜 JSON envelope?** AI 에이전트가 명령마다 다른 모양 파싱하는 비용 ↑. 한 envelope에 `data` 필드로 명령별 페이로드 격리.

**왜 stable IDs?** Unity `InstanceID`는 도메인 리로드 후 변경. 자동화에서 1단계 ID → 2단계 사용 사이 컴파일 일어나면 깨짐. 8자 hex stable ID + GlobalObjectId 백업.

**왜 슬라이스 단위 릴리스?** v0.9.0의 component-set 직렬화를 4 슬라이스로 쪼갠 게 결정적. 1000줄 한 PR이면 검증 어려움. 슬라이스 단위 = 각각 검증 가능, 회복 가능.

**왜 모든 mutation에 Undo 통합?** 자동화의 가장 큰 위험 = 잘못된 변경. `Undo.RecordObject` 강제로 **모든 udit 동작이 reversible**. 사용자 신뢰 기반.

**왜 SemVer 약속?** v1.0 = "이 surface 안 부숨"의 약속. 이게 도구가 외부에서 진지하게 사용 가능한 시점. 약속 한 번 어기면 모든 신뢰 무너짐.

---

## 회고

3일 짜리 스프린트치고 안정적. 핵심 인사이트:

**1. 포크의 강점**  
코어가 검증된 상태에서 시작 → 변형/확장에 100% 시간 투자. 처음부터 만들었으면 며칠은 HTTP 브리지/리플렉션/하트비트 디자인에 다 썼을 것.

**2. ROADMAP 먼저**  
Day 01에 v1.0까지의 단계별 계획 그린 게 가장 결정적. 매 커밋마다 "다음에 뭘 할까" 의사결정 비용 ↓. 큰 그림 명확하니 매 커밋 위치 확실.

**3. 슬라이스 단위 릴리스**  
v0.9.0을 4 슬라이스, watch 시스템을 4 슬라이스로 쪼갠 게 회복 가능성 확보. 검증 가능한 단위 = 안전망.

**4. AI 페어 프로그래밍**  
Claude Opus 4.6과 페어. 모든 커밋에 `Co-Authored-By` 명시. 컨텍스트 손실 없이 동시 진행. 의사결정 의문 발생 시 즉시 토의 — 혼자였으면 한 시간 헤맸을 거.

**5. 외부 약속의 무게**  
v1.0 = SemVer = "이 약속 어기면 모든 신뢰 무너짐". 그래서 1.0 진입은 신중. D1-D8 + R1-R5 시리즈는 그 신중함의 표시.

---

## v1.x 다음 단계

1.0 이후 후방호환으로 추가될 항목들:

**테스트** — Connector NUnit 커버리지 확장

**문서** — Cookbook 20개, 자동 생성 Tool Reference, Migration 가이드

**보안 audit** — heartbeat 0600 권한, GitHub Actions SHA pinning, macOS 코드 서명, menu blacklist, exec audit log

**Cross-cutting** — `api_version` 필드, auto pagination, ID prefixes 보강 (`prefab:`, `comp:`), `--output yaml/csv`

**기능** — 실시간 build progress (현재 끝나야만 결과), watch 스트레스 테스트, `udit context` (환경 요약), `udit explain <UCI-042>` (에러 코드 설명)

전부 후방호환 추가. v1.x 라인 안에서 가능. **앞으로의 진행은 [devlog 섹션](#devlogs)에 추적.**

---

## 마침

> 3일 + AI 페어 + 좋은 포크 = SemVer 1.0 도달.

modern dev workflow의 효율. unity-cli 원작자에게 다시 한 번 감사. 그 뼈대 없이 여기까지 못 옴.
