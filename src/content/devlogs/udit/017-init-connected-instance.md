---
title: 'init scaffold + connected-instance 타겟팅'
description: 'udit init으로 .udit.yaml 자동 생성. init/watch가 cwd 대신 연결된 Unity 프로젝트 루트를 우선.'
pubDate: '2026-04-15'
seq: 17
type: 'feat'
commits: ['b3034f0', 'c767014', 'd157917', '80f3df4']
tags: ['init', 'config', 'connected-instance']
draft: false
---

## `udit init` — 셋업 자동화

처음 사용자가 `.udit.yaml` 직접 작성 → 막막함. `udit init`이 인터랙티브 또는 기본값으로:

```bash
cd ~/Game/MyGame
udit init
```

```yaml
# .udit.yaml created at ~/Game/MyGame
default_port: 8590

build:
  presets:
    debug:
      target: StandaloneWindows64
      development: true
    production:
      target: StandaloneWindows64
      il2cpp: true

watch:
  default_paths:
    - "Assets/Scripts/**"
    - "Assets/Shaders/**"
  ignore:
    - "**/Library/**"
    - "**/Temp/**"
    - "**/.meta"

# (more sections you can fill later)
# tasks:
#   rebuild:
#     run:
#       - udit editor refresh --wait
#       - udit build player --config debug
```

기본값이 즉시 동작. 더 세팅할 거 있으면 주석된 섹션 참고.

### Force / Skip 옵션

```bash
udit init --force          # 기존 .udit.yaml 덮어쓰기
udit init --no-watch       # watch 섹션 빼기
udit init --target Mac     # 빌드 타겟 명시
```

## fix(init): default target = Unity project root

### Bug

```bash
cd ~/Documents
udit init       # ← 여기 .udit.yaml 만들어짐
```

문제: 사용자가 cd ~/Documents에 잠깐 와서 init하면, 거기 빈 디렉토리에 .udit.yaml 생성. Unity 프로젝트랑 무관.

### 해결

connected Unity 인스턴스 있으면 그 프로젝트 루트가 default:

```go
func ResolveInitTarget(flag string) string {
    if flag != "" {
        return flag  // 사용자 명시
    }
    if connected := FindConnectedUnity(); connected != nil {
        return connected.ProjectPath  // Unity 프로젝트 루트
    }
    cwd, _ := os.Getwd()
    return cwd  // fallback
}
```

이제:
```bash
cd ~/Documents              # 어디서 실행하든
udit init                    # connected Unity 있으면 그 프로젝트 루트에 생성
# Created: /Users/momemo/Game/MyGame/.udit.yaml
```

cwd-aware tool들의 흔한 함정 회피. fallback은 cwd 그대로.

## feat(watch): connected-instance layer

같은 패턴을 watch에도:

```bash
udit watch        # ← 어떤 프로젝트의 watch?
```

기존: `.udit.yaml` 검색 시작점이 cwd. 연결된 Unity와 다른 디렉토리에 있으면 잘못된 config 로드.

해결: config resolution이 init과 동일한 우선순위:
1. CLI 플래그 (`--config`)
2. 환경변수 (`UDIT_CONFIG`)
3. **Connected Unity의 `.udit.yaml`** ← 새 layer
4. cwd부터 거슬러 올라가며 `.udit.yaml`
5. `~/.config/udit/config.yaml`

```go
func ResolveConfig() (*Config, error) {
    if flag := os.Getenv("UDIT_CONFIG"); flag != "" {
        return loadFromPath(flag)
    }
    if connected := FindConnectedUnity(); connected != nil {
        if cfg, err := loadFromPath(filepath.Join(connected.ProjectPath, ".udit.yaml")); err == nil {
            return cfg, nil
        }
    }
    if cfg, err := findInParents(); err == nil {
        return cfg, nil
    }
    return loadUserConfig()
}
```

### 결정

> "사용자가 명령 칠 때 Unity가 이미 떠 있으면, **그게 그 명령의 컨텍스트**"

cwd는 부정확한 시그널. Unity 인스턴스는 분명한 시그널.

## 사용 시나리오

### Multi-project 작업

```bash
# 작업 1: MyGame 열려 있음
udit watch    # MyGame의 .udit.yaml 사용 ✓

# 작업 2: 다른 터미널에서 cd ~/AnotherGame; Unity 열기
udit watch    # AnotherGame의 .udit.yaml 사용 ✓
```

각 터미널이 자동으로 올바른 컨텍스트.

### CI

CI 환경엔 connected Unity 없음 → cwd / `--config` 명시 fallback.

<aside class="callout callout-note">
<span class="callout-label">왜 환경변수가 connected-instance보다 우선?</span>

CI / Docker 같은 격리 환경에서 명시적 override 필요. 환경변수가 가장 명시적.
</aside>

<aside class="callout callout-note">
<span class="callout-label">connected-instance를 default보다 우선한 이유</span>

자동화의 핵심 = "내가 어디 있는지 자동으로 알아내기". cwd는 "사용자가 마지막에 cd 친 곳"이지 "사용자 의도"가 아님. Unity 인스턴스는 의도.
</aside>

## 다음

SSE 기반 log tail. 실시간 콘솔 스트림. Phase 5.2.
