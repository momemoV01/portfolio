---
title: 'release v0.2.1 — Phase 1 마무리'
description: 'Phase 1.1~1.5 + wrap 모두 머지. JSON envelope, error code registry, .udit.yaml, shell completion, docs 갖춰진 첫 시점.'
pubDate: '2026-04-14'
seq: 6
type: 'release'
commits: ['a272191', 'd512746']
tags: ['phase-1', 'release', 'milestone']
draft: false
---

## v0.2.1로 가는 길

ROADMAP에서 Phase 1 = "Foundation" 마일스톤. 4월 14일 오전 시작 → 같은 날 저녁 v0.2.1.

들어간 것:
1. **Phase 1.1**: critical 픽스 4개
2. **Phase 1.2**: JSON envelope (모든 응답 동일 모양)
3. **Phase 1.3**: UCI-xxx error code registry
4. **Phase 1.4**: `.udit.yaml` 프로젝트 설정
5. **Phase 1.5**: 4 셸 자동완성
6. **Wrap**: Korean 문서화 정책, sentinel markers, Node 24, staticcheck

## v0.2.1이 의미하는 것

이 시점에서 udit는 unity-cli와 비교해:

| 측면 | unity-cli | udit v0.2.1 |
|------|-----------|-------------|
| HTTP 브리지 | ✓ | ✓ (그대로) |
| Reflection 도구 | ✓ | ✓ (그대로) |
| 응답 모양 | 명령마다 다름 | **통합 envelope** |
| 에러 분류 | 메시지 텍스트 | **UCI-xxx 코드** |
| 프로젝트 설정 | CLI 플래그만 | **.udit.yaml** |
| 셸 자동완성 | bash만 | **bash/zsh/fish/pwsh** |
| 문서 언어 | 영문 | **영문 + 한국어** |

코어 변형 안 했고 (포크 약속), 위에 얹은 것만. 이 시점에서 unity-cli 사용자가 udit으로 무리 없이 옮길 수 있음.

## 0.x인 이유

아직 v1.0이 아님 — **API 안정성 약속 안 함**. 다음 phase에서 다음 명령들이 들어올 때 surface가 더 흔들릴 수 있음.

v1.0 진입 조건 (ROADMAP 명시):
- [ ] Stable IDs로 GameObject 추적 가능
- [ ] Scene/GO/Component/Asset/Prefab CRUD 완전
- [ ] Transactions
- [ ] Build/Package/Watch 시스템
- [ ] 테스트 커버리지 + 10k 씬 벤치
- [ ] Public-repo 거버넌스
- [ ] Update mechanism with checksum
- [ ] Documentation split

**v0.2.1은 Foundation. v1.0까진 9개 마일스톤 더.**

## docs(roadmap): Next Actions

릴리스 직후 ROADMAP에 다음 액션 갱신:

```markdown
## Next Actions (post v0.2.1)
- v0.3.0: Stable IDs + Scene/GameObject query
- v0.4.x: Mutations
- v0.5.0: Project management (build/package/test)
- v0.6.0: File watching
- v0.9.x: Advanced serialization
- v1.0.0: API stability
```

<aside class="callout callout-note">
<span class="callout-label">왜 0.2.1인가, 0.2.0이 아니라?</span>

업스트림이 0.2.x였을 가능성 + Phase 1을 "0.2 라인 안의 patch"로 보고. **클린 0.x 시작은 v0.3.0부터**. 그 전까지는 fork 정착 단계.
</aside>

<aside class="callout callout-note">
<span class="callout-label">작은 릴리스 자주 하는 이유</span>

각 릴리스는 의사결정의 동결 시점. release: vX.Y.Z 커밋이 있으면 git history에서 "이 시점이 의도된 멈춤" 표시. 사용자한테도 "이 버전부턴 이런 모양" 약속.

작은 릴리스 자주 = **각 시점이 검증 가능**한 단위. v1.0에 모든 실험 누적이 아니라, 실험 → 동결 → 다음 실험 사이클.
</aside>

## 다음

v0.3.0 마일스톤. StableIdRegistry — go: 안정 ID 시스템부터.
