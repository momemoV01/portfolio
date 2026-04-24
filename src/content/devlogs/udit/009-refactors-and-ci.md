---
title: '리팩토링 + CI 정비'
description: 'root.go를 help/params/output으로 분할, ManageComponent.cs를 3 partial로. dependabot major bump 가드.'
pubDate: '2026-04-15'
seq: 9
type: 'refactor'
tags: ['refactor', 'maintainability', 'ci']
draft: false
---

## Go 측

### `cmd/root.go` 분할
- 한 파일이 너무 비대 (도움말, 파라미터 처리, 출력 포맷팅 모두 들어 있음)
- 분할:
  - `cmd/help.go` — 사용자 도움말 텍스트 + `--help` 처리
  - `cmd/params.go` — 플래그 파싱 + 검증
  - `cmd/output.go` — JSON 봉투, 포맷팅, 에러 코드 매핑
- 가독성 ↑, 추후 수정 시 충돌 ↓

## C# 측

### `ManageComponent.cs` 3 partial
- 컴포넌트 처리 코드가 한 파일에 1,800줄 넘음
- 3개 partial로 분리:
  - 기본 CRUD (get/set/add/remove)
  - 직렬화 (AnimationCurve/Gradient/refs/ManagedReference)
  - 유틸 (param coercion 헬퍼)

### `TryParseVector3` 통합
3개 Tools 클래스에 중복 — `ParamCoercion`으로 한 군데 모음.

## CI

### Dependabot 가드
- artifact-actions pair는 같이 bump해야 함 (`download` v7 ↔ `upload` v6/7 호환성)
- major bump은 자동 PR 차단 → 수동 검토만

### `.gitattributes`
- Go 소스에 LF 강제 (Windows 개발자 협업 시 CRLF drift 방지)

## 메모

리팩토링은 사용자한테 안 보이지만 v1.0 약속의 일부. **유지보수성**도 stable surface의 일부.
