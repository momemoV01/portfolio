---
title: 'Component + Asset 쿼리 → v0.3.1'
description: 'Component list/get/schema (UCI-043). Asset find/inspect/dependencies/references/guid/path. 프로젝트 메타데이터 풀 노출.'
pubDate: '2026-04-14'
seq: 10
type: 'feat'
commits: ['df2b7fa', '194ddde', '5e69937']
tags: ['component', 'asset', 'query', 'v0.3.1', 'release']
draft: false
---

## Component 쿼리

```bash
udit component list --id go:a3f9e8d2          # GO에 붙은 컴포넌트
udit component get --id go:a3f9e8d2 --type Rigidbody    # 단일 컴포넌트 필드
udit component schema --type Rigidbody         # 어떤 필드가 가능한지
```

### `component list`

```json
{
  "data": {
    "components": [
      { "type": "Transform", "enabled": true },
      { "type": "Rigidbody", "enabled": true },
      { "type": "PlayerController", "enabled": true, "script": "Assets/Scripts/PlayerController.cs" },
      { "type": "<missing>", "enabled": false, "fileID": -1 }   // missing script
    ]
  }
}
```

`<missing>` 케이스: 스크립트 삭제됐는데 GO에 컴포넌트 참조 남은 경우. 디버깅용.

### `component get`

```bash
udit component get --id go:a3f9e8d2 --type Rigidbody
```

```json
{
  "data": {
    "type": "Rigidbody",
    "enabled": true,
    "fields": {
      "mass": 1.0,
      "drag": 0.0,
      "angularDrag": 0.05,
      "useGravity": true,
      "isKinematic": false,
      "interpolation": "None",
      "collisionDetectionMode": "Discrete",
      "constraints": "None"
    }
  }
}
```

리플렉션으로 모든 public + `[SerializeField]` 가져옴. 직렬화 가능한 것만 노출.

### `component schema`

```bash
udit component schema --type Rigidbody
```

```json
{
  "data": {
    "type": "Rigidbody",
    "namespace": "UnityEngine",
    "assembly": "UnityEngine.PhysicsModule",
    "fields": [
      { "name": "mass", "type": "Single", "default": 1.0 },
      { "name": "drag", "type": "Single", "default": 0.0 },
      { "name": "interpolation", "type": "RigidbodyInterpolation", "values": ["None", "Interpolate", "Extrapolate"] },
      ...
    ]
  }
}
```

AI 에이전트가 "이 컴포넌트 어떤 필드 받지?" 자가 발견. 사용자 코드 (`PlayerController`)도 동일하게 동작.

### UCI-043: Component Not Found

```bash
udit component get --id go:a3f9e8d2 --type "Riggidbody"  # 오타
```

```json
{
  "error_code": "UCI-043",
  "message": "Component 'Riggidbody' not found on go:a3f9e8d2",
  "data": {
    "available": ["Transform", "Rigidbody", "PlayerController"],
    "suggestions": ["Rigidbody"]  // Levenshtein 매치
  }
}
```

UCI-042와 같은 패턴. **available** 필드가 결정적 — 사용자가 "어떤 게 있나" 즉시 알 수 있음.

## Asset 쿼리

프로젝트 자산 단위:
```bash
udit asset find --type Texture2D                   # 타입별 검색
udit asset find --label Hero                       # 라벨
udit asset find --path "Assets/Characters/**"      # 경로 패턴
udit asset inspect --guid abc123                   # 단일 자산
udit asset dependencies --guid abc123              # 이 자산이 참조하는 것들
udit asset references --guid abc123                # 이 자산을 참조하는 것들
udit asset guid --path "Assets/Player.prefab"      # path → guid
udit asset path --guid abc123                      # guid → path
```

### Inspect

```json
{
  "data": {
    "guid": "abc123",
    "path": "Assets/Characters/Hero.prefab",
    "type": "GameObject",     // prefab은 GameObject
    "size_bytes": 4096,
    "labels": ["Hero", "Playable"],
    "asset_bundle": null,
    "addressable": false,
    "main_object_name": "Hero",
    "sub_assets": []
  }
}
```

### Dependencies

```bash
udit asset dependencies --guid abc123 --recursive
```

```json
{
  "data": {
    "direct": [
      { "guid": "def456", "path": "Materials/Hero.mat" },
      { "guid": "ghi789", "path": "Animations/HeroIdle.controller" }
    ],
    "transitive": [
      { "guid": "jkl012", "path": "Textures/Hero_Albedo.png" },
      ...
    ],
    "total": 8
  }
}
```

전체 프로젝트 스캔 (~1초). 이거로 "이 prefab이 어떤 자산들 끌고 있나" 한 줄.

### References

```bash
udit asset references --guid abc123
```

이게 더 비쌈 — **모든 자산 스캔**해서 누가 참조하는지. 10k 자산 프로젝트에서 ~960ms.

용도: "이 텍스처 안 쓰는 거 같은데 정말 안 써?" 검증. 0건이면 안전하게 삭제 가능.

## v0.3.1 릴리스

들어간 것:
- Component 쿼리 (list/get/schema)
- UCI-043
- Asset 쿼리 (find/inspect/deps/refs/guid/path)

읽기 표면 거의 완성. **이제 mutation 단계**.

## 메모

**왜 component schema 명령이 있나**

스키마 알면 mutation이 안전해짐 — 잘못된 필드 set 시도 전에 검증 가능. AI 에이전트가 schema 한 번 받고 → field 5개 set → 모두 검증된 상태.

**dependencies vs references 비대칭**

방향 다름:
- dependencies: A → B (A가 B 끌고 있음)
- references: B ← A (A가 B를 가리킴) — 역방향 검색

다른 Unity 도구도 이 두 개 분리. 이름이 헷갈리지만 표준 따름.

## 다음

쓰기 단계 시작 — GameObject mutation. v0.4.0.
