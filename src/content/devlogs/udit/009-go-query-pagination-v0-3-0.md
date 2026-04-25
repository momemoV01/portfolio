---
title: 'GameObject 쿼리 + 페이지네이션 → v0.3.0'
description: 'go find/inspect/path. UCI-042 (Not Found) 일관성. 큰 씬 페이지네이션. v0.3.0 릴리스.'
pubDate: '2026-04-14'
seq: 9
type: 'feat'
commits: ['6a2d929', '302a9cb']
tags: ['gameobject', 'query', 'pagination', 'v0.3.0', 'release']
draft: false
---

## 3 명령

```bash
udit go find --name "Player"           # name 매치 검색
udit go inspect --id go:a3f9e8d2       # 단일 GameObject 상세
udit go path --id go:a3f9e8d2          # 부모 chain (Root/.../Player)
```

### `find`

다중 필터 조합:
```bash
udit go find --name "Enemy*"                          # 와일드카드
udit go find --tag Player                             # 태그
udit go find --layer 8                                # 레이어
udit go find --component "Rigidbody"                  # 컴포넌트 보유
udit go find --name "Boss" --component "BossAI"       # AND
udit go find --include-inactive                       # 비활성 포함
udit go find --all-scenes                             # 모든 로드된 씬
```

### `inspect`

`tree` 한 노드를 더 깊이:
```json
{
  "data": {
    "id": "go:a3f9e8d2",
    "name": "Player",
    "tag": "Player",
    "layer": 8,
    "active_self": true,
    "active_in_hierarchy": true,
    "static_flags": ["Editor Only"],
    "transform": {
      "position": [0, 1, 0],
      "rotation": [0, 0, 0, 1],
      "scale": [1, 1, 1]
    },
    "components": [
      {
        "name": "Transform",
        "fields": { ... }
      },
      {
        "name": "Rigidbody",
        "fields": {
          "mass": 1.0,
          "drag": 0.0,
          ...
        }
      }
    ],
    "parent": "go:b1c2d4e5",
    "children": ["go:c5d6e7f8"]
  }
}
```

### `path`

```bash
udit go path --id go:a3f9e8d2
# /World/Players/Team1/Player
```

부모-자식 체인 한 줄로. 디버깅 + 검색 결과 컨텍스트 제공.

## UCI-042: GameObject Not Found

명시적 에러 코드:
```json
{
  "success": false,
  "error_code": "UCI-042",
  "message": "GameObject 'Boss' not found",
  "data": {
    "query": "Boss",
    "scope": "active scene",
    "include_inactive": false,
    "suggestions": ["Boss1", "BossSpawner"]   // soft match 힌트
  }
}
```

### Suggestions

쿼리가 0건이면 자동으로 **유사 이름** 3개까지 제안. Levenshtein 거리 기반:

```csharp
public List<string> Suggest(string query, int maxResults = 3) {
    var allNames = FindAllGameObjects().Select(g => g.name).Distinct();
    return allNames
        .Select(n => new { Name = n, Distance = Levenshtein(query, n) })
        .Where(x => x.Distance <= 3 || x.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
        .OrderBy(x => x.Distance)
        .Take(maxResults)
        .Select(x => x.Name)
        .ToList();
}
```

오타 한 글자면 거의 매칭. AI 에이전트가 이 힌트로 retry 결정.

## 페이지네이션

10k 씬에서 `udit go find --component "Transform"` = 10k 결과. 응답 크기 폭발.

```bash
udit go find --component "Transform" --limit 50 --offset 0
udit go find --component "Transform" --limit 50 --offset 50
udit go find --component "Transform" --limit 50 --cursor "abc123"   # 커서 기반 (선택)
```

응답:
```json
{
  "data": {
    "matches": [...],         // 50건
    "count": 50,              // 이번 페이지
    "total": 10762,           // 전체 (limit 무시)
    "offset": 0,
    "limit": 50,
    "has_more": true,
    "next_offset": 50
  }
}
```

### Cursor vs Offset

기본은 offset (Unity의 enumeration이 stable함, 한 세션 동안). 큰 씬에서 mutation 가능성 있으면 cursor (stable ID 기반) 권장:

```bash
udit go find --component Transform --cursor go:a3f9e8d2 --limit 50
# go:a3f9e8d2 다음 GO부터 50개
```

cursor 기반은 mutation에 강함 (offset 4번이 다음 실행 시 다른 GO일 수 있지만, cursor는 이름 그대로).

## 성능

10k 씬:

| Operation | ms |
|-----------|---:|
| `go find --name X` (매칭 없음) | ~140 |
| `go find --name X` (1만 매칭, limit 50) | **~760** |
| `go inspect` (single GO, components shallow) | ~450 |
| `go path` | ~80 |

10k 매칭 케이스가 가장 느림 — Unity가 모든 GO 순회 비용. 이건 Unity API 한계.

개선 아이디어 (미래):
- Indexed cache (이름 → GO list pre-build)
- 변경 알림 시 invalidation
- 미루어두기 (premature optimization)

## v0.3.0 릴리스

들어간 것:
- StableIdRegistry (007)
- Scene API + tree (008)
- GameObject query + pagination (이번)
- UCI-042 error code

이게 **읽기 명령 완결**. v0.3.x 시리즈에서 더 채울 수도 있고, 바로 v0.4 mutation으로 넘어갈 수도. 결정: **읽기는 여기까지**, 다음은 쓰기.

<aside class="callout callout-note">
<span class="callout-label">왜 페이지네이션을 v0.3에 넣나</span>

큰 씬에서 `find`가 메가바이트 응답이면 SSE/streaming 필요. 페이지네이션이 더 단순. 우선 단순한 것부터.
</aside>

<aside class="callout callout-note">
<span class="callout-label">suggestions가 클라이언트 사이드 아니라 서버 측인 이유</span>

Unity 안에서 실행 → 모든 GO 이름 알고 있음. CLI는 query 1개만 보냄. Levenshtein를 클라가 하려면 모든 이름 다운로드 → 큼. 서버에서 결정.
</aside>

## 다음

Component 쿼리 (list/get/schema). UCI-043 도입. v0.3.1.
