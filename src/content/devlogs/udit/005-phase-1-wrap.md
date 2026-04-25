---
title: 'Phase 1 Wrap — Korean 문서화 + CI 정리'
description: 'Korean documentation policy, fix(completion) sentinel markers, Node 20 → Node 24 마이그레이션, staticcheck 픽스.'
pubDate: '2026-04-14'
seq: 5
type: 'docs'
commits: ['490a316', '5f624b9', 'eb58fac', '2b86a9b', '0ac1aca']
tags: ['phase-1', 'docs', 'i18n', 'ci']
draft: false
---

## Korean 문서화 정책

### 결정

`README.md` (English) + `README.ko.md` (Korean) 동시 유지. 이중 언어 README는 흔하지만 **동기화 비용**이 따라옴.

정책:
- 모든 핵심 문서는 영문이 1차
- 한국어는 항상 같은 정보 + 같은 구조
- 영문 변경 시 한국어 같이 갱신 (PR 자체에서 둘 다 수정)
- 파편화 발생 시 영문이 진실

### 왜 한국어도 만드나

내가 한국어 화자인 게 첫째 이유. 둘째: AI 에이전트와 페어 프로그래밍할 때 컨텍스트가 한국어로 자연스러움. 협업 효율 ↑.

### 어떤 문서를 번역하나

| 문서 | 번역? | 이유 |
|------|-------|------|
| `README.md` | ✅ | 첫인상 |
| `docs/COMMANDS.md` | ✅ (점진적) | 사용자 가이드 |
| `docs/CUSTOM_TOOLS.md` | 부분적 | 코드 샘플은 영문, 설명만 한국어 |
| `docs/ROADMAP.md` | ❌ | 결정 로그는 영문만 |
| `docs/ERROR_CODES.md` | ❌ | 머신 파싱용 |

ROADMAP / ERROR_CODES는 의도적으로 영문 한정. **Decision Log는 한 곳에서 영원**히 살아야 함 — 번역 갈리면 진실 분리됨.

## fix(completion): sentinel markers

### 문제

자동완성 스크립트를 `~/.bashrc`에 inline append 하면 재설치 시 중복 라인 발생:

```bash
# .bashrc
# udit completion
_udit_complete() { ... }
complete -F _udit_complete udit

# 재설치 후
# .bashrc
_udit_complete() { ... }
complete -F _udit_complete udit
_udit_complete() { ... }    # 중복!
complete -F _udit_complete udit
```

### 해결

Sentinel 주석으로 감싸기:

```bash
# >>>UDIT-COMPLETION-START<<<
_udit_complete() { ... }
complete -F _udit_complete udit
# >>>UDIT-COMPLETION-END<<<
```

설치 시: `# >>>UDIT-COMPLETION-START<<<`부터 `END<<<`까지를 통째로 교체.

```go
func InstallCompletion(path string, script string) error {
    content, _ := os.ReadFile(path)
    re := regexp.MustCompile("(?s)# >>>UDIT-COMPLETION-START<<<.*?# >>>UDIT-COMPLETION-END<<<\n")
    wrapped := "# >>>UDIT-COMPLETION-START<<<\n" + script + "\n# >>>UDIT-COMPLETION-END<<<\n"
    if re.MatchString(string(content)) {
        content = re.ReplaceAll(content, []byte(wrapped))
    } else {
        content = append(content, []byte("\n"+wrapped)...)
    }
    return os.WriteFile(path, content, 0644)
}
```

`uninstall`은 sentinel 사이를 잘라내고 저장.

## Node 20 → Node 24 마이그레이션

### 왜 지금?

GitHub Actions의 `actions/checkout@v4`, `actions/upload-artifact@v6` 같은 핵심 action들이 Node 20 deprecated. 곧 동작 안 함.

### 두 단계

**1. `chore(ci): bump release.yml actions to drop Node 20 deprecation`**

`release.yml`만 먼저:
```yaml
# Before
- uses: actions/checkout@v3
- uses: actions/upload-artifact@v4

# After
- uses: actions/checkout@v4   # Node 20 → 22
- uses: actions/upload-artifact@v6   # Node 20 → 22
```

테스트 워크플로우에서 검증.

**2. `chore(ci): finish Node 20 cleanup — bump artifact + release actions to node24`**

전체 CI 일괄 정리:
- `setup-node@v3` → `setup-node@v4`
- 모든 `Node 20` 명시 환경 → `Node 24`
- `setup-go@v4` → 자동으로 Node 22 사용

설정 파편화 안 남도록 한 번에. 이후 매트릭스 빌드 매끄러워짐.

## fix: staticcheck S1011 in mergeExecUsings

### 정적 분석 한 줄

`staticcheck`가 `mergeExecUsings` 함수에서 경고:

```
S1011: should replace loop with append(usings, newOnes...)
```

Before:
```go
for _, u := range newOnes {
    usings = append(usings, u)
}
```

After:
```go
usings = append(usings, newOnes...)
```

기능 동일, 한 줄 짧음. **모든 staticcheck 경고를 0으로 유지하는 게 디폴트**. 한 번 허용하기 시작하면 늘어남.

<aside class="callout callout-note">
<span class="callout-label">왜 wrap 단계가 따로 필요한가</span>

기능 추가만 계속하면 곁가지가 못 자라. 한 phase 끝마다 docs/test/CI 정리 — 다음 phase의 기반이 됨.
</aside>

<aside class="callout callout-note">
<span class="callout-label">Korean 정책의 함정</span>

번역하기로 했으면 끝까지 갈아야. 안 그러면 "한국어 사용자는 1.0이 1.5처럼 보임" — 부분적 번역이 무번역보다 나쁠 수 있음. 그래서 README + COMMANDS만 강제 번역, 나머진 선택적.
</aside>

## 다음

release v0.2.1 — Phase 1 마무리 마커.
