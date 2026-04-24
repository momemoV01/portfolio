---
title: '리팩토링 — root.go split + ManageComponent 분할'
description: 'cmd/root.go를 help/params/output으로 3분할. ManageComponent.cs를 3 partial로. TryParseVector3 통합.'
pubDate: '2026-04-15'
seq: 23
type: 'refactor'
commits: ['a7a1bee', '12b1f38', 'e723845', 'c79e7a7']
tags: ['refactor', 'maintainability', 'cleanup']
draft: false
---

## Go 측: `cmd/root.go` 3분할

### Before

`cmd/root.go` 한 파일에:
- 도움말 텍스트 정의 (300줄)
- 글로벌 플래그 + 검증 (200줄)
- 출력 포맷팅 + JSON envelope wrapping (250줄)
- Cobra root command 셋업
- 기타 공통 로직

총 ~900줄. 한 화면에 안 들어옴, 같은 PR에서 여러 영역 만지면 conflict 빈번.

### After

```
cmd/
├── root.go         (root command, ~150 lines)
├── help.go         (help text, topic help, ~300 lines)
├── params.go       (flag parsing, validation, ~200 lines)
├── output.go       (envelope wrapping, formatting, ~250 lines)
```

각 파일이 한 영역 책임.

```go
// cmd/root.go (after)
var rootCmd = &cobra.Command{
    Use:   "udit",
    Short: "Unity editor CLI",
    Long:  helpLongDescription,   // help.go에서
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return validateGlobalFlags(cmd)   // params.go에서
    },
}

// 다른 명령 등록도 root.go (서브커맨드 자체 정의는 각 명령 파일에)
```

```go
// cmd/help.go
const helpLongDescription = `
udit — Unity editor CLI for agent-first workflows

Examples:
  udit status
  udit editor play --wait
  ...
`

const examTopicHelp = `
Examples for udit exec:
  udit exec "return Application.dataPath;"
  udit exec --code-file script.cs
  ...
`
```

```go
// cmd/params.go
func validateGlobalFlags(cmd *cobra.Command) error {
    port, _ := cmd.Flags().GetInt("port")
    if port < 0 || port > 65535 { return errors.New("invalid port") }
    // ...
}
```

```go
// cmd/output.go
func WrapResponse(resp interface{}, useJson bool) string {
    if useJson {
        envelope := JSONEnvelope{ ... }
        b, _ := json.Marshal(envelope)
        return string(b)
    }
    return FormatHumanReadable(resp)
}
```

이후 도움말 수정 = `help.go`만, 출력 변경 = `output.go`만. PR 영역 좁아짐.

## C# 측: `ManageComponent.cs` 3 partial

### Before

`ManageComponent.cs` 1,800줄:
- CRUD (get/set/add/remove): 600줄
- 직렬화 (AnimationCurve/Gradient/refs/ManagedReference): 700줄
- ParamCoercion 헬퍼: 500줄

한 파일에 다 넣으니 IDE 검색 어려움 + Git history 노이즈.

### After

C# `partial class` 활용 — 한 클래스를 여러 파일로:

```
Editor/Tools/Component/
├── ManageComponent.Core.cs           (CRUD, ~600 lines)
├── ManageComponent.Serialization.cs   (특수 타입, ~700 lines)
├── ManageComponent.Helpers.cs         (parsing utils, ~500 lines)
```

각 파일이 같은 클래스의 일부:
```csharp
// ManageComponent.Core.cs
[UditTool]
public static partial class ManageComponent {
    public static object Get(JObject parameters) { ... }
    public static object Set(JObject parameters) { ... }
    public static object Add(JObject parameters) { ... }
    public static object Remove(JObject parameters) { ... }
}
```

```csharp
// ManageComponent.Serialization.cs
public static partial class ManageComponent {
    private static AnimationCurve ParseCurve(JObject json) { ... }
    private static Gradient ParseGradient(JObject json) { ... }
    private static object ParseManagedReference(JObject json, Type fieldType) { ... }
}
```

