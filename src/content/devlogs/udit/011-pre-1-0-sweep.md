---
title: 'v1.0 사전 청소 (D1-D8, R1-R5)'
description: 'Deprecated 제거, 명령 surface 동결, 에러 코드 audit, macOS /var symlink 픽스.'
pubDate: '2026-04-16'
seq: 11
type: 'refactor'
tags: ['v1.0-prep', 'cleanup', 'deprecated']
draft: false
---

## D1-D8: 사전 청소 항목

1.0에 들어가기 전 최종 정리. v1.0 SemVer 약속을 지키려면 잠금 전 마지막 변경 기회.

- **Deprecated API 제거** — 이전 minor에서 deprecated 예고했던 것들 실제 삭제
- **명령 surface 동결** — 명령 이름, 서브명령, 플래그 이름 최종 (1.0 이후 stable)
- **에러 코드 audit** — UCI-xxx 코드들 의미 일관성 검토. **재사용 절대 금지** (한 번 할당하면 영구)
- **JSON envelope 일관성** — `{ success, message, data, error_code }` 모든 응답에서 동일한 모양

## R1-R5: 리팩토링 라운드

- 마지막 코드 가독성 정리
- internal API 명명 통일
- 작은 파일들 정리

## macOS `/var` symlink 픽스

`init` / `watch` 테스트가 macOS에서 깨지던 문제:
- macOS는 `/var`를 `/private/var`로 심볼릭 링크
- 테스트가 절대 경로 비교할 때 다른 표현 → false negative

해결: 비교 전 `filepath.EvalSymlinks` 호출로 정규화.

## 메모

v1.0 안정성 약속:
- **Stable from 1.0**: CLI 명령/서브명령/플래그 이름, JSON envelope shape, 에러 코드, 응답 필드 이름
- minor 버전에서 후방호환 추가만, major에서만 breaking

이 약속 지키려면 1.0 진입 시점에 모든 surface가 의도된 모양이어야 함. D1-D8이 그 역할.
