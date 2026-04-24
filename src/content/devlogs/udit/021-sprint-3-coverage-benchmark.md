---
title: 'Sprint 3 — 테스트 커버리지 + 10k GO 벤치마크'
description: 'C1 (10k GameObject 벤치), C2 (커버리지 갭 fill), C3 (parser 통일). 모든 쿼리 1초 미만 검증.'
pubDate: '2026-04-15'
seq: 21
type: 'test'
commits: ['1e23b4a', 'e80b1c8', '81a9983', '2922223', '7f4b9b3', 'fc3dc0b', 'd495fce', '4031c63', '9d74422', '7f2a24f']
tags: ['testing', 'benchmark', 'coverage', 'sprint-3']
draft: false
---

## 동기

v1.0 진입 전 마지막 신뢰 점검:
1. 성능 SLO — "10k 씬에서 안 죽음" 약속 가능?
2. 테스트 커버리지 — "내가 모르는 깨진 길" 없음?
3. 일관성 — 같은 로직이 여러 곳에 다른 모양?

Sprint 3 = 이 셋 동시에.

## C1 — 10k GameObject 벤치마크

### 테스트 씬

`Tests/Benchmark/10kScene.unity` 생성:
- 10,762 GameObjects (실제로 측정해서 결정)
- 평균 5 components per GO
- 다양한 hierarchy depth (1 ~ 8)
- 일부 prefab instances
- 일부 ScriptableObject 참조

스크립트로 자동 생성:
```csharp
[MenuItem("Tools/Generate 10k Scene")]
static void Generate() {
    var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene);
    var random = new System.Random(42);
    for (int i = 0; i < 10762; i++) {
        var go = new GameObject($"GO_{i:D5}");
        go.AddComponent<Rigidbody>();
        // ... random components/hierarchy
    }
    EditorSceneManager.SaveScene(scene, "Assets/Tests/Benchmark/10kScene.unity");
}
```

### 측정

```csharp
[Test]
public void Benchmark_SceneTree_Under1Second() {
    var sw = Stopwatch.StartNew();
    var result = SceneTreeBuilder.Build(activeScene);
    sw.Stop();
    Assert.Less(sw.ElapsedMilliseconds, 1000);
}
```

### 결과

| Query | 평균 ms | SLO |
|-------|--------:|-----|
| `scene tree` | 550 | < 1000 ✓ |
| `go find --name` (10k 매칭) | 760 | < 1000 ✓ |
| `go inspect` (single, components shallow) | 450 | < 1000 ✓ |
| `asset references` (전체 스캔) | 960 | < 1000 ✓ |
| `asset dependencies` | 440 | < 1000 ✓ |

전부 1초 미만. SLO를 ROADMAP과 README에 명시.

### 회귀 방지

벤치마크 테스트가 `Tests/Benchmarks` asmdef. CI에서 매 PR 실행:
```yaml
- name: Run benchmarks
  run: udit test run --filter "Tests.Benchmarks.*" --output benchmarks.xml
- name: Check thresholds
  run: |
    # threshold breach 시 fail
    grep -E 'duration="[1-9][0-9]{3,}\.' benchmarks.xml && exit 1 || true
```

## C2 — 커버리지 갭 채우기

### 테스트 없던 곳들

#### `circuitBreaker.Reset` (watch)

```csharp
[Test]
public void Reset_ResetsFailureCount() {
    var cb = new CircuitBreaker(threshold: 3, cooldown: 30s);
    cb.Trip(); cb.Trip();
    Assert.AreEqual(2, cb.failures);
    cb.Reset();
    Assert.AreEqual(0, cb.failures);
    Assert.AreEqual(State.Closed, cb.state);
}
```

#### Printer JSON 경로 (run)

```csharp
[Test]
public void Printer_JsonPath_OutputsValidJson() {
    var output = new StringWriter();
    var printer = new Printer(output, format: "json");
    printer.Print(new SuccessResponse("ok", new { foo = "bar" }));
    var json = JObject.Parse(output.ToString());
    Assert.AreEqual(true, (bool)json["success"]);
    Assert.AreEqual("bar", (string)json["data"]["foo"]);
}
```

#### Reconnect backoff (log)

