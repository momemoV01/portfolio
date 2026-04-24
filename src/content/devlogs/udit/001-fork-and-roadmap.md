---
title: '포크 + ROADMAP — 시작점 잡기'
description: 'unity-cli를 udit으로 포크. 네이밍 정합성, asmdef 정리, v0.2.0 → v1.0.0까지의 단계별 계획 수립.'
pubDate: '2026-04-14'
seq: 1
type: 'planning'
commits: ['495cdc5', 'ef879fd', '9b8af8c']
tags: ['fork', 'planning', 'roadmap']
draft: false
---

## 시작점

[unity-cli](https://github.com/youngwoocho02/unity-cli) — DevBookOfArray가 만든 Unity Editor용 CLI. 본 순간 결정: **포크하고 확장하는 게, 비슷한 거 처음부터 만드는 것보다 절대적으로 빠르다.**

이미 검증된 4 designs:

1. **HTTP 브리지** — `localhost:8590` 단순 POST. 양방향 RPC 안 해도 됨 (단방향 명령 + 응답).
2. **리플렉션 기반 도구 발견** — `[UnityCliTool]` attribute 붙은 static 클래스 자동 등록. 라우터 코드 안 건드리고 도구 추가 가능.
3. **하트비트 파일** — Connector가 살아있을 때 `~/.udit/instances/<port>.json`에 PID + project path 기록. CLI는 이 파일들 스캔해서 어떤 Unity에 붙을지 결정.
4. **도메인 리로드 핸들링** — Unity가 C# 컴파일하면 모든 객체 reload. `[UnitySetOnLoadMethod]`로 Connector 자동 재시작.

이걸 처음부터 다시 만들면 며칠은 그냥 날아감. **포크가 답.**

## 변경 1: 네이밍

```
unity-cli → udit
[UnityCliTool] → [UditTool]
github.com/youngwoocho02/unity-cli → github.com/momemoV01/udit
```

C# attribute 이름 바뀌니까 모든 도구 등록 부분 일괄 수정. asmdef도 udit-* 네이밍으로 — 다른 unity-cli 포크와 어셈블리 충돌 방지.

라이선스(MIT) 그대로. NOTICE.md 새로 만들어 **원작자 크레딧 풀로 명시**:

```markdown
## NOTICE

udit is a fork of unity-cli by DevBookOfArray (youngwoocho02).
The original architecture, HTTP bridge, reflection-based tool discovery,
heartbeat design, and domain-reload handling form the complete
foundation of this project.

[!Original](unity-cli badge linking to original)
[!YouTube](DevBookOfArray badge)
```

## 변경 2: 이름

> **Udit (उदित)** — Sanskrit for *risen*

선택 기준:
- 짧음 (4글자, 도메인 자유로움)
- 발음 명확 (`u-deet`)
- 의미 적절 (포크는 "다시 일어난" 거니까)
- 검색 충돌 적음 (구글 스파이크 없음)

`utc`, `uec`, `ucli` 같은 약어들도 고려했지만 이미 다른 도구들이 점유. Sanskrit 단어 빌리는 게 깔끔.

## 변경 3: ROADMAP.md

이게 결정적이었음. 단순한 todo가 아닌 **마일스톤 단위 계획**:

```markdown
# udit Roadmap

## v0.2.0 — Phase 1: Foundation
- [ ] Critical bug fixes from upstream (ExecuteCsharp, Screenshot, ...)
- [ ] JSON envelope standardization
- [ ] Error code registry (UCI-xxx)
- [ ] .udit.yaml project config
- [ ] Shell completion (bash/zsh/pwsh/fish)
- [ ] Korean docs

## v0.3.0 — Stable IDs + Scene/GameObject Query
- [ ] StableIdRegistry for go: prefix IDs
- [ ] Scene API
- [ ] GameObject query with pagination

## v0.4.0 — Mutation
- [ ] GameObject mutation
- [ ] Component mutation
- [ ] Asset mutation
- [ ] Prefab API
- [ ] Transactions

## v0.5.0 — Project Management
- [ ] Package management
- [ ] Build subsystem
- [ ] Test runner integration

## v0.6.0 — File Watching
- [ ] fsnotify integration
- [ ] Debouncer + .meta collapse
- [ ] Queue runner with circuit breaker

## v0.9.0 — Advanced Serialization
- [ ] AnimationCurve, Gradient, Scene refs, ManagedReference

## v1.0.0 — Stability
- [ ] Public-repo readiness
- [ ] API freeze
- [ ] Documentation split
- [ ] Auto-update with checksum verification

## Decision Log
(append-only — why each decision was made)
```

핵심: 각 마일스톤마다 **success criteria**가 검증 가능. "v0.4.0이 끝났다"는 명제가 모호하지 않음.

## 메모

**왜 작은 명세를 미리 다 그리나**

명세 없이 시작하면 "다음에 뭘 할까"마다 의사결정 비용 발생. 한 번에 다 그려두면 매 커밋이 어디로 가는지 명확 — 메일링 리스트 없이 혼자 작업할 때 특히 중요.

**왜 v1.0이 목표인가**

SemVer는 신뢰의 약속. v0.x는 "아직 자유롭게 부숴도 됨" 신호고, v1.0부턴 "내가 이 표면 안 망가뜨릴게" 약속. 외부 사용자(특히 AI 에이전트 시스템)에게 v1.0이 있는 도구는 **계약** 있는 도구.

## 다음

Phase 1.1 — 업스트림에서 발견한 critical 버그들 먼저 픽스. 새 기능 쌓기 전에 코어부터.
