---
title: 'README 슬리밍 + 문서 분할'
description: '한 파일 9KB README를 1차 인상에 집중하고 풀 레퍼런스/가이드/쿡북은 docs/로 분리.'
pubDate: '2026-04-16'
seq: 13
type: 'docs'
tags: ['docs', 'readme', 'first-impression']
draft: false
---

## 문제

README가 9KB로 비대. 첫 방문자가 한 번에 다 못 읽음. 결과: 핵심 가치 명제가 묻힘.

## 해결: 분리

### README.md (slim) — 1차 인상
- 한 줄 가치 명제
- 빠른 설치
- 5줄 quick start
- 명령 카테고리 표 (compact)
- "더 알고 싶으면 →" 링크들

### docs/ — 깊이 있는 자료
| 파일 | 역할 |
|------|------|
| `docs/COMMANDS.md` | 풀 레퍼런스 + 모든 플래그 + 예시 |
| `docs/CUSTOM_TOOLS.md` | `[UditTool]` 작성 가이드 |
| `docs/COOKBOOK.md` | 워크플로우 레시피 |
| `docs/ERROR_CODES.md` | UCI 에러 레지스트리 |
| `docs/ROADMAP.md` | 결정 로그 + 다음 단계 |

## 메모

README 짧게 쓰는 게 길게 쓰는 것보다 어렵다. 매 줄이 "여기 들어갈 만큼 중요한가" 자체검열.

판단 기준: **첫 방문자가 30초 안에 "이게 뭐 하는 도구고 나한테 필요한가" 결정 가능해야 함**. 그 이상은 docs로.

## 한 일 (Apr 16 docs commits)
- README slim
- docs/ 구조 신설
- README ↔ docs 양방향 링크
- 한국어 README도 같은 구조로 동기화 (`README.ko.md`)
