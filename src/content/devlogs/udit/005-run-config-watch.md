---
title: 'run + config + watch ad-hoc'
description: 'Phase 5.3 udit run 태스크 러너, udit config 네임스페이스, watch ad-hoc 모드.'
pubDate: '2026-04-15'
seq: 5
type: 'feat'
tags: ['operability', 'run', 'config', 'watch']
draft: false
---

## `udit run <task>` — 태스크 러너

`.udit.yaml`의 `tasks:` 섹션 정의된 스크립트 실행. Makefile-lite. 의존성 그래프는 일부러 안 넣음 (KISS — 그게 필요하면 진짜 Make 쓰면 됨).

```yaml
tasks:
  test:
    run: udit test run --output results.xml
  rebuild:
    run:
      - udit editor refresh --wait
      - udit build player --config debug
```

## `udit config` 네임스페이스

- `config show` — 현재 머지된 설정
- `config validate` — 스키마 검증
- `config path` — 사용 중인 파일 경로
- `config edit` — `$EDITOR`로 열기

## `udit watch` ad-hoc 모드

`.udit.yaml`에 watch 설정 미리 안 해도, 인라인으로:
```bash
udit watch --path "Assets/Scripts/**" --on-change "udit editor refresh --wait"
```

## 메모

작은 명령들이지만 매일 쓰는 거라 사용성 차이 큼. `--output` 같은 flag 일관성에 신경.
