---
title: 'v1.0.0 릴리스 🎉'
description: '3일 만에 포크에서 v1.0.0까지. SemVer 진입, API 안정성 약속, v1.x Follow-ups 명시. 회고와 다음 단계.'
pubDate: '2026-04-16'
seq: 29
type: 'release'
commits: ['08f32c0', '7c4c4dc', '1f68709']
tags: ['v1.0', 'release', 'semver', 'milestone']
draft: false
---

## 🎉 v1.0.0

3일 만에 도달.

| Date | Milestone |
|------|-----------|
| Apr 14 morning | Initial fork |
| Apr 14 afternoon | v0.2.1 (Phase 1 — JSON envelope, error codes, .udit.yaml, completion) |
| Apr 14 evening | v0.3.x (Stable IDs, Scene/GO/Component/Asset queries) |
| Apr 14 night | v0.4.x (Mutations, Prefab API, Transactions) |
| Apr 15 morning | v0.4.3 (Project, Test runner) → v0.5.0 (Package, Build) |
| Apr 15 afternoon | v0.6.0 (Watch system 4 slices) |
| Apr 15 evening | v0.9.0 (Component-set serialization) → v0.9.1 (Pre-public hardening) → v0.10.0 (Auto-install) |
| Apr 16 | v1.0 sweep + SHA256 verification + README slim + **v1.0.0** |

## v1.0 안정성 약속

```markdown
| Surface | Stable from v1.0 |
|---------|------------------|
| CLI command & subcommand names | ✅ `udit go find`, `udit editor play`, ... |
| CLI flag names | ✅ `--json`, `--port`, `--limit`, ... |
| JSON envelope shape | ✅ `{ success, message, data, error_code }` |
| Error codes (UCI-xxx) | ✅ Never reused |
| Response field names | ✅ `data.matches`, `data.count`, ... |
```

minor 버전에서 **후방호환 추가만**, major에서만 breaking (deprecation 절차 거친 후).

이게 udit가 외부 도구/AI 에이전트 시스템에 통합 가치 있게 되는 시점.

## CI 마무리

이 release에 같이 들어간 작은 픽스:

```
ci(release): scope upload-artifact glob to the built binary
```

```yaml
# Before
- uses: actions/upload-artifact@v7
  with:
    name: release-assets
    path: |
      *           # ← 너무 광범위, 실수로 .gitignore 항목 포함 가능

# After
- uses: actions/upload-artifact@v7
  with:
    name: release-assets
    path: |
      udit-linux-amd64
      udit-linux-amd64.sha256
      udit-darwin-amd64
      udit-darwin-amd64.sha256
      udit-windows-amd64.exe
      udit-windows-amd64.exe.sha256
```

명시적 path 지정. 미래 누군가 `--include` 같은 거 추가해도 release artifact 안 늘어남.

```
docs(roadmap): reflect v1.0.0 release + add v1.x Follow-ups
```

ROADMAP.md에:
- Phase 1-6 모두 ✓ Done
- v1.x Follow-ups 새 섹션

## v1.x Follow-ups (이후 작업)

릴리스 미루지 않고 명시한 후속 작업 — 모두 후방호환 추가만:

### 테스트
- Connector NUnit 커버리지 확장 (현재 부분적, v1.x에서 100%)

### 문서
- Cookbook 20개 채우기 (현재 일부)
- 자동 생성 Tool Reference (`[UditTool]`을 스캔해서 docs 자동 생성)
- Migration 가이드 (1.x 마이너 변화 추적)

### 보안 audit
- heartbeat 파일 0600 권한 (현재 0644)
- GitHub Actions SHA pinning (`@v7` → `@<sha>`)
- macOS 코드 서명
- menu blacklist (위험 메뉴 차단)
- exec audit log (모든 exec 로깅)

### Cross-cutting
- `api_version` 응답 필드 (1.x 추적용)
- auto pagination (LIMIT 없이 호출 시 자동 페이징)
- ID prefixes 보강 (`prefab:xxxx`, `comp:xxxx`)
- `--output yaml/csv` 추가

### 기능
- 실시간 build progress (현재 끝나야만 결과)
- watch 스트레스 테스트 (10k 파일 변경)
- `udit context` (현재 환경 요약 한 줄)
- `udit explain <UCI-042>` (에러 코드 설명)

## 회고

3일 짜리 스프린트치고 안정적. 핵심 인사이트:

### 1. 포크의 강점

코어가 검증된 상태에서 시작 → 변형/확장에 100% 투자. 처음부터 만들었으면 며칠은 HTTP 브리지 / reflection / 하트비트 디자인에 다 썼을 것. 그 시간으로 application 표면 완성.

### 2. 슬라이스 단위 릴리스

가장 큰 변화 (v0.9.0의 component-set serialization)를 4 슬라이스로 쪼갠 게 결정적. 한 번에 했으면:
- 1000줄 PR
- 검증 어려움
- 한 곳 깨지면 전체 롤백

슬라이스 = 각각 작고 검증 가능. 회복 가능.

### 3. AI 페어 프로그래밍

Claude Opus 4.6과 페어. 모든 커밋에 `Co-Authored-By` 명시. 컨텍스트 손실 없이 동시 진행. 

특히 좋았던 패턴:
- 큰 작업 분해 → 4 슬라이스 같은 게 자연스럽게 나옴
- 의사결정 의문 발생 시 즉시 토의 (혼자였으면 한 시간 헤맸을 거)
- 매 커밋마다 commit message 같이 작성 → "이거 왜 했는지" 향후 분명

### 4. ROADMAP 먼저

Day 01에 ROADMAP.md 그린 게 결정적. 큰 그림 명확하니까 매 커밋의 위치 확실. "이 작업이 v0.4 마일스톤의 부분"이라고 항상 알 수 있음.

ROADMAP 없이 코딩하면 → 매 커밋마다 "다음에 뭘 할까" 의사결정 비용 + drift 가능성.

### 5. 외부 약속의 무게

v1.0 = "내가 이 surface 안 부숨"의 약속. 이 약속 가능한 시점이 곧 도구 성숙도. 1.0 진입 = 외부에서 진지하게 사용 가능 시점.

## 다음 스프린트

Cookbook 채우기. 사용자 시나리오 기반:
- "이 prefab의 모든 인스턴스 일괄 변경"
- "낡은 텍스처 자동 정리"
- "PR마다 빌드 사이즈 추적"
- "AI 에이전트로 자동 게임 디자인 변경"
- ...

레시피 20개 목표. 각각 5-10줄 yaml + 짧은 설명. 사용자가 복붙으로 즉시 활용.

## 마침

> 3일 + AI 페어 + 좋은 포크 = SemVer 1.0 도달.

이게 modern dev workflow의 효율. unity-cli 원작자에게 다시 한 번 감사. 그 뼈대 없이 여기까지 못 옴.
