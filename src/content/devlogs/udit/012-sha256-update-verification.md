---
title: 'udit update — SHA256 체크섬 검증'
description: 'GitHub Releases에서 다운받은 바이너리의 무결성 검증. HTTPS + SHA256 이중 방어.'
pubDate: '2026-04-16'
seq: 12
type: 'security'
tags: ['security', 'update', 'integrity']
draft: false
---

## 위협 모델

`udit update`는 GitHub Releases에서 새 바이너리 다운받아 자기 자신 교체. 위험:

1. **MITM 공격** — 다운로드 중 변조
2. **GitHub 침해** — 릴리스 자체가 변조됐으면

## 방어

### Layer 1: HTTPS-only
다운로드는 무조건 HTTPS. 평문 HTTP 거부. Go 표준 TLS는 시스템 신뢰 루트 사용.

### Layer 2: SHA256 체크섬 (이번 PR)

릴리스마다:
1. `release.zip` (또는 `udit.exe`)
2. `release.zip.sha256` (텍스트 파일)

`udit update` 동작:
1. release notes에서 sha256 hash 추출 (또는 `.sha256` 파일 fetch)
2. 다운받은 바이너리의 hash 계산 (Go `crypto/sha256`)
3. 미스매치 → abort, 임시 파일 삭제, 명확한 에러

```
✗ Checksum verification failed.
  expected: a3f9e8...
  got:      b1c2d4...
  Aborted. Existing binary unchanged.
```

## 한계

방어 못 하는 것:
- **GitHub 자체 침해** — release notes의 hash와 binary 둘 다 같은 공격자가 만들면 통과
- 그 시점엔 SemVer고 뭐고 의미 없음 (이미 게임오버)
- 더 단단한 방어는 GPG 서명 — 미래 개선 항목

## 메모

이런 게 v1.0 진입의 마지막 신뢰 항목. "내 도구가 사용자 머신 망가뜨릴 수 있다"는 의식. 작은 코드지만 책임 큼.
