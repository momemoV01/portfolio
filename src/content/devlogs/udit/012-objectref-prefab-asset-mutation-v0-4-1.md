---
title: 'ObjectRef writes + Prefab + Asset mutation → v0.4.1'
description: 'asset:guid 기반 ObjectReference set. Prefab instantiate/unpack/apply. Asset create/move/delete/label.'
pubDate: '2026-04-14'
seq: 12
type: 'feat'
commits: ['87ef711', '3959995', '46d6d1f', '9b74ceb']
tags: ['mutation', 'objectref', 'prefab', 'asset', 'v0.4.1', 'release']
draft: false
---

## Component ObjectReference writes

v0.4.0의 `component set`은 primitive만. 이번엔 **자산 참조** 처리:

```bash
udit component set \
  --id go:a3f9e8d2 \
  --type MeshRenderer \
  --field material \
  --value asset:def456
```

`asset:def456` = GUID 기반 자산 참조.

### 구현

ParamCoercion 확장:

```csharp
public static object Coerce(string raw, Type targetType) {
    if (typeof(UnityEngine.Object).IsAssignableFrom(targetType)) {
        if (raw.StartsWith("asset:")) {
            var guid = raw.Substring("asset:".Length);
            var path = AssetDatabase.GUIDToAssetPath(guid);
            if (string.IsNullOrEmpty(path)) {
                throw new CoerceException("UCI-300", $"Asset {guid} not found");
            }
            var obj = AssetDatabase.LoadAssetAtPath(path, targetType);
            if (obj == null) {
                throw new CoerceException("UCI-101", $"Asset is not a {targetType.Name}");
            }
            return obj;
        }
        if (raw.StartsWith("go:")) {
            // GameObject reference (씬 안)
            return StableIdRegistry.Instance.Resolve(raw);
        }
    }
    // ... primitive 분기 (이전과 동일)
}
```

### 사용 예

```bash
# Material 교체
udit component set --id go:player --type MeshRenderer --field material --value asset:hero-mat-guid

# Animator Controller 설정
udit component set --id go:player --type Animator --field runtimeAnimatorController --value asset:player-controller

# null 설정 (clear)
udit component set --id go:player --type MeshRenderer --field material --value null
```

### 타입 검증

대상 필드가 `Material` 타입인데 `asset:texture-guid` (Texture)로 set하면 fail:

```json
{
  "error_code": "UCI-101",
  "message": "Type mismatch: field 'material' expects Material, got Texture2D",
  "data": { "field": "material", "expected": "Material", "got": "Texture2D" }
}
```

## Prefab API

```bash
udit prefab instantiate --asset asset:hero-guid --parent go:scene-root
udit prefab unpack --id go:player --mode root           # 또는 outermost
udit prefab apply --id go:player                         # override를 prefab으로 push
udit prefab find-instances --asset asset:hero-guid       # 이 prefab의 모든 인스턴스
```

### Instantiate

```csharp
public static object Instantiate(string assetRef, string parentId, Vector3? position) {
    var path = AssetDatabase.GUIDToAssetPath(assetRef.Substring("asset:".Length));
    var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
    if (prefab == null) return notFound;
    
    var parent = parentId != null ? StableIdRegistry.Instance.Resolve(parentId)?.transform : null;
    var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab, parent);
    if (position.HasValue) instance.transform.localPosition = position.Value;
    
    Undo.RegisterCreatedObjectUndo(instance, "Instantiate Prefab");
    return new SuccessResponse(...) { Data = new { id = StableIdRegistry.Instance.GetOrCreate(instance) } };
}
```

### Unpack

prefab connection 끊기:

```bash
udit prefab unpack --id go:player --mode root         # 이 인스턴스만
udit prefab unpack --id go:player --mode outermost     # 루트 prefab까지
```

### Apply

instance에서 변경한 거 prefab 자체에 push:

```bash
udit prefab apply --id go:player                       # 모든 override
udit prefab apply --id go:player --properties weapon   # 특정 속성만
```

### Find-instances

prefab으로부터 인스턴스화된 모든 GO:
```json
{
  "data": {
    "instances": [
      { "id": "go:p1", "name": "Player_1", "scene": "Main" },
      { "id": "go:p2", "name": "Player_2", "scene": "Coop" }
    ],
    "count": 2
  }
}
```

대형 게임에서 "이 prefab 변경하면 영향받는 모든 곳" 파악.

## Asset mutation

디스크 변경:

```bash
udit asset create --type Material --path "Assets/NewMat.mat" --name "Test"
udit asset move --guid abc123 --new-path "Assets/Hero/Materials/Hero.mat"
udit asset delete --guid abc123 --confirm
udit asset label --guid abc123 --add Hero,Playable
udit asset label --guid abc123 --remove Test
```

### Create

```csharp
public static object Create(string typeName, string path, string name) {
    var type = ResolveType(typeName);
    var asset = ScriptableObject.CreateInstance(type) ?? Activator.CreateInstance(type);
    AssetDatabase.CreateAsset((Object)asset, path);
    AssetDatabase.SaveAssets();
    var guid = AssetDatabase.AssetPathToGUID(path);
    return new SuccessResponse(...) { Data = new { guid, path } };
}
```

### Delete

```bash
udit asset delete --guid abc123 --confirm
```

`--confirm` 필수 — Asset delete는 디스크 작업 + Undo 안 됨. 명시적 동의로만.

### Move

```bash
udit asset move --guid abc123 --new-path "Assets/Renamed.mat"
```

`AssetDatabase.MoveAsset()` 호출. references 자동 업데이트 (Unity가 GUID 기반 추적).

### Label

```bash
udit asset label --guid abc123 --add Hero,UI
udit asset label --guid abc123 --remove Test
udit asset label --guid abc123 --list
```

자산 라벨 = 검색용 메타데이터. `udit asset find --label Hero`와 페어.

## v0.4.1 릴리스

들어간 것:
- Component ObjectReference writes
- Prefab API (4종)
- Asset mutation (4종)

CRUD 거의 완성. 다음 v0.4.2 = transactions (이걸 묶기).

## 메모

**왜 asset:guid prefix를 쓰나**

GUID는 unique하지만 의미 없는 32자 hex. `asset:` 접두사로 "이건 자산 참조"임을 명시 + GUID와 short stable ID(`go:`) 충돌 방지.

미래 확장: `prefab:`, `scene:`, `comp:go:X/Rigidbody` 등.

**Asset delete를 Undo 못 하는 이유**

Unity의 `AssetDatabase.DeleteAsset` = 디스크 삭제. Editor의 Undo stack은 in-memory state만. 디스크 변경 되돌리려면 trash 시스템 필요 (별도 작업).

현재 정책: `--confirm` 강제 + 미래 trash 옵션 (`--soft-delete`) 검토.

## 다음

Transactions — 여러 명령을 단일 Undo unit으로 묶기. v0.4.2.
