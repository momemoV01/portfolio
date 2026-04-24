---
title: 'SSE 기반 log tail (Phase 5.2)'
description: 'Connector /logs/stream SSE 엔드포인트, 클라이언트 streaming 리더, udit log tail / log list. 자동 재연결.'
pubDate: '2026-04-15'
seq: 18
type: 'feat'
commits: ['4eae09a', 'b8a8d47', '6973e8f']
tags: ['sse', 'streaming', 'log']
draft: false
---

## 왜 SSE인가

Unity Console 로그 실시간 보기. 폴링 vs WebSocket vs SSE:

| 옵션 | 장단 |
|------|------|
| 폴링 (HTTP GET 매초) | 단순. 비효율. 지연 1초+ |
| WebSocket | 양방향. udit는 단방향이라 과잉 |
| **SSE** | 단방향. HTTP 표준. 자동 재연결 |

결정: **Server-Sent Events**. 단순하고 충분.

## Slice 1 — Connector `/logs/stream`

```csharp
public class LogStreamHandler {
    private readonly LogBroadcaster broadcaster;
    
    public void Handle(HttpListenerContext ctx) {
        ctx.Response.ContentType = "text/event-stream";
        ctx.Response.Headers.Add("Cache-Control", "no-cache");
        ctx.Response.Headers.Add("Connection", "keep-alive");
        
        var subscriber = new LogSubscriber(ctx.Response.OutputStream);
        broadcaster.Subscribe(subscriber);
        
        try {
            // 끊길 때까지 대기 (writer thread가 push)
            subscriber.WaitForDisconnect();
        } finally {
            broadcaster.Unsubscribe(subscriber);
        }
    }
}

public class LogSubscriber {
    public void Push(LogEntry entry) {
        var json = JsonConvert.SerializeObject(entry);
        var sse = $"data: {json}\n\n";
        var bytes = Encoding.UTF8.GetBytes(sse);
        try {
            _stream.Write(bytes, 0, bytes.Length);
            _stream.Flush();
        } catch {
            _disconnected = true;
        }
    }
}
```

### Unity Application.logMessageReceived 후킹

```csharp
[InitializeOnLoadMethod]
static void Init() {
    Application.logMessageReceived += OnLog;
}

static void OnLog(string condition, string stackTrace, LogType type) {
    var entry = new LogEntry {
        Timestamp = DateTime.UtcNow,
        Type = type.ToString(),
        Message = condition,
        StackTrace = stackTrace,
    };
    LogBroadcaster.Instance.Broadcast(entry);
}
```

브로드캐스터가 모든 활성 subscriber에게 push.

## Slice 2 — Client SSE 리더

Go 측 streaming reader:

```go
func StreamLogs(url string, callback func(LogEntry)) error {
    resp, err := http.Get(url)
    if err != nil { return err }
    defer resp.Body.Close()
    
    reader := bufio.NewReader(resp.Body)
    for {
        line, err := reader.ReadString('\n')
        if err == io.EOF { return nil }
        if err != nil { return err }
        
        line = strings.TrimSpace(line)
        if !strings.HasPrefix(line, "data: ") { continue }
        
        payload := strings.TrimPrefix(line, "data: ")
        var entry LogEntry
        if err := json.Unmarshal([]byte(payload), &entry); err != nil {
            continue
        }
        callback(entry)
    }
}
```

### 자동 재연결

도메인 리로드 시 connection 끊김:

```go
func StreamLogsResilient(url string, callback func(LogEntry)) {
    backoff := 1 * time.Second
    maxBackoff := 30 * time.Second
    
    for {
        err := StreamLogs(url, callback)
        if err == nil {
            return  // graceful close
        }
        
        log.Printf("connection lost: %v, reconnecting in %v", err, backoff)
        time.Sleep(backoff)
        backoff = min(backoff*2, maxBackoff)
    }
}
```

1s → 2s → 4s → 8s → 16s → 30s (max).

## Slice 3 — CLI Commands

```bash
udit log tail                      # 실시간 follow
udit log tail --type error         # error만
udit log tail --type warning,error # 다중
udit log list                       # 스냅샷 (최근 N개)
udit log list --limit 50
udit log list --type error
```

### Tail 출력

```
[15:32:01.123] [INFO]    Player spawned at (0, 1, 0)
[15:32:03.456] [WARNING] Texture missing mipmap: Hero_Albedo
[15:32:05.789] [ERROR]   NullReferenceException: Object reference not set
                          at Player.Update() in Player.cs:line 42
```

색깔 코딩 + 시간 정렬. Ctrl+C로 종료.

### List vs Tail

```bash
udit log list           # 마지막 N개 스냅샷 (즉시 종료)
udit log tail           # 라이브 follow (Ctrl+C까지)
```

`list`는 `tail -n` 같은 거. CI에서 "지난 에러 보기" 용.

## 메모

**왜 SSE 표준 그대로 쓰는가**

JSON-RPC over WebSocket 같은 거 만들면 클라이언트가 SDK 필요. SSE는 `curl`로도 받을 수 있음 — 디버깅 편함.

```bash
curl -N http://localhost:8590/logs/stream
```

도구 외부에서도 검증 가능 = 개방성.

**도메인 리로드 시 손실?**

리로드 ~1-2초 동안 SSE connection 끊김. 그 사이 로그는 손실 (Unity가 메모리에 저장 안 함). 사용자 한정 수용. Tail 용도라 critical 아님.

영구 로그 원하면 `udit log list --since` 같은 거 미래 추가 (시계열 저장 필요).

**왜 client backoff가 max 30초?**

Domain reload는 보통 수 초. 30초 안에 다시 살아남. 30초 넘게 죽어 있으면 사용자가 알아챘을 시점이라 그냥 30초 간격으로 재시도.

## 다음

run + config + watch ad-hoc + build presets. Phase 5.3 완성.