```csharp
[Test]
public void Backoff_ExponentialUntilMax() {
    var b = new Backoff(initial: 1s, max: 30s, factor: 2);
    Assert.AreEqual(1s, b.Next());
    Assert.AreEqual(2s, b.Next());
    Assert.AreEqual(4s, b.Next());
    // ... 30s 도달 후 cap
    for (int i = 0; i < 10; i++) b.Next();
    Assert.AreEqual(30s, b.Next());
}
```

#### `WrapExecError`

`exec` 명령의 예외 → ErrorResponse 래핑:
```csharp
[Test]
public void WrapExecError_NREMapsToUCI001() {
    var ex = new NullReferenceException("Object reference not set");
    var resp = ExecWrapper.WrapExecError(ex);
    Assert.AreEqual("UCI-001", resp.ErrorCode);
    Assert.IsTrue(resp.Message.Contains("NullReferenceException"));
}
```

### Watch Windows-specific 테스트

```csharp
[Test]
[Platform(GOOS = "windows")]   // 커스텀 attribute
public void Watch_BackslashPaths_Handled() {
    var matcher = new Matcher();
    matcher.AddInclude(@"Assets\Scripts\**");
    Assert.IsTrue(matcher.Match(@"Assets\Scripts\Player.cs"));
}
```

Linux/macOS에선 skip. CI matrix에서 Windows만 실행.

## C3 — Parser 통일 (TryParseVector3)

### 발견

`TryParseVector3`가 3 클래스에서 약간씩 다르게:
- `ManageGameObject.cs`
- `ManageComponent.cs`
- `ManageTransform.cs`

미세 차이 (whitespace 처리, 음수 처리, etc) → 잠재 버그.

### 해결

`ParamCoercion.TryParseVector3` 한 곳에 통합:

```csharp
public static class ParamCoercion {
    public static bool TryParseVector3(string s, out Vector3 result) {
        result = default;
        var parts = s.Trim().Trim('(', ')').Split(',');
        if (parts.Length != 3) return false;
        if (!float.TryParse(parts[0].Trim(), out var x)) return false;
        if (!float.TryParse(parts[1].Trim(), out var y)) return false;
        if (!float.TryParse(parts[2].Trim(), out var z)) return false;
        result = new Vector3(x, y, z);
        return true;
    }
}
```

3 클래스 모두 이거 호출. **한 곳에서 핀**:

```csharp
[Test]
public void TryParseVector3_HandlesAllFormats() {
    Assert.IsTrue(ParamCoercion.TryParseVector3("1, 2, 3", out var v1));
    Assert.IsTrue(ParamCoercion.TryParseVector3("(1,2,3)", out var v2));
    Assert.IsTrue(ParamCoercion.TryParseVector3("-1.5, 0, 2.7", out var v3));
    Assert.IsFalse(ParamCoercion.TryParseVector3("1, 2", out _));
    Assert.IsFalse(ParamCoercion.TryParseVector3("a, b, c", out _));
}
```

## docs(readme): refresh first-impression surface

공개 직전 README 한 번 더 다듬기:
- "What" 한 줄을 첫 단락 첫 문장으로
- "Install" 코드 블록을 표 위쪽으로
- 명령 예시 5줄 → 가장 임팩트 있는 거로

작은 변화지만 첫 방문자 첫 30초가 달라짐.

## docs(roadmap): Sprint 3 complete

ROADMAP에 Sprint 3 ✓ 마킹:
```markdown
### Sprint 3 — Test Coverage + Performance
- [x] C1: 10k GO scene benchmark (all queries < 1s)
- [x] C2: Coverage gap fill (circuitBreaker, printer, log, exec)
- [x] C3: Parser unification (TryParseVector3 to ParamCoercion)

Sprint 3 closed. v1.0 readiness improving.
```

## 메모

**왜 SLO가 1초인가**

UI 반응성 임계값 = 100ms (사용자 즉각 인지). CLI는 배치성 → 1초가 "기다림 인지" 임계값. 1초 < 5초 < 30초 단계에서 1초 안에 들어가면 "빠른 도구" 인상.

**커버리지 % 보다 정성적 갭이 중요**

90% 커버리지 보고도 critical 경로 안 덮였을 수 있음. C2는 의도적으로 "not yet covered" 리스트 만들고 채움. % 보단 **검증 안 된 코드 경로 0**이 목표.

## 다음

v0.9.1 — Pre-public 보안 하드닝.
