---
title: 'v1.0.0 릴리스 🎉'
description: '3일 만에 포크에서 v1.0.0까지. SemVer 진입, API 안정성 약속, v1.x Follow-ups 명시.'
pubDate: '2026-04-16'
seq: 14
type: 'release'
tags: ['v1.0', 'release', 'semver']
draft: false
---

## 🎉 v1.0.0

3일 만에 도달.

## v1.0 안정성 약속

| Surface | Stable |
|---------|--------|
| CLI 명령 & 서브명령 이름 | ✅ |
| CLI 플래그 이름 (`--json`, `--port` 등) | ✅ |
| JSON envelope shape (`{ success, message, data, error_code }`) | ✅ |
| 에러 코드 (UCI-xxx) — 절대 재사용 금지 | ✅ |
| 응답 필드 이름 (`data.matches`, `data.count`) | ✅ |

minor 버전에서 후방호환 추가만, major에서만 breaking (deprecation 절차 거친 후).

## CI 마무리 (이 릴리스에 들어간 작은 수정)

- Release 워크플로우의 `upload-artifact` glob을 빌드 결과물로만 한정 (실수 방지)
- Roadmap에 v1.0.0 ✅ Done 표시 + v1.x Follow-ups 섹션 신설

## v1.x Follow-ups (이후 작업, 후방호환)

릴리스 미루지 않고 명시한 후속:

**테스트**
- Connector NUnit 커버리지 확장

**문서**
- Cookbook 20개 채우기
- 자동 생성 Tool Reference
- Migration 가이드 (1.x 마이너 변화 추적)

**보안 audit**
- heartbeat 파일 0600 권한
- GitHub Actions SHA pinning
- macOS 코드 서명
- menu blacklist (위험 메뉴 차단)
- exec audit log

**Cross-cutting**
- `api_version` 응답 필드
- auto pagination
- ID prefixes (충돌 방지)
- `--output yaml/csv`

**기능**
- 실시간 build progress
- watch 스트레스 테스트
- `udit context` (현재 환경 요약)
- `udit explain <error_code>` (에러 코드 설명)

## 회고

3일 짜리 스프린트치고 안정적. 핵심 인사이트:

1. **포크의 강점**: 코어 검증된 상태에서 시작 → 변형/확장에 100% 투자
2. **슬라이스 단위 릴리스**: v0.9.0을 4개로 쪼개니 각각 작고 검증 가능
3. **AI 페어 (Claude Opus 4.6)**: Co-Authored-By 시스템 — 컨텍스트 손실 없이 동시 진행
4. **Day 01에 ROADMAP.md 그린 게 결정적**: 큰 그림 명확하니까 매 커밋의 위치 확실

## 다음 스프린트

Cookbook 채우기. 사용자 시나리오 기반 — "이 작업 어떻게 하나요?" 레시피 20개 목표.
