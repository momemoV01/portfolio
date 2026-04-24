---
title: 'Scene API — list/active/open/save/reload + tree'
description: '씬 단위 명령 6종. tree는 stable ID로 hierarchy 통째로 직렬화. AI 에이전트가 씬 구조를 한눈에 파악.'
pubDate: '2026-04-14'
seq: 8
type: 'feat'
commits: ['570b178', '8840341']
tags: ['scene', 'hierarchy', 'tree']
draft: false
---

## Scene 단위 명령 5종

기본 CRUD:
```bash
udit scene list           # 빌드 세팅에 등록된 모든 씬
udit scene active          # 현재 active 씬
udit scene open <path>     # 씬 열기
udit scene save            # 현재 씬 저장
udit scene reload          # 디스크에서 다시 로드
```

각각 실행 비용 다름:
- `list`: 디스크 스캔 (싸다)
- `active`: in-memory (즉시)
- `open`: 디스크 I/O + 도메인 리로드 (~1-3초)
- `save`: I/O + serialization (~0.5-2초)
- `reload`: dirty 상태 폐기 + reload (위험, `--confirm` 플래그 필수)

### `scene reload`의 confirm

```bash
udit scene reload
# UCI-201: Scene has unsaved changes. Use --confirm to discard.

udit scene reload --confirm
# Reloaded scene 'Main.unity' from disk.
```

이건 **데이터 손실 위험** 있는 명령. 기본 거부, 명시 동의로만 진행.

## `scene tree` — hierarchy 직렬화

핵심 명령. 활성 씬의 전체 계층 구조를 JSON으로:

```bash
udit scene tree --json
```

```json
{
  "success": true,
  "data": {
    "scene_name": "Main",
    "scene_path": "Assets/Scenes/Main.unity",
    "roots": [
      {
        "id": "go:a3f9e8d2",
        "name": "Camera",
        "active": true,
        "components": ["Transform", "Camera", "AudioListener"],
        "children": []
      },
      {
        "id": "go:b1c2d4e5",
        "name": "Player",
        "active": true,
        "components": ["Transform", "CharacterController", "PlayerController"],
        "children": [
          {
            "id": "go:c5d6e7f8",
            "name": "Mesh",
            "components": ["Transform", "MeshFilter", "MeshRenderer"],
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 직렬화 깊이 제어

```bash
udit scene tree --depth 1     # roots만
udit scene tree --depth 3     # 3 레벨
udit scene tree                # 전체 (10k까지 1초 내)
```

### 컴포넌트 표시

기본은 컴포넌트 **이름만** (가벼움). 필드 값까지 원하면:

```bash
udit scene tree --components-detail
# components: [{name: "Transform", fields: {position: [0,1,0], ...}}, ...]
```

크기 폭발하니 일반적으로 안 씀.

## go: ID 통합

Scene 명령들이 응답하는 모든 GameObject가 stable ID 가짐. 이걸로 직접 다음 명령:

```bash
udit scene tree | jq '.data.roots[1].id'
# "go:b1c2d4e5"

udit go inspect --id go:b1c2d4e5
# Player 상세
```

명령 chain 가능 → 자동화 핵심.

## 성능

10k GameObject 씬에서:

| Command | ms |
|---------|---:|
| `scene list` | 12 |
| `scene active` | 3 |
| `scene tree --depth 1` | 8 |
| `scene tree` (전체) | **~550** |
| `scene tree --components-detail` | ~2400 |

`tree` 풀 트리 < 1초. 10k는 큰 씬 임계값.

## 구현 노트

### Hierarchy walk

```csharp
public class SceneTreeBuilder {
    public Dictionary<string, object> Build(Scene scene, int maxDepth = -1) {
        var roots = scene.GetRootGameObjects();
        return new Dictionary<string, object> {
            ["scene_name"] = scene.name,
            ["scene_path"] = scene.path,
            ["roots"] = roots.Select(go => Walk(go, 0, maxDepth)).ToList(),
        };
    }
    
    private object Walk(GameObject go, int depth, int maxDepth) {
        var node = new Dictionary<string, object> {
            ["id"] = StableIdRegistry.Instance.GetOrCreate(go),
            ["name"] = go.name,
            ["active"] = go.activeInHierarchy,
            ["components"] = go.GetComponents<Component>()
                .Select(c => c?.GetType().Name ?? "<missing>")
                .ToList(),
        };
        
        if (maxDepth < 0 || depth < maxDepth) {
            var children = new List<object>();
            for (int i = 0; i < go.transform.childCount; i++) {
                children.Add(Walk(go.transform.GetChild(i).gameObject, depth + 1, maxDepth));
            }
            node["children"] = children;
        }
        
        return node;
    }
}
```

직선적. 핵심은 `<missing>` 처리 — destroy 직후 컴포넌트는 null reference 가능. 방어적으로.

### Active scene 결정

빌드 세팅엔 여러 씬 있을 수 있음. `tree`는 **현재 로드되고 active한 씬** 1개만. 멀티 씬 모드는 별도 명령(`udit scene multi-tree`) 미래 추가.

## 메모

**왜 tree가 핵심인가**

CLI 도구의 1차 가치는 "현재 상태 보기". `git status`, `kubectl get pods`, `docker ps` 같은 거. udit는 `scene tree` — 한 명령으로 씬 전체 파악.

이게 빠르면 (1초 내) 자동화/탐색 매끄러움. 느리면 매 단계가 답답. **벤치마크 1초**가 의미 있는 이유.

**왜 컴포넌트 이름만 기본?**

10k GO × 평균 5 컴포넌트 × 평균 10 필드 = 500k 필드. JSON 직렬화하면 메가바이트 단위. 기본은 가볍게, 깊이는 옵션으로.

## 다음

GameObject 쿼리 — `find`, `inspect`, `path`. 페이지네이션 (UCI-042). v0.3.0 릴리스의 핵심.
