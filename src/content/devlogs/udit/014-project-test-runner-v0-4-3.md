---
title: 'Project + Test runner + path 픽스 → v0.4.3'
description: 'project info/validate/preflight, test list/run --output junit.xml, --output 경로 일관성 픽스, 정적 분석 클린업.'
pubDate: '2026-04-15'
seq: 14
type: 'feat'
commits: ['18a7532', '0aa2195', 'c0d7f60', '208f1d0', '0e322c2']
tags: ['project', 'test', 'paths', 'v0.4.3', 'release']
draft: false
---

## Project 메타 명령

```bash
udit project info             # 프로젝트 메타데이터
udit project validate         # asmdef, packages 등 일관성 체크
udit project preflight        # 빌드 가능 상태인지 사전 점검
```

### `project info`

```json
{
  "data": {
    "name": "MyGame",
    "path": "/Users/momemo/Game/MyGame",
    "unity_version": "6000.4.2f1",
    "scripting_backend": "IL2CPP",
    "api_compatibility": "NetStandard2.1",
    "scenes_in_build": 12,
    "packages": 24,
    "asset_count": 8124,
    "git_branch": "feat/boss-room",   // git 통합
    "git_dirty": true
  }
}
```

자동화 시작 시 환경 sanity check. AI 에이전트가 "이 프로젝트 어떤 환경?" 한 줄에 파악.

### `project validate`

다중 검증:
```json
{
  "data": {
    "checks": [
      { "name": "asmdef references", "status": "pass" },
      { "name": "missing scripts", "status": "fail", "details": [
        { "go": "go:abc", "name": "OldEnemy", "missing_count": 1 }
      ]},
      { "name": "duplicate scene names", "status": "pass" },
      { "name": "package consistency", "status": "warn", "details": [
        "Package com.foo.bar has unmet dependency"
      ]}
    ],
    "pass": 6,
    "fail": 1,
    "warn": 1
  }
}
```

CI에서 활용:
```yaml
- name: Validate Unity project
  run: udit project validate || exit 1
```

### `project preflight`

빌드 직전 점검:
- 모든 씬이 빌드 세팅에 등록됨?
- IL2CPP 환경에서 reflection 사용한 코드 있나?
- 누락된 자산 참조?
- platform-specific 설정 일관성

이거 fail이면 build 안 시작.

## Test Runner

Unity Test Framework 통합:

```bash
udit test list                                          # 등록된 테스트 목록
udit test list --mode editmode                          # EditMode만
udit test run --mode editmode --output results.xml      # 실행 + JUnit XML
udit test run --filter "Player.*"                       # 패턴 매치
```

### List

```json
{
  "data": {
    "tests": [
      { "id": "Player.MovementTests.MovesForward", "mode": "editmode" },
      { "id": "Player.MovementTests.MovesBackward", "mode": "editmode" },
      { "id": "AI.BossTests.AttackPattern1", "mode": "playmode" }
    ],
    "total": 47
  }
}
```

### Run

```bash
udit test run --output junit.xml
```

JUnit XML output:
```xml
<testsuites>
  <testsuite name="Player.MovementTests" tests="3" failures="1">
    <testcase name="MovesForward" time="0.12"/>
    <testcase name="MovesBackward" time="0.08">
      <failure>Expected 5 got 4</failure>
    </testcase>
    ...
  </testsuite>
</testsuites>
```

GitHub Actions / Jenkins / GitLab CI 모두 JUnit XML 표준. CI 통합 즉시.

### 구현

Unity의 `TestRunnerApi`:

```csharp
public class TestRunner {
    public void Run(TestRunnerApi.ExecutionSettings settings, string outputPath) {
        var api = ScriptableObject.CreateInstance<TestRunnerApi>();
        var resultCallback = new TestResultCallback(outputPath);
        api.RegisterCallbacks(resultCallback);
        api.Execute(settings);
    }
}

class TestResultCallback : ICallbacks {
    public void RunFinished(ITestResultAdaptor result) {
        // JUnit XML로 직렬화
        var xml = JunitFormatter.Format(result);
        File.WriteAllText(_outputPath, xml);
    }
    // ...
}
```

PlayMode 테스트는 도메인 리로드 발생 → 결과 비동기. SSE로 진행 알림 (Phase 5.2에서 추가).

## fix(path): --output 경로 처리

### 문제

```bash
cd /tmp
udit test run --output results.xml
```

`results.xml`이 어디 생기나?
- Before: Unity 프로젝트 루트 (예상치 못함)
- After: CLI cwd (사용자 예상)

### 해결

`--output` 같은 path-receiving 플래그는 **CLI cwd 기준 resolve**:

```go
func ResolveOutputPath(p string) string {
    if filepath.IsAbs(p) {
        return p
    }
    cwd, _ := os.Getwd()  // CLI 실행 위치
    return filepath.Join(cwd, p)
}
```

CLI가 path를 절대경로로 만들어서 Unity로 전달 → Unity는 그대로 씀.

영향: `--output`, `--output_path`, `--config-path` 모든 곳. 일관성 ↑.

## chore(lint): errcheck + staticcheck 클린업

```bash
errcheck ./...    # 무시한 에러
staticcheck ./...  # 정적 분석
```

전부 0 경고로 만들기. CI에서 fail 강제:
```yaml
- run: errcheck ./...
- run: staticcheck ./...
```

Phase 1 wrap에서 staticcheck S1011 한 줄 픽스했고, 이번엔 누적된 errcheck도 정리.

## v0.4.3 릴리스

들어간 것:
- project info/validate/preflight
- test list/run with JUnit
- path 일관성 픽스
- lint 클린업

CI 통합 가능 시점. **udit이 dev tooling 풀스택**으로 들어감.

## 메모

**왜 JUnit XML?**

표준이라서. JUnit, NUnit, MSTest 등 다 JUnit format 출력 가능. CI 시스템들이 JUnit 시각화 지원 (실패 테스트 자동 표시 등).

내가 새 포맷 만들 이유 없음.

**왜 preflight 필요한가**

빌드는 비싸. 5분 빌드 후 "씬 누락" 알게 되면 5분 손실. 30초 preflight로 사전 차단 가능.

또 CI에서 PR마다 preflight 돌리면, push 직후 5초 안에 bad config 잡음.

## 다음

.meta GUID separation, Package management, Build subsystem. v0.5.0.
