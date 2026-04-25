---
title: 'Watch 시스템 4 슬라이스 → v0.6.0'
description: 'Types/matcher → fsnotify walker + debouncer → queue runner + circuit breaker → CLI wiring. 자동 빌드/리프레시 트리거.'
pubDate: '2026-04-15'
seq: 16
type: 'feat'
commits: ['f178057', '1ca9fcd', 'b51522a', 'f37487e', 'cf20e03']
tags: ['watch', 'fsnotify', 'debouncer', 'circuit-breaker', 'v0.6.0', 'release']
draft: false
---

## 배경

`udit watch` = 파일 변경 감지 → 자동 액션. 예:

```bash
udit watch --path "Assets/Shaders/**" --on-change "udit editor refresh --wait"
# 셰이더 수정 → Unity 자동 리프레시
```

이런 도구는 **간단해 보이지만 실제론 함정 많음**. 4 슬라이스로 점진적 구축.

## Slice 1 — Types / Matcher / Ignore

### 변경 이벤트 타입

```go
type EventType int
const (
    EventCreate EventType = iota
    EventModify
    EventDelete
    EventRename
)

type Event struct {
    Type      EventType
    Path      string
    OldPath   string  // rename 시
    Timestamp time.Time
}
```

### Matcher

glob 패턴 매칭:
```go
type Matcher struct {
    includes []*PatternMatcher
    excludes []*PatternMatcher
}

func (m *Matcher) Match(path string) bool {
    for _, e := range m.excludes {
        if e.Match(path) { return false }
    }
    for _, i := range m.includes {
        if i.Match(path) { return true }
    }
    return len(m.includes) == 0  // include 없으면 모두 매치
}
```

지원 패턴:
- `Assets/**/*.cs` — 재귀
- `Assets/Shaders/*.shader` — 단일 디렉토리
- `**/_temp/**` — 어디든 _temp 폴더

### 기본 ignore 리스트

Unity 프로젝트의 노이즈 폴더 자동 제외:
```yaml
# 기본 ignore
- "**/Library/**"
- "**/Temp/**"
- "**/Logs/**"
- "**/UserSettings/**"
- "**/.git/**"
- "**/Build/**"
- "**/*.meta.tmp"
```

이거 안 하면 Unity가 Library/ 안에서 매 초 수십 파일 변경 → 노이즈 폭발.

## Slice 2 — fsnotify Walker + Debouncer

### fsnotify 통합

크로스 플랫폼 파일 시스템 워처:
```go
import "github.com/fsnotify/fsnotify"

watcher, _ := fsnotify.NewWatcher()
watcher.Add("Assets/")  // 재귀 안 됨, 직접 추가

// 시작 시 모든 디렉토리 등록
filepath.Walk("Assets/", func(path string, info os.FileInfo, err error) error {
    if info.IsDir() {
        watcher.Add(path)
    }
    return nil
})
```

문제: macOS는 재귀 추가 가능 (FSEvents), Linux/Windows는 디렉토리마다 등록 필요. fsnotify 추상화 활용.

### Debouncer

파일 저장은 종종 **여러 이벤트 폭발**:
- VS Code: temp file 생성 → rename → 원본 변경 → 3 events
- Unity 자체 import: meta 파일 생성/수정 → 5+ events

Debounce: 변경 후 **N ms 동안 추가 변경 없으면** 그때 알림.

```go
type Debouncer struct {
    delay   time.Duration
    timer   *time.Timer
    pending map[string]*Event  // path → 마지막 event
    mu      sync.Mutex
}

func (d *Debouncer) Add(e Event) {
    d.mu.Lock()
    d.pending[e.Path] = &e
    if d.timer != nil { d.timer.Stop() }
    d.timer = time.AfterFunc(d.delay, d.flush)
    d.mu.Unlock()
}

func (d *Debouncer) flush() {
    d.mu.Lock()
    events := maps.Values(d.pending)
    d.pending = map[string]*Event{}
    d.mu.Unlock()
    
    for _, e := range events {
        d.callback(*e)
    }
}
```

기본 delay: 200ms. 사용자 조정 가능.

### .meta collapse

Unity의 동작:
- `Hero.cs` 변경 → fsnotify는 `Hero.cs` + `Hero.cs.meta` 둘 다 알림
- 사용자 의도는 `Hero.cs` 한 번

```go
func collapseMeta(events []Event) []Event {
    seen := map[string]bool{}
    out := []Event{}
    for _, e := range events {
        // .meta 제거
        path := strings.TrimSuffix(e.Path, ".meta")
        if seen[path] { continue }
        seen[path] = true
        e.Path = path
        out = append(out, e)
    }
    return out
}
```

## Slice 3 — Queue Runner + Circuit Breaker

### 문제

