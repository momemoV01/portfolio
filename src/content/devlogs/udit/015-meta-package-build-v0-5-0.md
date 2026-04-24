---
title: '.meta GUID separation + Package + Build → v0.5.0'
description: 'Connector .meta를 upstream과 영구 분리. Package list/add/remove/info/search/resolve. Build player/targets/addressables/cancel.'
pubDate: '2026-04-15'
seq: 15
type: 'feat'
commits: ['d7be957', 'b5faa72', '25ae80b', '602c5a7']
tags: ['package', 'build', 'meta-guids', 'v0.5.0', 'release']
draft: false
---

## fix(connector): .meta GUID 영구 분리

### 발견된 문제

udit Connector C# 파일들의 `.meta` 파일이 unity-cli 업스트림과 **같은 GUID 쓰고 있었음**.

같은 프로젝트에 둘 다 설치하면 Unity가 GUID 충돌:
```
Asset import error: Two assets share the same GUID: abc123
  - Packages/com.youngwoocho02.unity-cli/Editor/HttpServer.cs.meta
  - Packages/com.momemoV01.udit/Editor/HttpServer.cs.meta
```

대부분 사용자는 둘 중 하나만 쓰니까 발견 어려움. 누군가 마이그레이션 중간이면 충돌.

### 해결

모든 udit Connector 파일의 `.meta` GUID 새로 발급:

```yaml
# Before (HttpServer.cs.meta)
fileFormatVersion: 2
guid: 8a3b9f2c1e4d5a6b7c8d9e0f1a2b3c4d   # 업스트림과 동일

# After
fileFormatVersion: 2
guid: a3f9e8d2b1c4e6f8d9c0a1b2c3d4e5f6   # 새 GUID
```

스크립트로 일괄 처리:
```bash
find Editor -name "*.meta" | while read f; do
    new_guid=$(uuidgen | tr -d '-' | tr 'A-Z' 'a-z')
    sed -i "s/^guid: .*/guid: $new_guid/" "$f"
done
```

### 영향

기존 udit 사용자가 업그레이드 시 자산 reimport 일어남 (~30초). 일회성 비용. 이후엔 문제 없음.

업스트림과 영구 분리 — fork의 진짜 독립성.

## Package Management

Unity Package Manager 통합:

```bash
udit package list                                      # 현재 설치된 패키지
udit package add com.unity.cinemachine                 # 패키지 추가
udit package add com.unity.cinemachine@2.10.0          # 버전 명시
udit package remove com.unity.cinemachine
udit package info com.unity.cinemachine                # 상세
udit package search "ProBuilder"                       # 레지스트리 검색
udit package resolve                                   # manifest.json 재해석
```

### List

```json
{
  "data": {
    "packages": [
      {
        "name": "com.unity.render-pipelines.universal",
        "version": "17.0.3",
        "source": "registry",
        "dependencies": ["com.unity.render-pipelines.core"]
      },
      {
        "name": "com.momemoV01.udit",
        "version": "0.5.0",
        "source": "git",
        "url": "https://github.com/momemoV01/udit.git"
      }
    ],
    "total": 24
  }
}
```

### Add / Remove

```csharp
public static object Add(string name, string version) {
    var spec = string.IsNullOrEmpty(version) ? name : $"{name}@{version}";
    var request = Client.Add(spec);
    while (!request.IsCompleted) Thread.Sleep(100);
    if (request.Status == StatusCode.Failure) {
        return new ErrorResponse { Code = "UCI-401", Message = request.Error.message };
    }
    return new SuccessResponse(...);
}
```

UPM API는 비동기 → 동기 wait. Domain reload 발생할 수 있음.

### Search

```bash
udit package search "ProBuilder"
```

```json
{
  "data": {
    "results": [
      { "name": "com.unity.probuilder", "displayName": "ProBuilder", "version": "5.1.1", "category": "World Building" }
    ]
  }
}
```

### Resolve

manifest.json 직접 편집 후:
```bash
udit package resolve
```

UPM이 manifest 다시 읽고 의존성 해석. CLI에서 manifest 파일 patch한 후 호출.

## Build Subsystem

```bash
udit build player                                          # 기본 옵션
udit build player --target StandaloneWindows64
udit build player --target Android --output Build/MyGame.apk
udit build player --development                            # development build
udit build targets                                         # 사용 가능 타겟
udit build addressables                                    # Addressables 빌드
udit build cancel                                          # 진행 중 빌드 취소
```

### `build player`

```csharp
public static object Player(BuildOptions opts) {
    var settings = new BuildPlayerOptions {
        scenes = opts.Scenes ?? GetScenesInBuild(),
        locationPathName = opts.Output,
        target = opts.Target,
        options = opts.Development ? BuildOptions.Development : BuildOptions.None,
    };
    var report = BuildPipeline.BuildPlayer(settings);
    return new SuccessResponse {
        Data = new {
            success = report.summary.result == BuildResult.Succeeded,
            output = report.summary.outputPath,
            size_bytes = report.summary.totalSize,
            duration_seconds = report.summary.totalTime.TotalSeconds,
            warnings = report.summary.totalWarnings,
            errors = report.summary.totalErrors,
        }
    };
}
```

빌드 시간이 분 단위 → CLI는 timeout 큰 값 (10분 기본).

### Cancel

진행 중 빌드 취소:
```bash
udit build cancel
```

내부적으로 `BuildPipeline.CancelBuild()` 호출. 정확한 중단 시점은 Unity가 결정.

### Targets

```bash
udit build targets
```

```json
{
  "data": {
    "supported": ["StandaloneWindows64", "StandaloneOSX", "Android", "WebGL"],
    "current": "StandaloneWindows64"
  }
}
```

설치된 모듈에 따라 다름 (Android module 안 깔리면 Android 빠짐).

## v0.5.0 릴리스

들어간 것:
- .meta GUID separation
- Package list/add/remove/info/search/resolve (6개)
- Build player/targets/addressables/cancel (4개)

**프로젝트 lifecycle 관리 가능 시점**. 코딩, 테스트, 패키지 관리, 빌드 모두 udit으로.

## 메모

**왜 .meta GUID separation이 release-worthy?**

작아 보이지만 **공존성**의 문제. 누군가 unity-cli + udit 둘 다 시도하면 좌절. fork 독립성은 협상 불가.

**Build의 timeout**

빌드는 길다 (5-30분). HTTP 기본 timeout으론 부족. udit CLI 측 타임아웃 기본 120초 → build 명령 한정 600초로 연장. 추후 SSE로 progress 보내는 계획 (v1.x follow-up).

**왜 Addressables도 처음부터?**

큰 프로젝트는 거의 Addressables 사용. 별개로 다루면 사용자 마찰. 같이 넣음.

## 다음

Watch 시스템 4 슬라이스. v0.6.0의 핵심 기능.
