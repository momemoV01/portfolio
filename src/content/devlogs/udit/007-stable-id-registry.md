---
title: 'StableIdRegistry — go:xxxxxxxx 안정 ID'
description: 'GameObject를 InstanceID 대신 안정 ID로 참조. 도메인 리로드 후에도 같은 ID 유지. 트랜잭션과 watch 시스템의 기반.'
pubDate: '2026-04-14'
seq: 7
type: 'feat'
commits: ['e8d7b62']
tags: ['stable-ids', 'core', 'foundation']
draft: false
---

## 문제

Unity의 `InstanceID`는 **세션 한정**:
- 같은 GameObject가 도메인 리로드 후 다른 InstanceID
- Editor 재시작 후 또 다름
- 씬 reload 후 또 다름

CLI에서:
```bash
udit go find --name "Player"
# data: { instance_id: 12345, ... }

# 5초 후 컴파일이 발생하면...
udit go inspect --id 12345
# UCI-300: GameObject not found  ← 같은 객체가 다른 ID로 살아있음
```

이게 자동화의 적. AI 에이전트가 1단계에서 ID 받고 2단계에서 사용하려는데 사이에 컴파일 일어나면 깨짐.

## 해결: StableIdRegistry

`go:xxxxxxxx` 형식의 안정 ID 도입. 8자 hex.

```bash
udit go find --name "Player"
# data: { id: "go:a3f9e8d2", instance_id: 12345, ... }

# 컴파일 후
udit go inspect --id go:a3f9e8d2
# 정상 ✓
```

### 매핑 유지

```csharp
public class StableIdRegistry {
    private Dictionary<int, string> instanceIdToStable = new();
    private Dictionary<string, GameObject> stableToObject = new();
    
    public string GetOrCreate(GameObject go) {
        var iid = go.GetInstanceID();
        if (instanceIdToStable.TryGetValue(iid, out var stable)) {
            return stable;
        }
        stable = $"go:{Guid.NewGuid().ToString("N")[..8]}";
        instanceIdToStable[iid] = stable;
        stableToObject[stable] = go;
        return stable;
    }
    
    public GameObject Resolve(string stableId) {
        if (stableToObject.TryGetValue(stableId, out var go) && go != null) {
            return go;
        }
        return null; // 진짜 destroy됐거나 unloaded scene
    }
}
```

### 도메인 리로드 생존

`[InitializeOnLoadMethod]` + serialization callback:

```csharp
[InitializeOnLoadMethod]
static void OnDomainReload() {
    // 리로드 후 호출됨. registry 재구성.
    StableIdRegistry.Instance.RebuildAfterReload();
}

public void RebuildAfterReload() {
    // 살아있는 모든 GO 스캔, persistent ID(GlobalObjectId) 기반 재매핑
    foreach (var go in FindAllGameObjects()) {
        var globalId = GlobalObjectId.GetGlobalObjectIdSlow(go);
        if (globalIdToStable.TryGetValue(globalId.ToString(), out var stable)) {
            stableToObject[stable] = go; // 새 InstanceID에 다시 연결
        }
    }
}
```

핵심 trick: **GlobalObjectId**가 진짜 안정적 — 씬 안에서 fileID + GUID 조합. 도메인 리로드 후에도 같음. 이걸 백업으로 쓰고, runtime API로는 짧은 stable ID 노출.

### 영구화 vs 세션 한정

설계 결정:
- **세션 한정**: Editor 재시작하면 ID 바뀜 (CLI도 새 세션)
- **영구**: ID를 디스크에 저장, Editor 재시작 후에도 같음

선택: **세션 한정**. 이유:
- 영구하면 prefab 인스턴스가 다른 씬 열 때마다 충돌 회피 로직 필요
- 사용 패턴: AI 에이전트는 한 세션 내에서 작업 완결, 세션 간 ID persistent 안 필요
- 영구 ID는 GlobalObjectId가 이미 있음 (그걸 쓰고 싶으면 `--global-id` 플래그)

### 노출 방식

모든 응답에서 `id` 필드는 stable ID:
```json
{
  "data": {
    "id": "go:a3f9e8d2",
    "name": "Player",
    "instance_id": 12345,    // 디버그용, 사용 비추
    "global_id": "GlobalObjectId_V1-1-...",   // 세션 간 호환용
    ...
  }
}
```

## 왜 이게 중요한가

이걸 안 깔면 그 위 모든 명령이 흔들림:

- **Transactions**: 명령 N개를 묶을 때 ID 안정 안 하면 시작-끝 사이 외부 변화에 깨짐
- **Watch**: 변경 알림에 ID 포함하는데, 알림 받고 처리하기 전에 ID 변하면 무의미
- **Pagination**: `udit go find --page 2`가 같은 결과 가정하려면 ID stable
- **Custom tools**: `[UditTool]`이 GameObject 받아서 처리할 때 ID 신뢰 가능해야

v0.3.0의 모든 후속 기능이 이 위에 얹힘.

## 메모

**왜 8자 hex인가**

- 너무 짧으면 충돌 (4자 hex = 65k 슬롯, 큰 씬에서 부족)
- 너무 길면 사람이 못 외움 (UUID = 32자, 손으로 못 침)
- 8자 hex = 4 billion 슬롯, 한 세션 내 충돌 사실상 0

**왜 prefix `go:`?**

다른 ID 시스템과 미래 충돌 회피. 곧 `asset:xxxx`, `prefab:xxxx`, `comp:xxxx` 도입 예정. prefix 없으면 모호함.

## 다음

이 ID 위에서 Scene API. Scene 트리 안에서 GameObject들이 stable ID로 식별.