```csharp
// ManageComponent.Helpers.cs
public static partial class ManageComponent {
    private static bool TryGetField(...) { ... }
    private static Type ResolveType(string name) { ... }
}
```

장점:
- 새 타입 직렬화 추가 = `Serialization.cs`만 수정
- CRUD 변경 = `Core.cs`만 수정
- 같은 클래스라 internal helper 그대로 공유

## `TryParseVector3` 통합

### 문제

3 클래스에 같은 함수의 미세 다른 버전:

```csharp
// ManageGameObject.cs
private static bool ParseVec3(string s, out Vector3 v) {
    var p = s.Split(',');
    if (p.Length != 3) { v = Vector3.zero; return false; }
    v = new Vector3(float.Parse(p[0]), float.Parse(p[1]), float.Parse(p[2]));
    return true;
}

// ManageTransform.cs
private static bool ParseV3(string str, out Vector3 result) {
    str = str.Trim();
    if (str.StartsWith("(")) str = str.Substring(1);
    if (str.EndsWith(")")) str = str.Substring(0, str.Length-1);
    var parts = str.Split(',');
    // ... 약간 다름
}

// ManageComponent.cs
private static Vector3 ParseVector(string s) {
    // 또 다름
}
```

차이:
- whitespace trim 처리
- `(...)` 괄호 처리
- 음수 부호 처리
- 잘못된 입력 시 default value vs throw

같은 input에 다른 결과 가능성 → 잠재 버그.

### 해결

`ParamCoercion.TryParseVector3` 한 곳에 통합:

```csharp
public static class ParamCoercion {
    public static bool TryParseVector3(string s, out Vector3 result) {
        result = Vector3.zero;
        if (string.IsNullOrWhiteSpace(s)) return false;
        
        var trimmed = s.Trim().Trim('(', ')');
        var parts = trimmed.Split(',');
        if (parts.Length != 3) return false;
        
        if (!float.TryParse(parts[0].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var x)) return false;
        if (!float.TryParse(parts[1].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var y)) return false;
        if (!float.TryParse(parts[2].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var z)) return false;
        
        result = new Vector3(x, y, z);
        return true;
    }
}
```

`CultureInfo.InvariantCulture` — 독일어 locale에서 `1,5`가 1.5 vs (1, 5) 혼동 방지.

3 클래스 모두 이거 호출. 단일 진실 (single source of truth).

## docs(help): --json 문서화

`udit console --help`, `udit exec --help`에 `--json` 사용 예시 추가:

```bash
udit console --help
# ...
# --json    Emit machine-readable JSON envelope
#           Example:
#             udit console --type error --json
#             # {"success":true,"data":{"messages":[...]}}
```

작은 디테일이지만 사용자가 `--help`에서 `--json` 발견 → 자동화 시도 → udit의 진짜 가치 발견.

## 메모

**왜 ParamCoercion에 합치는가, 그냥 BaseClass 만들지 않고**

C# static partial class에 상속 안 됨 (static class 자체가 sealed). 헬퍼는 별도 static class에 두고 호출이 정답. + ParamCoercion이 이미 다른 헬퍼 모은 곳.

**왜 CultureInfo.InvariantCulture?**

독일어 / 프랑스어 locale은 소수점 구분자가 `,`. `1,5` = 1.5 (DE). udit는 항상 `.` 사용해야 일관. invariant culture 강제.

**리팩토링은 새 기능 0 — 그래도 v1.0 전 필수**

코드 청결도 = 유지보수 비용. v1.0 약속에 "API 안정"만 들어가는 거 같지만, 사실 **유지보수 가능한 코드** 약속도 포함. PR 리뷰가 가능하고 새 기여자가 onboard 가능한 코드.

## 다음

Dependabot + CI 하드닝.
