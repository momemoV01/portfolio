---
title: 'v1.0 Pre-release sweep — D1-D8 + R1-R5'
description: 'API 동결 직전 마지막 정리. Deprecated 제거, surface 동결, 에러 코드 audit, macOS /var symlink 픽스.'
pubDate: '2026-04-16'
seq: 26
type: 'refactor'
commits: ['51151e4', '24c565c', '89bd16c', 'a44ba9d']
tags: ['v1.0-prep', 'cleanup', 'deprecated']
draft: false
---

## D1-D8: 사전 청소 항목

v1.0 = SemVer 진입 = surface 동결. 한 번 약속하면 못 부숨. **직전이 마지막 자유 변경 기회**.

### D1: Deprecated API 제거

이전 minor에서 deprecation 경고 띄웠던 항목들 실제 삭제:

```csharp
// Before (v0.x)
[Obsolete("Use ManageGameObject.Find instead")]
public static object FindObject(string name) { ... }

// After (v1.0 pre-release)
// 함수 자체 제거
```

CLI 측도:
```bash
udit go-find  # 이전 alias, 이제 제거
udit go find  # 표준
```

### D2: 명령 surface 동결

모든 명령 / 서브명령 / 플래그 이름 최종. 1.0 이후 변경 = breaking = major bump.

체크리스트:
- 모든 명령 이름 명사형 (find, inspect, set, ...) ✓
- 플래그 명명 일관 (`--id` 아니라 `--object-id` 같은 식 통일) ✓
- 짧은 / 긴 옵션 정합 (`-i` ↔ `--id`) ✓
- 도움말 텍스트에 모순 없음 ✓

### D3: 에러 코드 audit

UCI-001 ~ UCI-099 사이 의미 다시 검토. 절대 재사용 금지 약속의 시작점.

```markdown
| Code | Status | Meaning | Notes |
|------|--------|---------|-------|
| UCI-001 | active | Generic handler exception | broad, future may narrow |
| UCI-002 | reserved | (transport-level) | not yet used |
| UCI-042 | active | GameObject not found | finalized |
| UCI-043 | active | Component not found | finalized |
| UCI-101 | active | Type mismatch | from coercion |
| UCI-201 | active | State precondition (e.g., scene dirty) | |
| UCI-301 | active | Asset not found | |
| UCI-401 | active | Unity API operation failed | |
| UCI-501 | active | Transaction conflict (already active) | |
| UCI-502 | active | No active transaction | |
```

이걸 `docs/ERROR_CODES.md`에 박음. **이 표가 약속 자체**.

### D4: JSON envelope 일관성

모든 응답이 정확히 같은 모양:
```json
{
  "success": boolean,
  "message": string,
  "data": any | null,
  "error_code": string | null
}
```

검사:
- 빈 응답도 4 필드 다 있음? ✓
- `data`가 array 직접 반환 없음? (반드시 wrapping) ✓
- `error_code`가 success일 때 null? ✓

linter:
```go
func ValidateEnvelope(resp interface{}) error {
    m := resp.(map[string]interface{})
    required := []string{"success", "message", "data", "error_code"}
    for _, k := range required {
        if _, ok := m[k]; !ok { return fmt.Errorf("missing %s", k) }
    }
    return nil
}
```

CI에서 모든 명령 출력에 적용.

### D5: 응답 필드 이름 동결

`data.matches`, `data.count`, `data.items` 같은 표준 필드 이름. 1.0 이후 변경 안 함.

```markdown
## Stable Field Names (v1.0+)
- data.id (string, stable ID like "go:abc123")
- data.matches (array of items)
- data.count (number of items in current page)
- data.total (number of total items)
- data.has_more (boolean for pagination)
- data.next_offset / data.next_cursor (pagination)
```

### D6 ~ D8: 작은 정리들

- D6: 도움말 텍스트 typo 검수
- D7: 모든 명령에 `--help` 동작 확인 (cobra가 보장하지만 한 번 더 검증)
- D8: 종료 코드 일관 (성공 0, 일반 에러 1, 사용자 입력 에러 2)

## R1-R5: 리팩토링 라운드

마지막 리팩토링 — 1.0 이후엔 internal 변경도 신경 써야 (API 노출 가능성).

- R1: 작은 파일들 정리 (단일 함수 파일들 통합)
- R2: 변수 명명 일관 (camelCase / snake_case 혼용 픽스)
- R3: package 구조 평탄화 (`internal/cmd/util/foo` 같은 deep nesting 제거)
- R4: comment 정비 (오래된 TODO 처리 또는 문서화)
- R5: 죽은 코드 제거 (dead_code 검사기 사용)

## fix(test): macOS /var symlink

### Bug

macOS에서 `init` / `watch` 테스트 fail:
```
Expected: "/var/folders/xy/test"
Got:      "/private/var/folders/xy/test"
```

### 원인

macOS는 `/var`를 `/private/var`로 심볼릭 링크. 절대 경로 비교 시 어떤 형태로 표현되는지에 따라 mismatch.

### 해결

비교 전 `EvalSymlinks`:

```go
// Before
expected := "/var/folders/xy/test"
got := os.Getwd()  // "/private/var/folders/xy/test"
if expected != got { fail }

// After
expectedReal, _ := filepath.EvalSymlinks(expected)
gotReal, _ := filepath.EvalSymlinks(got)
if expectedReal != gotReal { fail }
```

이제 macOS / Linux / Windows 모두 그린.

## ci: .gitattributes (LF 강제)

Windows / Linux 협업 시 line ending drift 방지:

```
# .gitattributes
*.go text eol=lf
*.cs text eol=crlf  # Visual Studio 표준
*.md text eol=lf
*.yml text eol=lf
*.sh text eol=lf
*.ps1 text eol=crlf
```

Windows 개발자가 `.go` 파일 저장 시 자동으로 LF. CI에서 CRLF 들어오면 fail.

## 메모

**왜 D1-D8 + R1-R5로 번호 매겼나**

추적 가능성. 각 항목이 별도 commit (또는 commit 그룹). 나중에 "v1.0에 들어간 모든 정리"가 명확.

**v1.0 = stable 문장의 무게**

이 약속 한 번 어기면 모든 신뢰 무너짐. 그래서 1.0 진입은 신중. D-R 시리즈는 그 신중함의 표시.

## 다음

SHA256 update verification — 자동 업데이트의 마지막 안전장치.
