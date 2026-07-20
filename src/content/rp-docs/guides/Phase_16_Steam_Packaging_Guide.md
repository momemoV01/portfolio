---
title: "Phase 16 Steam Development / Shipping Packaging Guide"
description: "Phase 16 Steam Development / Shipping Packaging Guide의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Phase_16_Steam_Packaging_Guide.md"
status: "Current"
documentType: "Guide"
searchKeywords:
  - "Phase 16 Steam Development / Shipping Packaging Guide"
order: 45
---
Status: Current
Applies To: RP_Live UE 5.8, Steam Dev AppID 480
Last Verified: 2026-07-13 documentation and config audit; Phase 16 package runtime pending

## 1. Completion Boundary

Phase 16의 제품형 Steam 완료 기준은 동일 Windows Development 패키지를 서로 다른 Steam 계정·두 기기에서 실행한 결과다.

Shipping은 현재 AppID 480 단계에서 다음까지만 필수다.

```text
Build/Cook/Stage/Package 성공
실행 성공
Steam provider/config 진단
Title -> Multiplayer menu 진입 smoke
```

Shipping 두 기기 제품 검증이나 실제 배포 준비 완료를 의미하지 않는다.

## 2. Repository Configuration

현재 프로젝트 기준:

```text
[OnlineSubsystem]
DefaultPlatformService=Steam

[OnlineSubsystemSteam]
bEnabled=true
SteamDevAppId=480

GameNetDriver = SocketSubsystemSteamIP.SteamNetDriver
```

UI/Blueprint는 이 설정이나 Steam API를 직접 읽지 않는다. 런타임 확인은 `RPPrintSessionDiagnostics`와 로그를 사용한다.

## 3. Windows Development Package

Editor의 Platforms > Windows > Package Project를 사용해도 된다. 명령형 재현이 필요하면 프로젝트 루트 PowerShell에서 다음 형태를 사용한다.

```powershell
$EngineRoot = 'F:\UE_5.8'
$Project = 'E:\Workspace\RP_Live\RP\RP.uproject'
$Archive = 'E:\Workspace\RP_Live\RP\Saved\Phase16_Win64_Development'

& "$EngineRoot\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun `
  "-project=$Project" -noP4 -utf8output -platform=Win64 `
  -clientconfig=Development -build -cook -stage -pak -archive `
  "-archivedirectory=$Archive"
```

기존 `Tools/Phase12/Run_Phase12_Steam.bat`은 같은 `Saved/Phase12_Win64_Development/Windows` 배치 전용이다. Phase 16 출력 위치가 다르면 실행 파일을 직접 열거나 스크립트의 package root를 복사본에서만 조정한다. 기존 스크립트를 Phase 16 구현 커밋에 섞어 수정하지 않는다.

## 4. Two-Device Preparation

- 두 기기에 정확히 같은 Development package를 복사한다.
- 각 기기에서 Steam Client를 실행하고 서로 다른 계정으로 로그인한다.
- 두 계정이 친구이며 AppID 480 Spacewar 실행 충돌이 없는지 확인한다.
- 같은 계정으로 두 기기를 동시에 검증하지 않는다.
- 방화벽 prompt가 뜨면 두 기기에서 RP 실행 파일의 통신을 허용한다.
- Host/Client 로그 이름과 기기명을 구분한다.

권장 실행 옵션:

```text
-log=RP_Phase16_<HOST_OR_CLIENT>_<DATE>.log
-stdout
-FullStdOutLogOutput
-windowed
-ResX=1280
-ResY=720
```

## 5. Development Test Order

한 시나리오가 실패하면 다음 단계로 넘어가지 않고 양쪽 로그를 먼저 보존한다.

1. 양쪽에서 `RPPrintSessionDiagnostics`로 Steam/NetDriver를 확인한다.
2. Host가 Room 생성 후 Bureau로 travel한다.
3. Client가 Find하고 Waiting row의 이름/Host/인원/Map/Ping/상태를 확인한다.
4. stable Join으로 Bureau에 들어간다.
5. Client Leave 후 Host가 유지되고 Client가 재참가한다.
6. Host가 Invite Overlay를 열고 초대 수락 Join을 확인한다.
7. Steam 친구 메뉴 `Join Game`도 같은 방에 연결되는지 확인한다.
8. 미션 시작 뒤 InProgress 표시와 목록/Overlay/직접 참가 차단을 확인한다.
9. Full room, stale result, 중복 입력을 확인한다.
10. Host process를 강제 종료하고 Client 메뉴 복귀 + blocking notice를 확인한다.
11. Steam Client를 종료한 별도 실행에서 Provider unavailable notice를 확인한다.

상세 체크는 [Phase 16 Editor Verification Checklist](../checklists/Phase_16_Editor_Verification_Checklist.md)에 기록한다.

## 6. Windows Shipping Smoke

```powershell
$EngineRoot = 'F:\UE_5.8'
$Project = 'E:\Workspace\RP_Live\RP\RP.uproject'
$Archive = 'E:\Workspace\RP_Live\RP\Saved\Phase16_Win64_Shipping'

& "$EngineRoot\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun `
  "-project=$Project" -noP4 -utf8output -platform=Win64 `
  -clientconfig=Shipping -build -cook -stage -pak -archive `
  "-archivedirectory=$Archive"
```

Shipping 차이:

| 항목 | Development | Shipping |
|---|---|---|
| 콘솔/CheatManager | 검증에 사용 가능 | 제품 의존 금지; 보통 사용 불가 |
| 상세 로그 | 진단 근거 | 축소될 수 있음 |
| Automation/debug 명령 | 로컬 Gate | 제품 UX 완료 근거 아님 |
| 두 기기 Steam 완료 기준 | 필수 | AppID 480 단계에서는 비필수 |

Shipping smoke는 UI가 debug command 없이 Title/Multiplayer/Host/Join 화면에 진입할 수 있는지 확인한다. AppID 480 패키지가 실행된다는 사실을 실제 제품 AppID 배포 준비 완료로 기록하지 않는다.

## 7. Evidence

각 실행에서 다음만 보존하면 충분하다.

```text
package config와 archive 경로
실행 파일 hash 또는 동일 package 확인 방법
Host/Client Steam 계정 구분(개인 ID 값은 문서에 쓰지 않음)
RPPrintSessionDiagnostics 핵심 줄
Create/Find/Join/Travel/Leave/Invite/InProgress/HostDisconnected 결과 줄
필요한 UI screenshot
실패 시 양쪽 로그와 재현 순서
```

## 8. Do Not

- Steam 계정 토큰, 개인 식별 ID, 인증 파일을 저장소에 넣지 않는다.
- Development 성공을 Shipping/실제 AppID release 승인으로 확대 해석하지 않는다.
- Shipping UX를 debug console이나 CheatManager에 의존시키지 않는다.
- 한 기기의 두 프로세스만으로 두 계정·두 기기 완료를 대체하지 않는다.
