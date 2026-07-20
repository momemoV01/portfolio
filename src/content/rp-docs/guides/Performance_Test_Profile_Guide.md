---
title: "RP Performance Baseline Guide"
description: "RP Performance Baseline Guide의 Editor 조립, 개발 절차와 검증 기준을 설명합니다."
section: "guide"
sourcePath: "guides/Performance_Test_Profile_Guide.md"
status: "Current"
documentType: "Guide"
searchKeywords:
  - "RP Performance Baseline"
  - "DefaultScalability"
  - "DefaultGameUserSettings"
  - "RPLowTest"
  - "RPMediumTest"
  - "RPHighTest"
  - "Low preset"
  - "Medium preset"
  - "High preset"
  - "RTX 2060"
  - "GTX 1050 Ti"
  - "GTX 1660"
  - "GTX 1060"
  - "최저옵"
  - "중간옵"
  - "권장사양"
  - "성능 테스트"
  - "패키징 테스트"
order: 44
---
Status: Current
Applies To:
- RP_Live UE 5.8 current development baseline
- `Config/DefaultScalability.ini`
- `Config/DefaultGameUserSettings.ini`
Last Verified:
- 2026-07-07

Search Keywords: RP Performance Baseline, DefaultScalability, DefaultGameUserSettings, RPLowTest, RPMediumTest, RPHighTest, Low preset, Medium preset, High preset, RTX 2060, GTX 1050 Ti, GTX 1660, GTX 1060, 최저옵, 중간옵, 권장사양, 성능 테스트, 패키징 테스트

## Purpose

이 문서는 Phase 기능 구현과 분리된 성능/테스트 편의 트랙이다.

목표는 패키징 앱과 PIE 테스트를 낮은 품질 프리셋으로 빠르게 반복하고, RP의 권장 사양 기준을 흔들리지 않게 잡는 것이다.

이 트랙은 아래 상태를 바꾸지 않는다.

```text
현재 Phase 상태 (Phase 15 Current)
Ready / Mission / Session 서버 권위 흐름
C++ gameplay class
Content/RP 에셋
```

## Current Target

Escape the Backrooms 계열의 협동 호러 밀도와 분위기를 참고하되, RP의 기준은 아래처럼 둔다.

| Preset | Target Hardware | Goal |
|---|---|---|
| Low | GTX 1050 Ti / RX 570급 | 1080p 30fps 또는 900p 업스케일 테스트, 애니메이션 유지 |
| Medium | GTX 1660 / GTX 1060 6GB급 | 1080p 45~60fps |
| High | RTX 2060 / RX 6600급 | 권장 기준, 1080p 60fps 목표 |
| Epic | RTX 3060 / RTX 4060급 | 고품질 플레이 |
| Cinematic | RTX 4070 이상 | 스크린샷/트레일러용, 기본 플레이 기준 아님 |

High가 현재 권장 사양 기준이다.
Low는 개발 중 패키징/Steam/PIE 반복 테스트를 덜 버겁게 만드는 기본 테스트 프리셋이다.
단, Low도 플레이어 애니메이션, 1인칭 팔, 상호작용 확인을 망가뜨리면 실패한 프리셋으로 본다.
PIE 재시작처럼 `RPLowTest`를 다시 입력하지 않는 경로에서도 `ARPCharacter`가 BeginPlay에서 전신/1인칭 SkeletalMesh animation tick 안전값을 다시 적용한다.

## Config Ownership

`DefaultScalability.ini`:

```text
Low:
- Lumen diffuse GI off
- Lumen reflections off
- Virtual Shadow Map off
- 75% screen percentage
- animation-safe skeletal mesh LOD
- Effects quality kept at 1 for gameplay-readable animation / material / VFX behavior
- low view distance / shadow / texture budgets

Medium:
- Lumen diffuse GI off
- Lumen reflections off
- lighter shadows and texture budget
- 85% screen percentage

High:
- RTX 2060 / RX 6600 target
- Lumen GI and reflections allowed, but hardware hit lighting disabled
- virtual shadow budget capped

Epic:
- higher visual target
- still avoids hardware hit lighting by default

Cinematic:
- may use hardware ray tracing / hit lighting
- not a gameplay default
```

`DefaultGameUserSettings.ini`:

```text
First packaged run defaults to Low-style settings.
This is a test convenience default, not the final release default.
```

If a local saved user setting already exists, Unreal may load the saved file instead of this default.
For a clean packaged-build default test, delete the packaged build's saved user settings before launching.

Typical saved path:

```text
<PackagedBuild>/RP/Saved/Config/Windows/GameUserSettings.ini
```

## Quick Commands

Use these in console during PIE or packaged testing.

Low test:

```text
RPLowTest
```

Medium test:

