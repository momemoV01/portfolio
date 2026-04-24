---
title: 'component-set 직렬화 4 슬라이스 → v0.9.0'
description: 'AnimationCurve, Gradient, Scene references, ManagedReference. Unity 까다로운 타입을 udit component set으로 다루기.'
pubDate: '2026-04-15'
seq: 20
type: 'feat'
commits: ['255c281', '8d71725', '31e613d', '3e52394', '212791d', '7178817']
tags: ['serialization', 'component', 'unity-internals', 'v0.9.0', 'release']
draft: false
---

## 왜 v0.9.0인가

v0.4.0의 component-set은 primitive + Vector + ObjectReference. 하지만 Unity 컴포넌트는 종종 **복잡한 타입** 가짐:

- `AnimationCurve` — 키프레임 배열 + 탄젠트
- `Gradient` — color keys + alpha keys
- Scene 안 객체 참조 — GUID + fileID
- `[SerializeReference]` — polymorphic

이걸 못 다루면 자동화 천장. v0.9.0 = 천장 부수기.

## Slice 1 — AnimationCurve

```bash
udit component set --id go:player --type Animator \
  --field weights \
  --value '{
    "keys": [
      {"time": 0, "value": 0, "inTangent": 0, "outTangent": 1},
      {"time": 0.5, "value": 1, "inTangent": 0, "outTangent": 0},
      {"time": 1, "value": 0, "inTangent": -1, "outTangent": 0}
    ],
    "preWrapMode": "Loop",
    "postWrapMode": "Loop"
  }'
```

### 직렬화

```csharp
public static AnimationCurve ParseCurve(JObject json) {
    var curve = new AnimationCurve();
    foreach (var k in (JArray)json["keys"]) {
        curve.AddKey(new Keyframe {
            time = (float)k["time"],
            value = (float)k["value"],
            inTangent = (float)k["inTangent"],
            outTangent = (float)k["outTangent"],
            inWeight = k["inWeight"]?.Value<float>() ?? 0,
            outWeight = k["outWeight"]?.Value<float>() ?? 0,
            weightedMode = (WeightedMode)Enum.Parse(...),
            tangentMode = ...,
        });
    }
    if (json["preWrapMode"] != null)
        curve.preWrapMode = (WrapMode)Enum.Parse(typeof(WrapMode), (string)json["preWrapMode"]);
    if (json["postWrapMode"] != null)
        curve.postWrapMode = (WrapMode)Enum.Parse(typeof(WrapMode), (string)json["postWrapMode"]);
    return curve;
}
```

### Round-trip

`get` → JSON → `set`이 동일하게 재구성되도록 검증:
```bash
udit component get --id go:X --type Animator --field weights > tmp.json
udit component set --id go:X --type Animator --field weights --value-file tmp.json
# 결과: 차이 0
```

테스트로 강제. `test(component-set): cover primitive parsers` (Bool/Vector/Color/Enum)도 같은 정신.

## Slice 2 — Gradient

```bash
udit component set --id go:vfx --type ParticleSystemRenderer \
  --field colorOverLifetime \
  --value '{
    "mode": "Blend",
    "color_keys": [
      {"time": 0, "color": [1, 1, 1, 1]},
      {"time": 1, "color": [0, 0, 0, 1]}
    ],
    "alpha_keys": [
      {"time": 0, "alpha": 1},
      {"time": 1, "alpha": 0}
    ]
  }'
```

### Color/Alpha 분리

Unity Gradient 내부:
- color keys: RGB만 (alpha 무시)
- alpha keys: A만 (RGB 무시)

JSON에서 분리해서 받음. `[1, 1, 1, 1]` 4-element는 우편 형식.

### Mode

`GradientMode.Blend` (interpolated) vs `Fixed` (stepped).

```csharp
gradient.mode = (GradientMode)Enum.Parse(typeof(GradientMode), modeStr);
```

## Slice 3 — Scene References

씬 안 객체 참조하기:

```bash
udit component set --id go:trigger --type DoorScript \
  --field targetDoor \
  --value '{
    "guid": "abc123def456",
    "fileID": 12345
  }'
```

### `LocalFileIdentifierIn` 패턴

Unity가 씬 파일 안에서 객체 식별하는 방식:
- GUID = 씬 파일의 GUID (Asset)
- fileID = 씬 안 객체의 local ID

