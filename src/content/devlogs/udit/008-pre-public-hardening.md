---
title: 'v0.9.1 — 사전 공개 보안 하드닝'
description: 'Go 1.26, gitignore 정비, dependabot, trust model 명문화. 공개 리포 거버넌스 문서.'
pubDate: '2026-04-15'
seq: 8
type: 'security'
tags: ['security', 'governance', 'public-prep', 'v0.9.1']
draft: false
---

## 동기

리포 public 전환 직전. 한 번 공개하면 첫인상이 곧 신뢰. 청소.

## 보안

- **Go 1.26 업그레이드** — 최신 보안 패치
- **`.gitignore` 정비** — IDE 잡파일, 빌드 산출물 제외 확인
- **Dependabot 활성화** — 의존성 취약점 자동 PR
  - major bump은 차단 (artifact-actions pair 등 동기화 깨짐 방지)
- **Trust Model 명문화**:
  - localhost-only (`127.0.0.1` 바인딩)
  - 브라우저 `Origin` 헤더 거부 (CSRF 차단)
  - `exec` / `menu` / `run`은 의도된 권한 — untrusted input 흘리지 말 것
  - 업데이트는 HTTPS + (다음 단계에서 SHA256)

## 거버넌스 문서

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md` (취약점 보고 채널)
- `NOTICE.md` (원작자 크레딧)

## README 1차 리프레시

공개 전환 직전 첫인상 surface 정비. 한 줄 가치 명제 + 빠른 시작 위주.

## v0.9.1 릴리스

소소하지만 모두 공개 직전 중요한 항목. 1.0 체크리스트의 "신뢰 부분".
