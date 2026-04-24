---
title: 'README 슬리밍 + 문서 분할'
description: '9KB README를 1차 인상에 집중. 풀 레퍼런스/가이드/쿡북은 docs/로 분리. README ↔ docs 양방향 링크.'
pubDate: '2026-04-16'
seq: 28
type: 'docs'
commits: ['3ef6aa3']
tags: ['docs', 'readme', 'first-impression']
draft: false
---

## 문제

README가 점점 커져서 9KB 도달. 첫 방문자가 한 번에 다 못 읽음. 결과: 핵심 가치 명제가 묻힘.

readme의 역할 = "이 도구 뭔지, 5초 안에 결정 도와주기". 너무 길면 그 역할 실패.

## 새 구조

### README.md (~3KB) — 1차 인상

**Above-the-fold** (첫 화면):
- 한 줄 가치 명제: "Unity editor, from the command line. Built for AI agents, works with anything."
- 빠른 설치 (3 줄)
- 5줄 quick start (가장 임팩트 있는 명령들)

**스크롤하면**:
- "How it works" — 다이어그램 1개
- 명령 카테고리 표 (compact 13 줄)
- 더 알고 싶으면 → 링크들 (docs/COMMANDS, docs/CUSTOM_TOOLS, docs/COOKBOOK)

### docs/ — 깊이 있는 자료

| 파일 | 역할 |
|------|------|
| `docs/COMMANDS.md` | 풀 레퍼런스 — 모든 명령 + 모든 플래그 + 예시 |
| `docs/CUSTOM_TOOLS.md` | `[UditTool]` 작성 가이드 — 코드 샘플 + attribute 레퍼런스 |
| `docs/COOKBOOK.md` | 워크플로우 레시피 — "이 작업 어떻게?" |
| `docs/ERROR_CODES.md` | UCI 에러 코드 레지스트리 (절대 재사용 금지) |
| `docs/ROADMAP.md` | 결정 로그 + 다음 단계 + v1.x follow-ups |

각 문서 별도 책임. 한 파일이 모든 거 담으려 안 함.

## README before / after

### Before (9KB)

```markdown
# udit

[long description with 5 paragraphs about background and motivation]

## Installation
[10 different scenarios with details]

## Quick Start
[20 commands]

## All Commands
[full reference, 80+ commands]

## Architecture
[architecture diagram + 3 paragraphs explanation]

## Custom Tools
[full guide on writing your own tools, 30 examples]

## Performance
[benchmark table]

## Security
[security model]

## Compared to MCP
[comparison]

## API Stability
[full stability table]

## Unity Compatibility
[compatibility matrix]

## Documentation
[just lists docs/ files]

## Acknowledgments
[upstream credit]

## Maintainer
## License
```

### After (~3KB)

```markdown
# udit

[English](README.md) | [한국어](README.ko.md)

> Unity editor, from the command line. Built for AI agents, works with anything.

**No server. No config. No process to manage. Just type a command.**

## Install

```bash
# Linux / macOS
curl -fsSL https://.../install.sh | sh

# Windows (PowerShell)
irm https://.../install.ps1 | iex

# Or: go install github.com/momemoV01/udit@latest
```

## Unity Setup

Package Manager → Add package from git URL:
```
https://github.com/momemoV01/udit.git?path=udit-connector
```

Connector starts automatically. No configuration needed.

## Quick Start

```bash
udit status                                       # Check Unity connection
udit editor play --wait                           # Enter play mode
udit exec "return Application.dataPath;"          # Run C# code
udit console --type error                         # Read error logs
udit go find --name "Player*"                     # Find GameObjects
udit build player --config production             # Build a player
```

## Commands at a glance

| Category | Commands |
|----------|----------|
| Editor | `play \| stop \| pause \| refresh` |
| Scene | `list \| open \| save \| tree` |
| GameObject | `find \| inspect \| create \| move` |
| Component | `list \| get \| set \| add \| remove` |
| Asset | `find \| inspect \| dependencies \| references` |
| Build | `player \| addressables \| cancel` |
| Test | `list \| run` |
| Exec | `exec "<C# code>"` |
| ... | ... |

**Full reference:** [docs/COMMANDS.md](./docs/COMMANDS.md)

## How It Works

```
Terminal              Unity Editor
─────                 ────────────
$ udit editor play
    │
    ├─ HTTP POST → 127.0.0.1:8590/command
    │
    └─ JSON response
       { "success": true, "message": "Entered play mode." }
```

The Connector opens an HTTP server, writes a heartbeat file, and routes commands to `[UditTool]` handlers. Survives domain reloads. No external dependencies.

## More

- [Custom Tools](./docs/CUSTOM_TOOLS.md) — Write your own commands
- [Cookbook](./docs/COOKBOOK.md) — Workflow recipes
- [Error Codes](./docs/ERROR_CODES.md) — UCI-xxx registry
- [Roadmap](./docs/ROADMAP.md) — Decision log

## Acknowledgments

udit is a fork of [unity-cli](https://github.com/youngwoocho02/unity-cli) by DevBookOfArray. See [NOTICE.md](./NOTICE.md).

## License

MIT — see [LICENSE](./LICENSE).
```

훨씬 짧음. 첫 방문자가 30초 안에 가치 명제 + 설치 + 빠른 시작 다 봄.

## Korean README도 같은 구조

`README.ko.md`도 동일 슬리밍 + 같은 문서 링크. 한국어 사용자도 동일 첫인상.

## docs/ 디렉토리 자체도 정비

각 문서마다 **navigation links** (top + bottom):

```markdown
# docs/COMMANDS.md

[← README](../README.md) | [Custom Tools →](./CUSTOM_TOOLS.md)

# Full Command Reference
...

[← README](../README.md) | [Custom Tools →](./CUSTOM_TOOLS.md)
```

선형 읽기 순서 + escape route.

## 메모

**왜 README slim이 어려운가**

길게 쓰는 게 짧게 쓰는 것보다 쉬움. 매 줄 "여기 들어갈 만큼 중요한가" 자체검열 필요.

판단 기준: **첫 방문자가 30초 안에 "이게 뭐 하는 도구고 나한테 필요한가" 결정 가능해야 함**. 그 이상 정보는 docs/.

**왜 architecture 다이어그램 README에 남겼나**

"how it works"는 신뢰 시그널. 30초 사용자는 안 읽고 지나가지만, 1분 사용자는 읽고 "오 진지하구나" 인상. 작은 다이어그램 = 적은 비용 + 큰 신호.

## 다음

🎉 v1.0.0 release.
