# Recovery Protocol Developer Docs

Recovery Protocol의 내부 개발 문서 웹사이트다. 사이트 전체 이름은 **Developer Docs**, C++/Blueprint 공개 계약을 다루는 섹션 이름은 **API Reference**를 사용한다.

## 문서 원본과 동기화

- 공식 원본: `../RP/Docs/docs`
- 웹용 스냅샷: `src/content/rp-docs`
- 검색 인덱스: `src/generated/rp-docs-manifest.json`
- 프로젝트 대시보드 스냅샷: `src/generated/project-dashboard.json`
- 동기화: `npm run sync:rp-docs`

웹용 스냅샷은 직접 수정하지 않는다. 원본 Markdown을 고친 뒤 동기화한다. 로컬 빌드는 원본이 있으면 자동으로 스냅샷을 갱신하고, Vercel처럼 원본 저장소가 없는 환경에서는 저장소에 포함된 최신 스냅샷을 사용한다.

홈의 Project Dashboard는 Obsidian Project Manager Roadmap, Phase 16 Work Report 검증표와 RP Git 커밋 이력을 합친 읽기 전용 화면이다. 일정·상태·담당자의 원본 편집은 계속 Obsidian이 소유하며 웹에서는 수정하지 않는다. 전체 Roadmap 화면도 같은 배포 시점 스냅샷을 사용하므로 미커밋 파일 목록이나 비밀 환경 변수는 노출하지 않는다.

## 접근 제한

모든 문서 화면은 서버 측 세션 검사를 통과해야 한다. 브라우저 JavaScript로 화면만 가리는 방식이 아니며, 인증되지 않은 요청에는 문서 HTML을 보내지 않는다.

`.env.example`을 참고해 로컬 `.env`와 Vercel 환경 변수에 다음 값을 설정한다.

```text
DOCS_ACCESS_PASSWORD=<개인 접근 비밀번호>
DOCS_SESSION_SECRET=<32자 이상의 무작위 비밀값>
```

비밀값이 없거나 조건을 만족하지 않으면 사이트는 fail-closed 상태로 문서 접근을 거부한다. 로그인 세션은 HttpOnly·SameSite 쿠키로 12시간 유지된다.

## 실행과 검증

```powershell
npm install
npm run dev
npm run build
```

`npm run dev`는 화면을 수정할 때만 필요하다. 실제 열람은 Vercel 배포 주소를 사용하므로 로컬 서버를 계속 켜 둘 필요가 없다.

## 이전 개인 사이트

이전 사이트의 페이지와 공통 화면 원본은 `src/legacy-pages`, `src/legacy-site`에 보존한다. 현재 라우팅에서는 노출하지 않는다.