```csharp
var sceneAsset = AssetDatabase.LoadAssetAtPath<SceneAsset>(scenePath);
var sceneGuid = AssetDatabase.AssetPathToGUID(scenePath);
// fileID는 GlobalObjectId로 추출
var globalId = GlobalObjectId.GetGlobalObjectIdSlow(targetObject);
var fileId = (long)globalId.targetObjectId;
```

### Stable ID로 단순화

CLI 측에선 더 단순하게:
```bash
udit component set --id go:trigger --type DoorScript \
  --field targetDoor \
  --value go:abc12345
```

`go:` 접두사 받으면 → StableIdRegistry → Object 변환 → 자동으로 GUID + fileID 페어 set.

## Slice 4 — ManagedReference

`[SerializeReference]` polymorphic 처리. 가장 까다로운.

```csharp
public class Strategy {
    public abstract void Execute();
}

public class AttackStrategy : Strategy { public int damage; }
public class DefendStrategy : Strategy { public float reduction; }

[SerializeReference]
public Strategy currentStrategy;
```

### JSON 직렬화

타입 정보 보존 필요:
```bash
udit component set --id go:enemy --type EnemyAI \
  --field currentStrategy \
  --value '{
    "$type": "AttackStrategy, MyAssembly",
    "damage": 25
  }'
```

`$type` = "ClassName, AssemblyName" (assembly-qualified).

### 구현

```csharp
public static object ParseManagedReference(JObject json, Type fieldType) {
    var typeName = (string)json["$type"];
    var instanceType = Type.GetType(typeName);
    if (instanceType == null || !fieldType.IsAssignableFrom(instanceType)) {
        throw new CoerceException("UCI-101", "Type mismatch or not found");
    }
    
    var instance = Activator.CreateInstance(instanceType);
    
    // 나머지 필드 set
    foreach (var prop in json.Properties()) {
        if (prop.Name == "$type") continue;
        var field = instanceType.GetField(prop.Name);
        if (field != null) {
            field.SetValue(instance, ParamCoercion.Coerce(prop.Value.ToString(), field.FieldType));
        }
    }
    
    return instance;
}
```

### get 측에서 round-trip

`udit component get`이 ManagedReference 출력 시:
```json
{
  "currentStrategy": {
    "$type": "AttackStrategy, MyAssembly",
    "damage": 25
  }
}
```

`$type` 자동 포함 → 그대로 다시 set 가능.

## refactor: rejection message via HashSet

직렬화 거부할 타입들 (예: 직접 못 다루는 internal Unity types):

Before:
```csharp
if (type.Name == "X" || type.Name == "Y" || type.Name == "Z" || ...) reject;
```

After:
```csharp
private static readonly HashSet<string> Rejected = new() {
    "InternalType1", "InternalType2", ...
};
if (Rejected.Contains(type.Name)) reject;
```

거부 이유도 명확:
```json
{
  "error_code": "UCI-101",
  "message": "Type 'GUIStyle' cannot be deserialized",
  "data": { "type": "GUIStyle", "reason": "Editor-only complex type" }
}
```

## Test asmdef 추가

새 테스트 어셈블리: `Tests.asmdef`. Connector 본체와 분리:
```yaml
{
  "name": "udit.Tests",
  "references": ["udit.Connector"],
  "includePlatforms": ["Editor"],
  "optionalUnityReferences": ["TestAssemblies"],
  "autoReferenced": false
}
```

이거 없으면 Connector가 NUnit 의존 → release build에 NUnit 같이 들어감.

## v0.9.0 릴리스

들어간 것:
- AnimationCurve serialization
- Gradient serialization
- Scene reference serialization
- ManagedReference serialization
- Tests.asmdef + 테스트 추가

**Unity 까다로운 타입 거의 다 다룸**. v0.9.x는 안정화 라인. v1.0 진입 준비.

## 메모

**왜 4 슬라이스로 쪼갰나**

각각 100-200줄 변경 + 테스트 + edge case. 한 PR로 전부면 1000줄 변경 + 검증 어려움. 슬라이스 단위 = 각각 head 안에 들어감.

**왜 v0.7/0.8 건너뛰고 0.9?**

v0.7/0.8은 minor bump 안 하고 패치만 한 시리즈. SemVer는 의미 있는 변화에 minor bump. component-set 직렬화는 큰 변화 → 0.9로 점프 (의도적 신호).

**ManagedReference의 한계**

Generic types, recursive types 지원 부분적. 깊은 polymorphic 트리는 미래 슬라이스로. 95% 케이스는 커버.

## 다음

Sprint 3 — 테스트 커버리지 + 10k 벤치마크. v1.0 진입의 신뢰 항목.