`--on-change` 콜백이 빌드 명령이면 30초 걸릴 수 있음. 그 사이에 또 변경 → 콜백 또 트리거 → **콜백 폭주**.

### Queue Runner

순차 실행:
```go
type QueueRunner struct {
    queue       chan Event
    inFlight    bool
    maxConcurrent int     // 1 (순차)
}

func (q *QueueRunner) Process(e Event) {
    select {
    case q.queue <- e:
        // ok
    default:
        // queue 가득 → 정책 적용
    }
}

func (q *QueueRunner) worker() {
    for e := range q.queue {
        q.inFlight = true
        q.callback(e)
        q.inFlight = false
    }
}
```

기본 정책: 1 동시 실행. 두 번째 이벤트는 queue에 대기.

### Ignore Policy

큐가 가득 차면:
- `drop_oldest`: 가장 오래된 이벤트 버림 (최신 우선)
- `drop_newest`: 새 이벤트 버림 (현재 작업 우선)
- `coalesce`: 같은 path 이벤트 합침 (기본)

Coalesce가 가장 흔함. Hero.cs 5번 저장 → 한 번 콜백.

### Circuit Breaker

콜백이 연속으로 실패하면 일시 중지:
```go
type CircuitBreaker struct {
    failures        int
    threshold       int   // 3
    cooldown        time.Duration  // 30s
    state           State  // Closed | Open | HalfOpen
    lastFailure     time.Time
}

func (cb *CircuitBreaker) Allow() bool {
    switch cb.state {
    case Closed:
        return true
    case Open:
        if time.Since(cb.lastFailure) > cb.cooldown {
            cb.state = HalfOpen
            return true  // 한 번 시도
        }
        return false
    case HalfOpen:
        return false  // 시도 중
    }
}

func (cb *CircuitBreaker) Reset() { cb.failures = 0; cb.state = Closed }
func (cb *CircuitBreaker) Trip()  { cb.failures++; if cb.failures >= cb.threshold { cb.state = Open; cb.lastFailure = time.Now() } }
```

콜백 3번 fail → 30초 쉼 → 다시 1번 시도. 또 fail → 또 30초.

이거 안 하면 빌드 콜백이 영구 깨졌을 때 무한 루프 → CPU 100%.

## Slice 4 — CLI Wiring + Docs

### `udit watch` 명령

```bash
udit watch                                                  # .udit.yaml의 default
udit watch --path "Assets/Scripts/**" --on-change "udit editor refresh --wait"
udit watch --path "Assets/Shaders/**" --debounce 500ms
udit watch --config-name "shader-dev"
```

### 출력

```
$ udit watch --path "Assets/Scripts/**" --on-change "udit editor refresh"

[watch] watching Assets/Scripts/** (recursive)
[watch] debounce: 200ms
[watch] on-change: udit editor refresh

[15:32:01] modified Assets/Scripts/Player.cs
[15:32:01] running: udit editor refresh
[15:32:03] ✓ done in 1.8s

[15:32:15] modified Assets/Scripts/Enemy.cs
[15:32:15] running: udit editor refresh
[15:32:17] ✓ done in 1.6s
```

색깔 구분: 변경 이벤트 (gray), 액션 (lime), 성공 (green), 실패 (red).

### Ctrl+C 처리

graceful shutdown — 진행 중 콜백 완료 대기, 큐 비우고 종료.

## v0.6.0 릴리스

들어간 것 (4 슬라이스 통합):
- 이벤트 타입 + matcher + ignore
- fsnotify walker + debouncer + meta collapse
- queue runner + ignore policy + circuit breaker
- CLI wiring + docs

자동화 루프의 진짜 시작. 셰이더 작업 / 핫리로드 워크플로우 즉시 가능.

<aside class="callout callout-note">
<span class="callout-label">왜 슬라이스로 쪼갰나</span>

watch는 4 영역 전부 섬세함. 한 PR에 다 넣으면 리뷰 불가능. 슬라이스 단위 = 각각 검증 가능, 회복 가능.
</aside>

<aside class="callout callout-note">
<span class="callout-label">왜 fsnotify 직접 쓰는가, OS-specific 안 쓰고</span>

fsnotify는 Linux inotify, macOS FSEvents, Windows ReadDirectoryChangesW 추상화. 직접 쓰면 3 플랫폼 코드 따로. 많이 검증된 라이브러리 사용이 합리.
</aside>

<aside class="callout callout-note">
<span class="callout-label">Circuit breaker 30초가 적절한가?</span>

Trial. 3번 fail은 진짜 깨졌을 가능성, 그 시점에 사용자도 알아챘을 거. 30초면 사용자가 콜백 고치고 reset할 시간. 길면 답답, 짧으면 다시 폭주. 30초 = 합리적 mid.
</aside>

## 다음

init scaffold + connected-instance 타겟팅. v0.6.x 라인 후반.
