---
title: '포크 + 로드맵'
description: 'unity-cli를 udit으로 포크. 네이밍 정리 + v0.2.0 → v1.0.0까지 단계별 계획 수립.'
pubDate: '2026-04-14'
seq: 1
type: 'planning'
tags: ['fork', 'planning', 'roadmap']
draft: false
---

## 시작점

[unity-cli](https://github.com/youngwoocho02/unity-cli) — DevBookOfArray가 만든 Unity Editor용 CLI 도구. 코어 디자인이 깔끔해서 포크 후 확장하기로.

목표는 **AI 에이전트 친화적인 변형** 만들기.

## 한 일 (3 commits)

**Initial fork**: 패키지명/모듈 경로/명령어 prefix 전반 교체. Go 모듈도 `youngwoocho02/unity-cli` → `momemoV01/udit`. 라이선스(MIT), NOTICE 보존.

**Naming 정합성**: `[UnityCliTool]` → `[UditTool]` attribute, asmdef 파일들 udit-* 통일. 다른 unity-cli 포크와 충돌 방지.

**ROADMAP.md 작성**: v0.2.0 → v1.0.0까지의 길.
- Sprint 단위 분할
- 각 마일스톤마다 검증 가능한 success criteria
- v1.0 진입 조건 vs v1.x follow-up 구분
- Decision Log로 결정 이유 보존

## 이름

> Udit (उदित) — Sanskrit for *risen*

원작에 대한 존중 + "새로 일어선다"는 의미. 짧고 발음 쉬움.

## 메모

원작자의 4 designs:
1. HTTP 브리지 (localhost:8590 단순 POST)
2. 리플렉션 기반 도구 발견 (`[UnityCliTool]` 자동 등록)
3. 하트비트 파일 (CLI가 Unity 위치 찾기)
4. 도메인 리로드 핸들링 (컴파일 후에도 살아남기)

이게 너무 잘 만들어져 있어서, 내가 할 건 코어 위에 얹는 작업뿐. 포크의 강점.

## 다음

JSON envelope 표준화 (Sprint 1).
