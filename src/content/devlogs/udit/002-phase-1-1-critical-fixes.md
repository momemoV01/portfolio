---
title: 'Phase 1.1 — Critical 버그 픽스'
description: 'ExecuteCsharp, Screenshot, Router, buildParams — 업스트림에서 잠복 중이던 4개 버그 일괄 처리. 새 기능 쌓기 전 기반 다지기.'
pubDate: '2026-04-14'
seq: 2
type: 'fix'
commits: ['e0b9f5e', '0154751', '273afc0', 'ee5bf52', '3fc3f04']
tags: ['phase-1', 'fix', 'foundation']
draft: false
---

## 새 기능 전에 코어부터

새 명세를 위에 쌓으려면 아래가 단단해야 함. 업스트림 unity-cli를 며칠 사용하면서 발견한 4개 버그.

## Bug 1: ExecuteCsharp의 reflection 누수

```csharp
// Before
public static object Execute(string code) {
    var assembly = CompileToAssembly(code);
    var type = assembly.GetType("Runner");
    return type.GetMethod("Run").Invoke(null, null);
    // assembly가 GC 안 됨 — 같은 명령 100번 실행하면 메모리 100MB+ 누적
}
```

문제: `Assembly` 객체가 AppDomain에 등록된 채로 영구 거주. 명령마다 새 어셈블리 → 누수.

해결: `AssemblyLoadContext.Unloadable = true` + 명령 끝나면 explicit unload. .NET Standard 2.1 미만 호환 위해 collectible context도 fallback.

## Bug 2: Screenshot의 EditorScreenshot deprecation

Unity 6000(2026)에서 `EditorApplication.RenderEditorWindow` API 변경. 기존 코드:

```csharp
EditorWindow.GetWindow<SceneView>().Repaint();
EditorApplication.RenderEditorWindow(window, ...); // deprecated
```

Unity 6 권장 방식:
```csharp
ScreenCapture.CaptureScreenshotAsTexture(); // for runtime
// editor 전용 → reflection으로 internal API 호출 (변경 가능)
```

선택: deprecated API 유지 (warning 무시) vs 새 방식 사용. 새 방식은 Unity 5.x/6000 분기 필요. 결정 — **Unity 6000+ 만 지원**, 분기 안 함. ROADMAP에 명시.

## Bug 3: CommandRouter의 panic 미처리

```csharp
// Before
public object Route(Command cmd) {
    var handler = handlers[cmd.Name];
    return handler.Invoke(cmd.Params); // 핸들러에서 throw하면 Unity 멈춤
}
```

핸들러가 NRE 던지면 Unity Editor 자체가 freeze. 이게 더 큰 문제 — 사용자가 강제종료 → 작업물 잃음.

해결: 모든 핸들러를 try/catch로 감싸고, 표준 ErrorResponse 반환:

```csharp
public object Route(Command cmd) {
    try {
        var handler = handlers[cmd.Name];
        return handler.Invoke(cmd.Params);
    } catch (Exception e) {
        return new ErrorResponse {
            Code = "UCI-001",
            Message = e.Message,
            Stack = e.StackTrace,
        };
    }
}
```

이게 이후 **Phase 1.3 error code registry**의 토대가 됨.

## Bug 4: buildParams의 quoting

CLI에서 Unity로 명령 보낼 때 JSON 파라미터가 escape 깨지는 케이스:

```bash
udit exec "var s = \"hello\"; return s;"
# → 받는 쪽에서 backslash 사라져서 SyntaxError
```

원인: shell 한 번, JSON serialize 한 번, deserialize 한 번 거치면서 escape 레벨 mismatch.

해결: CLI 측에서 `--code` 플래그 도입 + base64 옵션. 또는 STDIN 입력 우선:

```bash
echo 'var s = "hello"; return s;' | udit exec --stdin
udit exec --code-file script.cs
```

Quoting 문제 회피.

## 추가 정비

### `chore: address Unity 6000 deprecation`
EditorScreenshot 외에 `EditorApplication.update += handler` 식의 deprecated subscription도 정리.

### `docs: Windows Store Claude Desktop sandbox pitfall`
Claude Desktop이 Windows Store 버전이면 sandbox 안에서 실행 → 외부 프로세스(Unity Editor) 호출 권한 없음. README에 경고 추가:

> ⚠️ **Windows Store version of Claude Desktop is sandboxed.**
> udit must be installed for the user — Microsoft Store install of Claude won't be able to spawn external processes. Use the standalone installer.

이게 낚이면 디버깅 시간 1시간씩 날아감. 미리 박아두기.

### `chore: .claude/ skills + permission settings`
나의 작업 환경 (Claude Code) 설정 — udit 리포 안에서 일관된 워크플로우 보장. agent가 `git push` 같은 거 자동 실행 안 하도록 명시적 허용 리스트.

### `chore(permissions): relax .claude/settings.json for local-only git ops`
위 설정에서 `git status`/`git diff` 같은 read-only는 허용. 매번 권한 묻기 피로감.

## 메모

**왜 fix를 한 번에 묶는가**

각 버그 따로 PR이면 review/merge에 시간 박리. 4개 같이 묶어서 큰 commit으로. 작은 버그라도 retroactively 동시기록 가능.

**Critical 정의**

여기서 "critical" = "사용자가 우회할 방법 없음 + 작업 데이터 손실 가능". UI 어색함이나 출력 못생김은 critical 아님.

## 다음

Phase 1.2 — JSON envelope 표준화. 모든 응답이 동일한 모양 가지도록.
