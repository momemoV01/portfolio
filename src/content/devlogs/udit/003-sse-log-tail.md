---
title: 'SSE 기반 log tail (Phase 5.2)'
description: 'Connector에 /logs/stream SSE 엔드포인트, 클라이언트는 streaming 리더. udit log tail / log list.'
pubDate: '2026-04-15'
seq: 3
type: 'feat'
tags: ['sse', 'streaming', 'log']
draft: false
---

## 왜

폴링은 비효율적이고 지연 있음. WebSocket은 양방향 필요 없음 (서버 → 클라 단방향만). 결론: **Server-Sent Events**.

## 구현 3 슬라이스

**Connector**: `/logs/stream` SSE 엔드포인트. 새 로그가 들어오면 즉시 push.

**Client**: SSE streaming 리더. 표준 `text/event-stream` 파싱. 자동 재연결 (백오프).

**CLI**: `udit log tail` (실시간 follow), `udit log list` (스냅샷).

## 메모

도메인 리로드 시 연결 끊김 → 재연결 핸들링 추가. 백오프는 1s → 2s → 4s → max 30s.

원작자의 하트비트 디자인 덕분에 Unity 죽었는지 살았는지 확실히 판별 가능. SSE가 깨끗하게 동작.
