---
title: 'v0.9.1 — Pre-public 보안 하드닝'
description: 'Go 1.26, .gitignore 정비, dependabot, trust model 명문화, 거버넌스 문서. 공개 직전 정비.'
pubDate: '2026-04-15'
seq: 22
type: 'security'
commits: ['785b904', 'fffdb27', '0f51976']
tags: ['security', 'governance', 'public-prep', 'v0.9.1', 'release']
draft: false
---

## 왜 지금

리포 public 전환 직전. 한 번 공개하면 첫인상이 곧 신뢰. 청소 + 약속 명문화.

## Go 1.26 업그레이드

### 이유

Go 1.25 → 1.26:
- 보안 패치 (CVE-2026-xxxx 시리즈)
- Garbage collector 개선
- Generic 관련 컴파일러 개선

### 영향

대부분 코드 그대로. 단 일부 deprecated stdlib 패턴 정리:
```go
// Before (1.25 deprecated, 1.26 removed)
ioutil.ReadFile(...)

// After
os.ReadFile(...)
```

go.mod 갱신:
```go
go 1.26
toolchain go1.26.0
```

CI도 1.26으로:
```yaml
go-version: '1.26'
```

## .gitignore 정비

```gitignore
# Build artifacts
/dist
/build
*.exe
*.dll
*.so
*.dylib

# Go
/vendor

# Test
*.test
coverage.out
*.junit.xml

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Local
.env
.env.local
.udit.local.yaml

# Unity-specific (we host the Connector code, not the test project)
/Tests/UnityProject/Library
/Tests/UnityProject/Temp
/Tests/UnityProject/Logs
/Tests/UnityProject/UserSettings
```

체크된 거 없는지 검증:
```bash
git ls-files | xargs file | grep -E "ELF|PE32|Mach-O" || echo "clean"
```

## Dependabot

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  # Go modules
  - package-ecosystem: "gomod"
    directory: "/"
    schedule:
      interval: "weekly"
    
  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    # major bump은 차단 (artifact-actions pair 동기화 깨짐)
    ignore:
      - dependency-name: "actions/upload-artifact"
        update-types: ["version-update:semver-major"]
      - dependency-name: "actions/download-artifact"
        update-types: ["version-update:semver-major"]
```

매 주 PR로 의존성 업데이트 알림. major bump은 수동 review.

## Trust Model 명문화

`SECURITY.md`:

```markdown
# Security Policy

## Trust Model

udit assumes a **trusted local user with the Editor open**.

### Transport
- Localhost-only (`127.0.0.1` binding)
- Browser `Origin` headers rejected (CSRF prevention)
- HTTPS not used (localhost is implicit-trusted; key rotation overhead vs zero gain)

### Code Execution as a Feature
- `udit exec`, `udit menu`, `udit run` have full Editor privileges
- **Do not pipe untrusted input** to these commands
- Treat `.udit.yaml` like a Makefile — review before running

### Updates
- HTTPS download from GitHub Releases (verified via TLS)
- SHA256 checksum verification (added in v1.0)
- Future: GPG signature

### Out of Scope
- Shared machines (cross-user attacks)
- Supply-chain compromise (GitHub itself, Go modules)
- Malicious .udit.yaml in third-party projects
- Network attackers (we're localhost only)

## Reporting

Use GitHub Security Advisory:
https://github.com/momemoV01/udit/security/advisories/new
```

명시적인 약속:
- 무엇을 보호함
- 무엇을 보호 안 함 (의도적)
- 어떻게 신고

이거 없으면 사용자가 "udit이 SSH 같은 보안 모델인가?" 추측 → 잘못된 기대.

## 거버넌스 문서

`CONTRIBUTING.md`:
```markdown
# Contributing to udit

## Quick Start
- Fork
- Make change in feature branch
- Run `udit test run` (all green)
- PR with conventional commit message (feat/fix/refactor/...)

## Decision Log
Major decisions go to docs/ROADMAP.md#decision-log.
Don't make architectural decisions in PR comments — they get lost.
```

`CODE_OF_CONDUCT.md`: Contributor Covenant v2.1 그대로. 표준이라 자체 작성보다 신뢰.

`PULL_REQUEST_TEMPLATE.md`:
```markdown
## What
<!-- what changed -->

## Why
<!-- why -->

## Test plan
<!-- how to verify -->

## Notes for reviewer
<!-- gotchas, decisions made -->
```

## v0.9.1 릴리스

들어간 것:
- Go 1.26
- .gitignore 정비
- Dependabot 설정
- SECURITY.md (trust model)
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, PR template

작아 보이지만 모두 **공개 직전 신뢰 항목**. 1.0의 전제 조건.

## 메모

**왜 .gitignore가 보안인가**

`.env` 같은 거 실수로 commit하면 secret 유출. 한 번 git history에 들어가면 force-push로도 완전 제거 안 됨. 사전 차단이 답.

**왜 dependabot major bump 차단?**

`upload-artifact@v6` ↔ `download-artifact@v7` 같은 페어 의존성. 한 쪽만 bump하면 파이프라인 깨짐. 자동 PR이 시도하면 노이즈. 페어로만 수동 처리.

**왜 SECURITY.md를 그렇게 솔직하게?**

"보호 안 함" 명시가 신뢰. 모든 시나리오 다 보호한다고 약속하면 거짓말. 명확한 한계 = 솔직 + professional.

## 다음

리팩토링 — root.go split, ManageComponent partial 분리. v1.0 직전 코드 청결.
