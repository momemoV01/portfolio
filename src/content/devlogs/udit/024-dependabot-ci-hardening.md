---
title: 'Dependabot + CI 하드닝'
description: 'actions/checkout/upload-artifact/download-artifact bump. Major bump 가드. download v7로 pin해서 upload v6/7 매칭.'
pubDate: '2026-04-15'
seq: 24
type: 'ci'
commits: ['284cddc', 'eb813cb', '517e2ac', 'ccb8167', '9febb9c']
tags: ['ci', 'dependabot', 'actions']
draft: false
---

## 의존성 PR 처리

Dependabot이 자동 PR 5건:
- `actions/checkout` v5 → v6
- `actions/upload-artifact` v6 → v7
- `actions/download-artifact` v7 → v8

각각 PR로 들어옴.

## 함정: artifact-actions pair 비대칭

`upload-artifact@v6` 출력물은 `download-artifact@v6` 또는 `v7`만 읽음. v8은 다른 포맷.

Dependabot이 자동으로:
- upload-artifact v6 → v7 (PR #1)
- download-artifact v7 → v8 (PR #3)

각각 머지하면:
- 빌드: upload v7 ← v8이 못 읽음
- 또는: upload v6 (한쪽 머지 안 됨) ← v8이 못 읽음

CI 깨짐.

## 해결 1: pin

```yaml
# Before
- uses: actions/upload-artifact@v6
- uses: actions/download-artifact@v7

# After (pin)
- uses: actions/upload-artifact@v7
- uses: actions/download-artifact@v7
```

upload v7과 download v7이 호환. download v8 PR은 일단 거부.

## 해결 2: dependabot guard

`.github/dependabot.yml`에 명시적 차단:

```yaml
- package-ecosystem: "github-actions"
  directory: "/"
  schedule:
    interval: "weekly"
  ignore:
    - dependency-name: "actions/upload-artifact"
      update-types: ["version-update:semver-major"]
    - dependency-name: "actions/download-artifact"
      update-types: ["version-update:semver-major"]
```

이제 upload/download의 major bump은 PR 안 만듦. 수동 처리만.

```yaml
# Future PR이 v8이 호환 가능해지면:
# 1. upload + download 같이 bump
# 2. 한 PR에 둘 다 + 검증
```

## 머지된 거

```
✓ chore(deps): bump actions/checkout from 5 to 6 (#2)
✓ chore(deps): bump actions/upload-artifact from 6 to 7 (#1)
✓ chore(deps): bump actions/download-artifact from 7 to 8 (#3)
```

각각 통과 (CI 그린). 단 #3 (download v8)은 별도 처리:

```
ci(release): pin download-artifact to v7 to match upload-artifact
```

upload-artifact는 v7, download-artifact는 v7로 pin. v8 호환성 확인 후 함께 bump.

## 추가: dependabot의 페어 그룹

`.github/dependabot.yml`에 그룹 정의:

```yaml
groups:
  artifact-actions:
    patterns:
      - "actions/upload-artifact"
      - "actions/download-artifact"
    update-types:
      - "minor"
      - "patch"
```

이제 두 actions이 같이 minor/patch bump 시 **단일 PR**로 묶임. major는 별도 (위에서 차단).

<aside class="callout callout-note">
<span class="callout-label">왜 ignore 대신 group 안 썼나</span>

ignore는 PR 자체 안 만듦 (조용함). group은 PR 만들지만 묶음. major bump을 일단 전혀 보고 싶지 않으면 ignore가 깔끔.
</aside>

<aside class="callout callout-note">
<span class="callout-label">왜 자동 머지 안 하나</span>

Dependabot auto-merge 가능. 하지만:
- 의존성이 deeply 변경 (예: action API 자체 변경)
- 우리 워크플로우가 구체적인 API 사용 → 호환성 깨질 수 있음

수동 검토가 1분 걸리지만 깨진 CI 30분 디버깅보다 싸다.
</aside>

## 다음

Auto-install completion → v0.10.0.
