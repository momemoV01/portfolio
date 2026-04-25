---
title: 'run + config + watch ad-hoc + build presets (Phase 5.3)'
description: 'udit run 태스크 러너, udit config 네임스페이스, watch --path/--on-change ad-hoc 모드, build presets.'
pubDate: '2026-04-15'
seq: 19
type: 'feat'
commits: ['aeefede', '52b46f4', '097b0d1', '5c2f3a7', '94fdf71']
tags: ['operability', 'run', 'config', 'watch', 'build']
draft: false
---

## `udit run` — 태스크 러너 (Phase 5.3)

### .udit.yaml의 tasks

```yaml
tasks:
  test:
    description: "Run all EditMode tests"
    run: udit test run --mode editmode --output results.xml
  
  rebuild:
    description: "Refresh + dev build"
    run:
      - udit editor refresh --wait
      - udit build player --config debug
  
  shader-watch:
    description: "Watch shaders, refresh on change"
    run: udit watch --path "Assets/Shaders/**" --on-change "udit editor refresh --wait"
```

### 실행

```bash
udit run test
udit run rebuild
udit run shader-watch
udit run             # 사용 가능한 task 목록
```

### list 출력

```bash
udit run
# Available tasks:
#   test          Run all EditMode tests
#   rebuild       Refresh + dev build
#   shader-watch  Watch shaders, refresh on change
```

### Make-lite

의존성 그래프 / 병렬 실행 / 조건부 등 **의도적으로 안 넣음**. 그게 필요하면 진짜 Make 또는 Just 사용. udit `run`은 "한 줄 또는 짧은 시퀀스의 단축키" 정도.

## `udit config` 네임스페이스

```bash
udit config show              # 현재 머지된 설정 (모든 layer)
udit config show --raw        # raw .udit.yaml만
udit config validate          # 스키마 검증
udit config path              # 사용 중인 .udit.yaml 절대경로
udit config edit              # $EDITOR로 열기
```

### `show`

```bash
udit config show
```

```yaml
# Resolved config (sources merged):
default_port: 8590                           # source: .udit.yaml
build:
  presets:
    debug:
      target: StandaloneWindows64            # source: .udit.yaml
      development: true                      # source: .udit.yaml
watch:
  default_paths:
    - "Assets/Scripts/**"                    # source: .udit.yaml
  debounce: 200ms                            # source: built-in default
```

각 키 옆에 어디서 왔는지 표시 → 디버깅 강력.

### `validate`

```bash
udit config validate
# ✓ default_port: 8590 (valid)
# ✓ build.presets.debug.target: "StandaloneWindows64" (valid)
# ⚠ build.presets.debug.compression: "lz4" (unknown field, ignored)
# ✗ watch.debounce: "200" (expected duration like "200ms")
```

오타 / 잘못된 값 즉시 알림. CI에서 `udit config validate || exit 1`.

### `edit`

```bash
udit config edit
```

`$EDITOR` 또는 fallback (vim/nano/notepad)로 `.udit.yaml` 열기. 저장 후 자동 검증.

## `udit watch` — Ad-hoc 모드

config 안 만들고 인라인:

```bash
udit watch --path "Assets/Shaders/**" --on-change "udit editor refresh --wait"
```

`.udit.yaml`의 watch 섹션 무시 (override). 일회성 워크플로우 + 빠른 실험에 좋음.

### 옵션

```bash
udit watch \
  --path "Assets/**" \
  --ignore "**/Library/**" \
  --debounce 500ms \
  --on-change "udit editor refresh"
```

다중 path:
```bash
udit watch \
  --path "Assets/Scripts/**" \
  --path "Assets/Shaders/**" \
  --on-change "udit run rebuild"
```

`run` 명령과 조합:
```yaml
# .udit.yaml
tasks:
  dev:
    run: udit watch --path "Assets/**" --ignore "**/Library/**" --on-change "udit editor refresh"
```

```bash
udit run dev
```

## Build Presets

`.udit.yaml`의 빌드 프리셋:

```yaml
build:
  presets:
    debug:
      target: StandaloneWindows64
      development: true
      output: "Build/Debug/MyGame.exe"
    
    production:
      target: StandaloneWindows64
      il2cpp: true
      stripping: high
      compression: lz4
      output: "Build/Release/MyGame.exe"
    
    mobile-debug:
      target: Android
      development: true
      il2cpp: false
      output: "Build/Mobile/MyGame.apk"
```

```bash
udit build player --config production
udit build player --config mobile-debug
```

### 새 옵션: --il2cpp

```bash
udit build player --il2cpp
```

scripting backend 명시. `il2cpp: true` = IL2CPP, false = Mono.

### Override

```bash
udit build player --config production --output "Custom/Path.exe"
```

CLI 플래그가 preset value override.

## ci(go): setup-go 1.25 bump

GitHub Actions의 setup-go를 1.25로. go.mod의 toolchain과 매칭 — drift 방지:

```yaml
# .github/workflows/ci.yml
- uses: actions/setup-go@v5
  with:
    go-version: '1.25'      # 이전 1.21 → 1.25
```

go.mod:
```go
module github.com/momemoV01/udit
go 1.21
toolchain go1.25.0
```

CI와 로컬 toolchain 일치 → "내 컴퓨터에선 빌드되는데 CI에서 안 되는" 케이스 0.

<aside class="callout callout-note">
<span class="callout-label">왜 run에 의존성 그래프 안 넣나</span>

설계 결정. CI/Make 같은 도구가 더 잘함. udit `run`은 "한 줄 단축키" 또는 "짧은 시퀀스" 정도. 복잡해지기 시작하면 Make로 옮기시오.

작은 것 작게 유지 = 좋은 도구의 표시.
</aside>

<aside class="callout callout-note">
<span class="callout-label">watch ad-hoc vs config</span>

config는 반복 쓸 때, ad-hoc는 일회성. 둘 다 필요한데 둘 다 한 명령에서 — 옵션이 중복되지 않게 신경.
</aside>

## 다음

Component-set 직렬화 4 슬라이스 → v0.9.0. 이건 큰 마일스톤.
