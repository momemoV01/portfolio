---
title: 'component-set 직렬화 v0.9.0 (4 슬라이스)'
description: 'AnimationCurve, Gradient, Scene references, ManagedReference — Unity 까다로운 타입을 udit component set으로 다루기.'
pubDate: '2026-04-15'
seq: 6
type: 'feat'
tags: ['serialization', 'component', 'unity-internals', 'v0.9.0']
draft: false
---

## 목표

`udit component set`이 Unity의 까다로운 타입까지 처리. 이걸로 모든 컴포넌트 필드 자동화 가능해짐.

## 4 슬라이스 (각각 독립 PR)

### Slice 1 — AnimationCurve

```bash
udit component set go=Player Animator.weights '{
  "keys": [
    {"time": 0, "value": 0, "inTangent": 0, "outTangent": 1},
    {"time": 1, "value": 1, "inTangent": 1, "outTangent": 0}
  ]
}'
```

JSON keyframe 배열 → `AnimationCurve` 재구성. tangent 모드 정확히 처리.

### Slice 2 — Gradient

color keys + alpha keys 분리 직렬화. `GradientMode.Blend` / `Fixed` 둘 다 지원.

### Slice 3 — Scene references

씬 안 객체 참조: `{ "guid": "...", "fileID": 123 }` 페어로. `LocalFileIdentifierIn` 방식.

### Slice 4 — ManagedReference

`[SerializeReference]` 폴리모픽 처리. 타입 정보 보존하면서 인스턴스 직렬화.
```json
{ "$type": "Foo.BarStrategy, MyAssembly", "param": 42 }
```

## v0.9.0 릴리스

4 슬라이스 머지 → 릴리스. `refactor(component-set): rejection message via HashSet + add Tests asmdef` 추가로 직렬화 실패 시 명확한 에러 메시지.

## 회고

가장 까다로운 부분이 ManagedReference. Unity 내부적으로 polymorphic ref를 다루는 방식이 일관되지 않아서 (assembly qualified name vs short name) 케이스 분기 많음. 결국 **Unity가 직접 만드는 JSON과 같은 모양**으로 맞춰서 round-trip 가능하게.
