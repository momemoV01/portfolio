---
title: 'v0.10.0 — 셸 자동완성 자동 설치'
description: 'install.sh / install.ps1이 udit 바이너리 + 셸 자동완성 같이 설치. completion install 명령 추가.'
pubDate: '2026-04-15'
seq: 25
type: 'feat'
commits: ['fe4f3b4', '059cb45', 'ab78f5b']
tags: ['completion', 'install', 'ux', 'v0.10.0', 'release']
draft: false
---

## 문제

CLI 도구의 자동완성 = 첫인상 80%. 근데 사용자가 직접 셋업해야 함:

```bash
# Before
udit completion bash > ~/.bash_completion.d/udit
# 또는 zsh / fish / pwsh 알맞게...
source ~/.bash_completion.d/udit  # 또는 새 셸
```

대부분 사용자가 이걸 하지 않음. 결과: TAB 안 됨. 결과: "이 도구 별로네" 인상.

## 해결: install 시 자동 설치

`install.sh`:
```bash
#!/usr/bin/env bash
set -e

# 1. 바이너리 다운로드 + 설치
TARGET="$HOME/.local/bin/udit"
curl -sSL https://github.com/momemoV01/udit/releases/latest/download/udit-linux-amd64 -o "$TARGET"
chmod +x "$TARGET"

# 2. 셸 자동완성 자동 설치
"$TARGET" completion install --shell auto

echo "✓ udit installed at $TARGET"
echo "✓ shell completion installed for $SHELL"
echo ""
echo "Restart your shell or run: source ~/.bashrc"
```

`install.ps1`:
```powershell
$target = "$env:USERPROFILE\.local\bin\udit.exe"
Invoke-WebRequest -Uri "..." -OutFile $target

& $target completion install --shell auto

Write-Host "✓ udit installed at $target"
Write-Host "✓ pwsh completion added to `$PROFILE"
Write-Host ""
Write-Host "Restart pwsh or run: . `$PROFILE"
```

## 새 명령: `completion install`

수동 설치도 깔끔하게:

```bash
udit completion install                   # auto-detect $SHELL
udit completion install --shell zsh        # 명시
udit completion install --shell powershell # Windows
udit completion install --uninstall        # 제거
udit completion install --print-only       # 안 설치, 경로만 출력
```

### 셸 감지

```go
func DetectShell() string {
    if shell := os.Getenv("SHELL"); shell != "" {
        return filepath.Base(shell)  // "/bin/zsh" → "zsh"
    }
    if runtime.GOOS == "windows" {
        return "powershell"
    }
    return "bash"  // fallback
}
```

### 설치 위치 (셸별)

| Shell | Path | Note |
|-------|------|------|
| bash (Linux) | `~/.bash_completion.d/udit` 또는 `/etc/...` | user prefix는 ~ |
| bash (macOS) | `/usr/local/etc/bash_completion.d/udit` | homebrew 표준 |
| zsh | fpath 안의 `_udit` 파일 | `~/.zsh/completion/_udit` |
| fish | `~/.config/fish/completions/udit.fish` | 표준 |
| pwsh | `$PROFILE`에 inline | 별도 파일 안 함 |

### Sentinel marker (재설치 안전)

Phase 1 wrap에서 만든 sentinel 시스템 활용. 재설치 시 중복 라인 안 쌓임:

```bash
# >>>UDIT-COMPLETION-START<<<
_udit_complete() { ... }
complete -F _udit_complete udit
# >>>UDIT-COMPLETION-END<<<
```

## 동적 자동완성 (보너스)

정적 명령/플래그 외에 **런타임 결정** 값도 자동완성:

```bash
udit go find --name <TAB>
# Player Enemy1 Enemy2 Boss ...
```

cobra의 `RegisterFlagCompletionFunc`:

```go
goFindCmd.RegisterFlagCompletionFunc("name", func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
    // Connected Unity에 query
    matches, err := queryUnityForGameObjects(toComplete)
    if err != nil {
        return nil, cobra.ShellCompDirectiveError
    }
    return matches, cobra.ShellCompDirectiveNoFileComp
})
```

Unity 살아있을 때만 동작. 죽어 있으면 정적 완성만.

## docs(roadmap) 업데이트

```markdown
### v0.10.0 — Completion auto-install
- [x] install.sh / install.ps1 셸 자동완성 자동 설치
- [x] `completion install` 명령
- [x] Sentinel marker 활용 (재설치 안전)
- [x] `--shell auto` 자동 감지
- [x] `--uninstall` 제거 옵션
```

이게 마지막 minor 전. 다음은 v1.0.

<aside class="callout callout-note">
<span class="callout-label">왜 자동완성에 시간 들이는가</span>

CLI 첫 1분 사용자 경험:
1. 설치 (10초)
2. 첫 명령 (5초)
3. 두 번째 명령 → **TAB 누름**
4a. 동작 → "오 신경 썼네" → 신뢰 +1
4b. 안 동작 → "별 거 없네" → 신뢰 -1

이 4번에서 갈림. 자동 설치가 default 동작 → 모든 사용자가 4a 경험.
</aside>

<aside class="callout callout-note">
<span class="callout-label">왜 `--print-only` 같은 옵션도?</span>

custom shell setups (oh-my-zsh, prezto, fish-shell prompt 등)에서 자체 관리하고 싶은 사용자. 강제 설치 대신 path만 출력 → 사용자가 자기 시스템에 통합.

도구가 사용자 시스템을 존중. 이게 적은 마찰.
</aside>

## 다음

v1.0 진입 — pre-release sweep (D1-D8, R1-R5).
