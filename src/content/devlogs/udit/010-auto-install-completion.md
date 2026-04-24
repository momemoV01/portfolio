---
title: 'v0.10.0 — 셸 자동완성 자동 설치'
description: 'install.sh / install.ps1이 자동완성 스크립트도 같이 설치. completion install 명령 추가.'
pubDate: '2026-04-15'
seq: 10
type: 'feat'
tags: ['completion', 'install', 'ux', 'v0.10.0']
draft: false
---

## 문제

CLI 도구의 자동완성은 사용자가 직접 셋업해야 함. `udit completion bash > /etc/...` 같은 보일러플레이트. 첫 사용자 ~80%가 안 함.

## 해결

`install.sh` / `install.ps1`이 udit 바이너리 설치 후 **자동으로 셸 자동완성도 설치**:

```bash
# install.sh 내부
udit completion install --shell auto
```

`--shell auto`: `$SHELL` 감지해서 bash/zsh/fish/pwsh 알맞은 거 선택.

## 새 명령: `completion install`

수동 설치도 깔끔하게:
```bash
udit completion install                # auto-detect
udit completion install --shell zsh    # 명시
udit completion install --uninstall    # 제거
```

설치 위치는 셸 표준 경로:
- bash → `~/.bash_completion.d/udit` 또는 `/etc/bash_completion.d/udit`
- zsh → `~/.zsh/completion/_udit`
- fish → `~/.config/fish/completions/udit.fish`
- pwsh → `$PROFILE`에 `Register-ArgumentCompleter` 추가

## 메모

작은 UX 디테일이지만 **첫인상의 80%**. 처음 명령 치고 Tab 눌렀을 때 동작하는지 안 하는지가 "이 도구 만든 사람 신경썼나" 시그널.

## v0.10.0 릴리스

마지막 minor 전 품질 정비. 다음은 1.0.
