---
title: 'Phase 1.2-1.3 — JSON envelope + Error Code Registry'
description: '모든 응답을 동일한 봉투 모양으로. error_code 레지스트리(UCI-xxx) 도입 — 한 번 할당한 코드는 영구. AI 에이전트가 파싱하기 좋게.'
pubDate: '2026-04-14'
seq: 3
type: 'feat'
commits: ['894d958', '657911b', 'bffd175']
tags: ['phase-1', 'json', 'error-codes', 'agent-friendly']
draft: false
---

## 왜 envelope이 중요한가

CLI는 사람이 보는 거 + 프로그램이 파싱하는 거 둘 다. 사람용은 자유로워도 되지만, **AI 에이전트가 받아쓸 때는 모양이 일정해야 함**.

Before — 명령마다 다른 모양:
```json
// editor play
{ "ok": true, "msg": "Entered play mode" }

// go find
{ "matches": ["Player", "Enemy1"], "count": 2 }

// asset references
[ "GUID-1", "GUID-2" ]    // 그냥 array
```

각 응답을 다른 코드 경로로 파싱해야 함. 에이전트 시스템 통합 비용 ↑.

## Phase 1.2: 통합 envelope

After:
```json
{
  "success": true,
  "message": "Entered play mode.",
  "data": null,
  "error_code": null
}
```

규칙:
- `success`: boolean — 항상 존재
- `message`: 사람이 읽을 한 줄 — 항상 존재
- `data`: 명령마다 다른 페이로드 — null 가능
- `error_code`: 실패 시 UCI-xxx, 성공 시 null

성공 케이스:
```json
{
  "success": true,
  "message": "Found 2 matches",
  "data": { "matches": ["Player", "Enemy1"], "count": 2 },
  "error_code": null
}
```

실패 케이스:
```json
{
  "success": false,
  "message": "GameObject 'Boss' not found",
  "data": null,
  "error_code": "UCI-042"
}
```

## `--json` 플래그 도입

기본 출력은 사람용 (테이블 / 컬러 / 단순화). `--json` 플래그 시 envelope 그대로:

```bash
udit go find --name "Player"
# Player [active]
#   path: /Root/Player
#   components: [Transform, Rigidbody]

udit go find --name "Player" --json
# {"success":true,"message":"Found 1 match","data":{"matches":[...]},"error_code":null}
```

`--json`은 **글로벌 플래그** (모든 명령에서 사용 가능). 이걸 일관성 있게 처리하려면 모든 명령 핸들러가 같은 wrapping 거쳐야 함 → `OutputWrapper` 헬퍼 도입.

## Phase 1.3: error code registry

### 목표

에러 코드는 **AI 에이전트가 retry 정책 결정**하는 핵심 정보. 사람이 "GameObject not found"를 읽고 retry 안 하는 것처럼, 에이전트도 코드 보고 결정 가능해야 함.

### 명명 규칙

```
UCI-NNN
^^^ ^^^
prefix sequential

UCI = Udit Connector / CLI
NNN = 001부터 순차 (절대 재사용 금지)
```

코드는 **abandoned되더라도 영구** — 한 번 할당한 의미 변경 안 함. SemVer "후방호환" 약속의 일부.

### 초기 카테고리

| 범위 | 의미 |
|------|------|
| UCI-001 ~ 099 | Connector 일반 (handler 예외, transport, etc.) |
| UCI-100 ~ 199 | Validation (잘못된 파라미터, 타입 불일치) |
| UCI-200 ~ 299 | State (Editor가 not in play mode 등 상태 기반 거부) |
| UCI-300 ~ 399 | Not Found (GameObject, Asset, Component, ...) |
| UCI-400 ~ 499 | Unity API errors (build failed, package conflict, ...) |
| UCI-500 ~ 599 | Reserved (확장) |

UCI-042는 **GameObject not found** — `udit go find --name "X"` 결과 0건일 때.  
UCI-043는 **Component not found** — `udit component get` 시 해당 타입 없을 때.

### ErrorResponse 객체

```csharp
public class ErrorResponse {
    public string Code { get; set; }       // "UCI-042"
    public string Message { get; set; }
    public Dictionary<string, object> Context { get; set; } // optional
}

// 사용
return new ErrorResponse {
    Code = "UCI-042",
    Message = $"GameObject '{name}' not found",
    Context = new Dictionary<string, object> {
        ["query"] = name,
        ["scope"] = "active scene",
    }
};
```

`Context`는 디버깅용 추가 정보. envelope의 `data` 필드로 들어감 → 에이전트가 "다른 씬도 검색해볼까" 결정 가능.

## docs(ERROR_CODES.md)

새 파일 `docs/ERROR_CODES.md` — 코드 마다 의미 + 예시 + 해결 힌트:

```markdown
## UCI-042: GameObject not found

**When:** `udit go find` returns 0 matches.

**Example:**
```json
{
  "success": false,
  "error_code": "UCI-042",
  "message": "GameObject 'Boss' not found",
  "data": { "query": "Boss", "scope": "active scene" }
}
```

**Common causes:**
- Object is in another scene (use `--all-scenes`)
- Object is inactive (use `--include-inactive`)
- Typo in name

**Recommended retry:**
- Yes, after fixing query (1 retry)
- Don't loop — root cause is usually input error
```

<aside class="callout callout-note">
<span class="callout-label">왜 코드 재사용 금지가 약속인가</span>

`UCI-042`가 한 번 "GameObject not found" 의미였다가 다음 버전에서 "Component not found"로 바뀌면, 그 코드를 보고 자동화 짜둔 사람의 모든 코드 깨짐. AI 에이전트 retry 정책도 무너짐. **번호는 싸지만 신뢰는 비싸다.**
</aside>

<aside class="callout callout-note">
<span class="callout-label">왜 envelope에 data 넣는가, 그냥 평탄화하지 않고?</span>

평탄화 (모든 필드를 top-level에) 하면 명령마다 top-level 필드가 다름 → 파싱 코드가 다 다름. envelope 안에 넣으면 항상 같은 4 필드만 보면 됨. 명령별 데이터는 `data` 안에서 자유.
</aside>

## 다음

Phase 1.4 — `.udit.yaml` 프로젝트 설정. 명령마다 `--port` 같은 거 매번 안 쳐도 되게.
