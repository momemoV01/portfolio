---
title: 'init/watch — connected-instance 타겟팅'
description: 'cwd 대신 연결된 Unity 인스턴스의 프로젝트 루트를 타겟팅. watch도 같은 layer 적용.'
pubDate: '2026-04-15'
seq: 2
type: 'feat'
tags: ['init', 'watch', 'connected-instance']
draft: false
---

## 문제

`udit init` / `udit watch`가 **현재 디렉토리(cwd)** 기준으로 동작. 사용자가 다른 폴더에서 명령 실행하면 잘못된 곳에 설정 만들거나 잘못된 경로 감시.

## 해결

**Connected Unity 인스턴스가 있으면 그걸 우선** — 하트비트 파일이 알려주는 프로젝트 루트를 default target으로.

- `init`: cwd 기본값 → connected instance 프로젝트 루트
- `watch`: config 해석 시 connected-instance layer 추가 (init과 동일한 우선순위)

## 결정

> "사용자가 명령을 칠 때 Unity가 이미 떠 있으면, 그게 그 명령의 컨텍스트"

cwd-aware tool들의 흔한 함정 회피. fallback은 cwd 그대로 유지.
