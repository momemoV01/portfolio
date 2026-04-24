---
title: 'build player — IL2CPP + presets'
description: 'udit build player에 --il2cpp / --config <preset> 추가. CI Go 1.25 매칭.'
pubDate: '2026-04-15'
seq: 4
type: 'feat'
tags: ['build', 'il2cpp', 'preset']
draft: false
---

## 추가

**`--il2cpp`**: Mono 대신 IL2CPP 백엔드로 빌드. 모바일/콘솔 타깃에 필요.

**`--config <preset>`**: `.udit.yaml`에 정의한 빌드 프리셋 사용. 예:
```yaml
build:
  presets:
    production:
      target: StandaloneWindows64
      il2cpp: true
      stripping: high
    debug:
      target: StandaloneWindows64
      development: true
```

```bash
udit build player --config production
```

## CI

`setup-go`를 1.25로 bump. go.mod toolchain과 매칭 — drift 방지.

## 메모

빌드 옵션은 surface가 큰 영역이라 전부 플래그로 노출하면 끝없음. preset로 묶는 게 정답. 사용자가 `.udit.yaml`에 한 번 정의해두면 매번 `--config name`만.
