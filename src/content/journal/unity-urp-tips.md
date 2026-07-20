---
title: 'URP에서 후처리 커스텀할 때 자주 쓰는 패턴'
description: 'Renderer Feature로 Blit 기반 후처리 작성할 때 정리해둔 템플릿 코드와 주의점.'
pubDate: '2026-03-02'
category: 'note'
tags: ['unity', 'urp', 'shader', 'post-processing']
visibility: 'public'
relatedProjects: ['sample-unity-project']
---

URP에서 커스텀 후처리를 만들 때 반복해서 확인하는 항목을 정리한다.

## 체크리스트

- 렌더 패스 이벤트 위치를 먼저 결정한다.
- 카메라 타입별 적용 여부를 분리한다.
- 임시 RT는 해상도와 포맷을 명시한다.
- 모바일/웹 타깃이면 샘플링 횟수를 먼저 줄여본다.

## 기억할 점

셰이더 코드보다 적용 순서와 렌더 타깃 수명이 문제를 만드는 경우가 많다. 새 효과를 만들 때는 기능보다 검증 가능한 작은 패스로 시작하는 편이 낫다.
