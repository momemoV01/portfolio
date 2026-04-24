---
title: 'Sprint 3 — 테스트 커버리지 + 10k 벤치마크'
description: '10k GameObject 씬에서 모든 쿼리 1초 미만 검증. circuitBreaker, parsers, log 등 커버리지 갭 채움.'
pubDate: '2026-04-15'
seq: 7
type: 'test'
tags: ['testing', 'benchmark', 'coverage']
draft: false
---

## 동기

v1.0 진입 전에 "내가 모르는 깨진 길"이 없도록. 특히 성능 — 사용자가 큰 씬 들고 와서 느리면 곤란.

## C1 — 10k GameObject 벤치

씬에 10,762 GameObject + 자산 풀로 측정.

| Query | ms |
|-------|---:|
| `scene tree` | 550 |
| `go find --name` | 760 |
| `go inspect` | 450 |
| `asset references` | 960 |
| `asset dependencies` | 440 |

**모든 쿼리 1초 미만**. 명시적 SLO로 ROADMAP에 박음.

## C2 — 커버리지 갭

테스트 없던 곳들:
- `circuitBreaker.Reset` (재시도 회로 차단기)
- 프린터 JSON 경로 (출력 포맷 분기)
- 로그 reconnect backoff
- `WrapExecError` (exec 에러 래핑)
- `run` 명령 프린터/parse 에러 분기

## C3 — 파서 통일

`TryParseVector3`가 3개 Tools 클래스에 중복 → `ParamCoercion`에 통합. 프리미티브 파서 (Bool/Vector/Color/Enum) 픽스.

## 메모

벤치마크는 별로 화려하지 않은데, 사용자한테 "10k까지는 보장"이라고 약속할 수 있게 해줌. 이게 진짜 가치.
