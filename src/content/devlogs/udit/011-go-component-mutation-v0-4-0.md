---
title: 'GameObject + Component Mutation → v0.4.0'
description: 'create/destroy/move/rename/setactive (GO). add/remove/set/copy (Component). Undo 통합. 진정한 자동화 시작.'
pubDate: '2026-04-14'
seq: 11
type: 'feat'
commits: ['7451c77', 'da9a282', '64ea1a5']
tags: ['mutation', 'gameobject', 'component', 'undo', 'v0.4.0', 'release']
draft: false
---

## v0.4 — 쓰기의 시작

읽기만으론 자동화 못 함. v0.4 = mutation. **이게 udit의 진짜 가치**.

## GameObject Mutation

```bash
udit go create --name "NewEnemy" --parent go:a3f9e8d2
udit go destroy --id go:b1c2d4e5
udit go move --id go:b1c2d4e5 --parent go:c5d6e7f8
udit go rename --id go:b1c2d4e5 --name "Boss"
udit go setactive --id go:b1c2d4e5 --active false
```

### Create

```bash
udit go create \
  --name "Enemy_01" \
  --parent go:a3f9e8d2 \
  --position 10,0,5 \
  --components Transform,Rigidbody,EnemyController
```

응답:
```json
{
  "data": {
    "id": "go:newxxx12",
    "name": "Enemy_01",
    "parent": "go:a3f9e8d2",
    "components_added": ["Rigidbody", "EnemyController"],
    "transform": { "position": [10, 0, 5], "rotation": [...], "scale": [1,1,1] }
  }
}
```

새 GO도 즉시 stable ID 가짐. 다음 명령에서 사용 가능.

### Destroy

```bash
udit go destroy --id go:b1c2d4e5
udit go destroy --id go:b1c2d4e5 --include-children false   # 자식 보존 (자식이 부모로 이동)
```

destroy는 **Undo 통합** — `Cmd/Ctrl+Z`로 되돌릴 수 있음:

```csharp
public static object Destroy(string id, bool includeChildren = true) {
    var go = StableIdRegistry.Instance.Resolve(id);
    if (go == null) return new ErrorResponse { Code = "UCI-300", Message = "..." };
    
    if (!includeChildren) {
        // 자식들을 부모로 이동
        var parent = go.transform.parent;
        for (int i = go.transform.childCount - 1; i >= 0; i--) {
            Undo.SetTransformParent(go.transform.GetChild(i), parent, "Reparent");
        }
    }
    
    Undo.DestroyObjectImmediate(go);   // ← Undo 스택에 등록
    return new SuccessResponse(...);
}
```

핵심: `Object.DestroyImmediate` 대신 `Undo.DestroyObjectImmediate`. 사용자가 mistake했으면 Ctrl+Z 한 번으로 복구.

### Move (reparent)

```bash
udit go move --id go:b1c2d4e5 --parent go:c5d6e7f8
udit go move --id go:b1c2d4e5 --parent null   # root로
udit go move --id go:b1c2d4e5 --sibling-index 0   # 첫 번째로
```

```csharp
Undo.SetTransformParent(go.transform, newParent?.transform, "Reparent");
if (siblingIndex >= 0) go.transform.SetSiblingIndex(siblingIndex);
```

### Rename / SetActive

단순한 mutation. Undo 통합:
```csharp
Undo.RecordObject(go, "Rename");
go.name = newName;

Undo.RecordObject(go, "SetActive");
go.SetActive(active);
```

## Component Mutation

```bash
udit component add --id go:a3f9e8d2 --type Rigidbody
udit component remove --id go:a3f9e8d2 --type Rigidbody
udit component set --id go:a3f9e8d2 --type Rigidbody --field mass --value 2.5
udit component copy --from go:a3f9e8d2 --to go:b1c2d4e5 --type Rigidbody
```

### Set

가장 복잡. 필드 타입에 따라 분기:

```bash
udit component set --id go:X --type Transform --field position --value "1,2,3"
udit component set --id go:X --type Rigidbody --field useGravity --value true
udit component set --id go:X --type MeshRenderer --field material --value asset:def456
```

**ParamCoercion** 헬퍼가 string → 적절한 타입 변환. v0.9.0에서 더 확장 (AnimationCurve, Gradient 등) 예정. 지금은 primitive + Vector + ObjectReference만.

### Add

```csharp
public static object Add(string id, string typeName) {
    var go = StableIdRegistry.Instance.Resolve(id);
    var type = ResolveType(typeName);   // "Rigidbody" → typeof(Rigidbody)
    
    if (go.GetComponent(type) != null) {
        // 이미 있음 — 거부 OR 새 인스턴스 (대부분 컴포넌트는 하나만)
        return new ErrorResponse { Code = "UCI-401", Message = "..." };
    }
    
    Undo.AddComponent(go, type);
    return new SuccessResponse(...);
}
```

### Copy

다른 GO로 컴포넌트 복제:

```csharp
public static object Copy(string fromId, string toId, string type) {
    var fromGo = ...; var toGo = ...;
    var fromComp = fromGo.GetComponent(type);
    if (fromComp == null) return notFound;
    
    UnityEditorInternal.ComponentUtility.CopyComponent(fromComp);
    
    var existing = toGo.GetComponent(type);
    if (existing != null) {
        UnityEditorInternal.ComponentUtility.PasteComponentValues(existing);
    } else {
        UnityEditorInternal.ComponentUtility.PasteComponentAsNew(toGo);
    }
    return new SuccessResponse(...);
}
```

`ComponentUtility`는 internal API지만 안정적 (수년 변경 없음).

## Undo 통합 정책

모든 mutation 명령은:
1. `Undo.RecordObject(target, "...")` 호출 (state 변경 전)
2. 또는 `Undo.AddComponent` / `Undo.DestroyObjectImmediate` (구조 변경)
3. `Undo.PerformGroup` 자동 (트랜잭션은 v0.4.2에서)

사용자가 Editor 안에서 Ctrl+Z 한 번 → udit가 한 변경 되돌림.

**이게 신뢰의 기반**. AI 에이전트가 자동 변경 → 사용자가 마음에 안 들면 Ctrl+Z. 안전망.

## v0.4.0 릴리스

들어간 것:
- GameObject mutation (5종)
- Component mutation (4종)
- Undo 통합
- ParamCoercion 1차 (primitive + Vector + ObjectReference)

이거로 udit이 단순 query 도구가 아닌 **자동화 도구**가 됨. AI 에이전트 + udit 조합으로 prototype 만들기 가능.

## 메모

**왜 Undo 통합을 강제하나**

`Object.DestroyImmediate` 그냥 쓰면 사용자가 망친 거 못 되돌림. 자동화의 가장 큰 위험 = 잘못된 변경. Undo 통합으로 **모든 udit 동작이 reversible**.

(예외: `asset delete` 같은 디스크 변경은 Undo 안 됨 — 별도 처리, 트랜잭션 의존)

**왜 Add는 `--field` 같이 받지 않나**

`add`는 컴포넌트 추가까지만. 그 이후 set이 가능. 두 명령 분리하는 게 트랜잭션 합성 (v0.4.2)에서 더 깔끔. "Rigidbody add → mass set → useGravity set"이 한 트랜잭션.

## 다음

ObjectReference writes (텍스처/머티리얼 같은 자산 참조 set), Prefab API, Asset mutation. v0.4.1.
