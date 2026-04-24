---
title: 'URP에서 후처리 커스텀할 때 자주 쓰는 패턴'
description: 'Renderer Feature로 Blit 기반 후처리 작성할 때 정리해둔 템플릿 코드와 주의점.'
pubDate: '2026-03-02'
category: 'tech'
tags: ['unity', 'urp', 'shader', 'post-processing']
---

## 개요

샘플 기술 글입니다. tech 카테고리 + 태그 검증용.

## Renderer Feature 템플릿

```csharp
public class CustomPostProcess : ScriptableRendererFeature
{
    // ...
}
```