```text
RPMediumTest
```

High recommended-target test:

```text
RPHighTest
```

Unreal console commands do not use spaces for this RP debug command.
Use `RPLowTest`, `RPMediumTest`, and `RPHighTest`, not spaced phrases such as `Low test`.

Manual Low fallback:

```text
sg.ResolutionQuality 75
sg.ViewDistanceQuality 0
sg.AntiAliasingQuality 0
sg.ShadowQuality 0
sg.GlobalIlluminationQuality 0
sg.ReflectionQuality 0
sg.PostProcessQuality 0
sg.TextureQuality 0
sg.EffectsQuality 1
sg.FoliageQuality 0
sg.ShadingQuality 0
r.SkeletalMeshLODBias 0
r.DetailMode 1
r.MaterialQualityLevel 2
fx.Niagara.QualityLevel 1
r.EmitterSpawnRateScale 0.25
a.URO.Enable 0
a.URO.ForceAnimRate 0
a.URO.DisableInterpolation 0
```

Manual Medium fallback:

```text
sg.ResolutionQuality 85
sg.ViewDistanceQuality 1
sg.AntiAliasingQuality 1
sg.ShadowQuality 1
sg.GlobalIlluminationQuality 1
sg.ReflectionQuality 1
sg.PostProcessQuality 1
sg.TextureQuality 1
sg.EffectsQuality 1
sg.FoliageQuality 1
sg.ShadingQuality 1
a.URO.Enable 1
a.URO.ForceAnimRate 0
a.URO.DisableInterpolation 0
```

Manual High fallback:

```text
sg.ResolutionQuality 100
sg.ViewDistanceQuality 2
sg.AntiAliasingQuality 2
sg.ShadowQuality 2
sg.GlobalIlluminationQuality 2
sg.ReflectionQuality 2
sg.PostProcessQuality 2
sg.TextureQuality 2
sg.EffectsQuality 2
sg.FoliageQuality 2
sg.ShadingQuality 2
a.URO.Enable 1
a.URO.ForceAnimRate 0
a.URO.DisableInterpolation 0
```

Basic profiling overlay:

```text
stat unit
stat gpu
stat fps
```

Heavier capture when needed:

```text
profilegpu
```

## User / Editor Tasks

Codex can add the ini files and documentation.
The user should verify the runtime effect inside Unreal Editor or a packaged build.

- [ ] Open UE 5.8 Editor and load the test map, usually `L_BureauRoom_Dev` or the current test map.
- [ ] In PIE, run `RPLowTest` or set Engine Scalability to Low.
- [ ] Confirm the game remains visually readable enough for gameplay testing.
- [ ] Confirm player / first-person / interaction animations still update.
- [ ] Run `stat unit`, `stat gpu`, and `stat fps`.
- [ ] Package Windows Development when ready for packaged-build verification.
- [ ] If the packaged build ignores the new default, delete the packaged saved `GameUserSettings.ini` and relaunch.
- [ ] Record Low, Medium, and High results in `Docs/docs/checklists/Performance_Baseline_Test_Checklist.md`.

## Do Not

```text
[ ] Do not mark any Phase Done from this performance track.
[ ] Do not treat Low as final release visual quality.
[ ] Do not move Ready / Mission / Session authority into a graphics setting path.
[ ] Do not commit editor autosaved .uasset / .umap changes as part of this track unless explicitly intended.
[ ] Do not use Cinematic as a gameplay performance target.
```

## Changelog

### v0.1
- RP Performance Baseline guide 작성
- Low packaged-test default와 High recommended-target 기준 정리

### v0.2
- `URPDebugCheatManager` 콘솔 명령 `RPLowTest` / `RPHighTest` 기준 추가
- `Low test`처럼 띄어쓰는 입력은 Unreal Exec 명령으로 인식되지 않음을 명시

### v0.3
- Low를 animation-safe playable preset으로 조정
- `RPLowTest`가 skeletal mesh LOD / DetailMode / URO 보호값을 적용하도록 문서화

### v0.4
- Low의 Effects quality를 1로 올려 material / Niagara / spawn-rate 기반 애니메이션 표현 보존
- `RPLowTest`가 로컬 플레이어 전신/1인칭 SkeletalMeshComponent의 animation tick 보호값을 직접 적용하도록 조정

### v0.5
- PIE 재시작 후 저장된 Low scalability만 적용되는 경로를 위해 `ARPCharacter` BeginPlay animation safety 기준 추가

### v0.6
- `RPMediumTest`와 당시 짧은 별칭 `RPMidTest` 추가
- Medium fallback 기준을 85% resolution + quality 1로 문서화

### v0.7
- 중복 별칭 `RPMidTest`를 제거하고 `RPMediumTest`로 단일화
