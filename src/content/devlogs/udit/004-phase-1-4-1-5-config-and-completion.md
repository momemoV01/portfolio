---
title: 'Phase 1.4-1.5 — .udit.yaml 설정 + 셸 자동완성 4종'
description: '프로젝트별 기본 설정 파일과 bash/zsh/powershell/fish 자동완성 스크립트 자동 생성.'
pubDate: '2026-04-14'
seq: 4
type: 'feat'
commits: ['4d8758d', '5711aab']
tags: ['phase-1', 'config', 'completion', 'ux']
draft: false
---

## Phase 1.4 — `.udit.yaml`

### 문제

매번 같은 플래그 치는 피로감:
```bash
udit --port 8590 --project ~/Game/MyProject editor play
udit --port 8590 --project ~/Game/MyProject scene tree
udit --port 8590 --project ~/Game/MyProject build player --config production
```

`--port` `--project` 매번 반복 → 오타 / 혼동.

### 해결: 프로젝트 설정 파일

`<project>/.udit.yaml`:
```yaml
# udit project config
default_port: 8590

build:
  presets:
    production:
      target: StandaloneWindows64
      il2cpp: true
      stripping: high
    debug:
      target: StandaloneWindows64
      development: true

watch:
  default_paths:
    - "Assets/Scripts/**"
    - "Assets/Shaders/**"
  ignore:
    - "**/.meta"
    - "**/Library/**"

tasks:
  rebuild:
    run:
      - udit editor refresh --wait
      - udit build player --config debug
```

### 우선순위

설정 머지 우선순위 (높은 게 이김):
1. CLI 플래그 (`--port 1234`)
2. 환경변수 (`UDIT_PORT=1234`)
3. `.udit.yaml`의 명령별 섹션 (`build.presets.X`)
4. `.udit.yaml`의 글로벌 섹션 (`default_port`)
5. udit 내장 기본값

### 파일 탐색

CLI 실행 위치부터 부모 디렉토리 거슬러 올라가며 `.udit.yaml` 찾음 (git처럼). 못 찾으면 `~/.config/udit/config.yaml` fallback.

```go
func FindConfig(start string) (string, error) {
    dir := start
    for {
        candidate := filepath.Join(dir, ".udit.yaml")
        if _, err := os.Stat(candidate); err == nil {
            return candidate, nil
        }
        parent := filepath.Dir(dir)
        if parent == dir { // root
            break
        }
        dir = parent
    }
    return userConfigPath(), nil
}
```

### 검증

YAML 파싱 + 스키마 검증. 알 수 없는 필드는 **fail** (오타 일찍 잡기), strict 모드.

```bash
udit config validate
# ✓ .udit.yaml is valid
# ✓ build.presets.production.target = "StandaloneWindows64" (valid)
# ⚠ build.presets.production.compression = "lz4" — unknown field
```

## Phase 1.5 — 셸 자동완성

### 4 셸 지원

bash, zsh, PowerShell, fish — 사용자 환경 다양함. 모두 generated.

```bash
udit completion bash > /etc/bash_completion.d/udit
udit completion zsh > ~/.zsh/completion/_udit
udit completion powershell | Out-File -Encoding utf8 $PROFILE -Append
udit completion fish > ~/.config/fish/completions/udit.fish
```

### Cobra 빌트인 활용

Go의 [cobra](https://github.com/spf13/cobra) 라이브러리에 자동완성 generator 내장. udit가 cobra 기반이라 이걸 호출만 하면 됨:

```go
var completionCmd = &cobra.Command{
    Use:   "completion [bash|zsh|fish|powershell]",
    Short: "Generate shell completion script",
    DisableFlagsInUseLine: true,
    ValidArgs: []string{"bash", "zsh", "fish", "powershell"},
    Args:      cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
    Run: func(cmd *cobra.Command, args []string) {
        switch args[0] {
        case "bash":
            cmd.Root().GenBashCompletion(os.Stdout)
        case "zsh":
            cmd.Root().GenZshCompletion(os.Stdout)
        case "fish":
            cmd.Root().GenFishCompletion(os.Stdout, true)
        case "powershell":
            cmd.Root().GenPowerShellCompletionWithDesc(os.Stdout)
        }
    },
}
```

### 동적 자동완성

정적인 명령 / 플래그 외에, **런타임 결정**되는 값도 자동완성:

```bash
udit go find --name <TAB>
# Player Enemy1 Enemy2 Boss ...
```

이건 cobra의 `ValidArgsFunction` 사용 — TAB 누르면 udit이 connected Unity에 쿼리 던져서 후보 받아옴:

```go
goFindCmd.Flags().StringVar(&name, "name", "", "GameObject name")
goFindCmd.RegisterFlagCompletionFunc("name", func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
    // Unity에 query
    matches := queryUnityForGameObjects(toComplete)
    return matches, cobra.ShellCompDirectiveNoFileComp
})
```

Unity 살아있을 때만 동작. 죽어 있으면 정적 완성만.

### 설치 위치

각 셸 표준:

| Shell | Location |
|-------|----------|
| bash (Linux) | `/etc/bash_completion.d/udit` 또는 `~/.bash_completion.d/udit` |
| bash (macOS) | `/usr/local/etc/bash_completion.d/udit` (homebrew) |
| zsh | fpath 안의 `_udit` 파일 (`~/.zsh/completion/_udit`) |
| fish | `~/.config/fish/completions/udit.fish` |
| pwsh | `$PROFILE` 안에 `Register-ArgumentCompleter` 추가 |

설치 자동화는 v0.10.0 (auto-install)에서.

## 메모

**왜 .udit.yaml를 strict 모드로?**

타이포가 무성능 fail (silent ignore)이면 사용자가 "왜 적용 안 되지?" 디버깅 시간 30분. **strict로 바로 fail** → 1초 내 알림. UX는 **fail-fast**가 friendlier.

**왜 동적 자동완성에 노력 들이는가?**

자동완성 일하면 도구 신뢰도 ↑. 안 일하면 "이거 만든 사람 신경 안 썼네" 시그널. CLI 도구의 첫인상 ~80%가 TAB 동작 여부.

## 다음

Phase 1 wrap — Korean docs, 거버넌스 파일, CI 정리. 그리고 v0.2.1 릴리스.
