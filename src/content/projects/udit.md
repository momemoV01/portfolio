---
title: 'udit'
description: 'Unity Editor CLI — AI 에이전트 친화적 단일 바이너리 도구. unity-cli (DevBookOfArray)에서 포크하여 3일만에 v1.0.0까지 완성.'
pubDate: '2026-04-14'
updatedDate: '2026-04-16'
coverImage: '../../assets/blog-placeholder-3.jpg'
engine: 'Other'
platforms: ['PC']
tech: ['Go', 'C#', 'Unity', 'HTTP', 'Reflection', 'GitHub Actions']
role: 'Maintainer (fork & extend)'
duration: '3일 (fork → v1.0.0)'
status: 'released'
repoUrl: 'https://github.com/momemoV01/udit'
featured: true
---

## 개요

`udit`는 Unity Editor를 **명령줄에서** 제어하는 단일 바이너리 CLI 도구.  
[unity-cli](https://github.com/youngwoocho02/unity-cli)에서 포크하여 **AI 에이전트 워크플로우**에 맞게 확장.

> No server to run. No config to write. No process to manage. Just type a command.

이름 `Udit (उदित)` — 산스크리트어로 *risen*. 원작에 대한 존중 + 새로 일어선다는 의미.

## 왜 포크했나

기존 unity-cli의 코어 디자인(HTTP 브리지, 리플렉션 기반 도구 자동 발견, 하트비트, 도메인 리로드 핸들링)은 매우 견고. 그 위에:

- 에이전트 친화적 명령 surface 정비
- JSON 응답 envelope 표준화 — `{ success, message, data, error_code }`
- Semantic Versioning + API 안정성 약속
- 에러 코드 레지스트리 (UCI-xxx, 절대 재사용 안 함)
- 보안 모델 명문화 (localhost-only, SHA256 업데이트 검증)
- 공개 운영을 위한 거버넌스 정비

원작자 [DevBookOfArray](https://github.com/youngwoocho02)의 기여는 NOTICE.md에 풀 크레딧.

## 아키텍처

```
Terminal                              Unity Editor
────────                              ────────────
$ udit editor play --wait
    │
    ├─ scans ~/.udit/instances/*.json
    │  → finds Unity on port 8590
    │
    ├─ POST http://127.0.0.1:8590/command
    │  { "command": "manage_editor",
    │    "params": { "action": "play" }}
    │                                       │
    │                                  HttpServer 수신
    │                                  CommandRouter dispatch
    │                                  ManageEditor.HandleCommand()
    │                                       │
    └─ JSON 응답 ←─────────────────────────┘
       { "success": true,
         "message": "Entered play mode." }
```

- Unity Connector (C# 패키지)가 `localhost:8590`에 HTTP 서버 오픈
- 하트비트 파일로 CLI에 위치 알림
- 메인 스레드에서 `[UditTool]` 핸들러 자동 라우팅
- 도메인 리로드 생존
- 외부 의존성 0

## 명령어 카테고리 (요약)

| Category | 예시 |
|----------|------|
| **Editor** | `play` / `stop` / `pause` / `refresh` |
| **Scene** | `list` / `open` / `save` / `tree` |
| **GameObject** | `find` / `inspect` / `create` / `move` / `rename` |
| **Component** | `get` / `set` / `add` / `remove` (커스텀 직렬화 포함) |
| **Asset** | `find` / `dependencies` / `references` / `guid` |
| **Prefab** | `instantiate` / `unpack` / `apply` |
| **Build** | `player --il2cpp` / `--config <preset>` / `addressables` |
| **Test** | EditMode / PlayMode 실행 |
| **Profiler** | enable/disable, hierarchy 조회 |
| **Exec** | `udit exec "<C# 코드>"` — 임의 C# 실행 |
| **Automation** | `log tail` (SSE 스트림) / `watch` / `run <task>` |

## 성능

10k GameObject 씬 기준, 모든 쿼리 1초 미만:

| Query | 평균 ms |
|-------|--------:|
| `scene tree` (전체 hierarchy) | ~550 |
| `go find --name` (10k 매칭) | ~760 |
| `go inspect` (단일 GO) | ~450 |
| `asset references` (전체 스캔) | ~960 |
| `asset dependencies` | ~440 |

## 커스텀 도구 확장

`[UditTool]` attribute 붙은 static 클래스를 Editor 어셈블리에 두면 Connector가 자동 발견:

```csharp
[UditTool(Name = "spawn", Description = "Spawn an enemy")]
public static class SpawnEnemy
{
    public static object HandleCommand(JObject parameters)
    {
        var p = new ToolParams(parameters);
        float x = p.GetFloat("x", 0);
        var prefab = Resources.Load<GameObject>(p.Get("prefab", "Enemy"));
        var go = Object.Instantiate(prefab, new Vector3(x, 0, 0), Quaternion.identity);
        return new SuccessResponse("Spawned", new { name = go.name });
    }
}
```

```bash
udit spawn --x 5 --prefab Goblin
```

## 회고

3일 만에 v1.0.0 도달. 포크 시작점이 안정적이었던 게 결정적. AI 에이전트(Claude Opus)와 페어 프로그래밍 — 모든 커밋에 `Co-Authored-By` 명시.

다음 단계는 **v1.x Follow-ups**: Cookbook 20개 채우기, Connector NUnit 테스트 커버리지, 실시간 빌드 progress, `udit context` / `udit explain` 명령 추가.
