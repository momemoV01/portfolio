export const projectStatusLabel: Record<string, string> = {
	prototype: '프로토타입',
	'in-progress': '진행 중',
	released: '공개됨',
};

export const resourceStatusLabel: Record<string, string> = {
	watching: '검토 중',
	testing: '테스트 중',
	using: '사용 중',
	archived: '보관됨',
};

export const resourceTypeLabel: Record<string, string> = {
	plugin: '플러그인',
	asset: '에셋',
	tool: '도구',
	service: '서비스',
	reference: '참고 자료',
};

export const journalCategoryLabel: Record<string, string> = {
	life: '생활',
	thought: '생각',
	review: '회고',
	note: '노트',
};

export const devlogTypeLabel: Record<string, string> = {
	feat: '기능',
	fix: '수정',
	refactor: '정리',
	docs: '문서',
	ci: '자동화',
	security: '보안',
	release: '릴리스',
	planning: '계획',
	test: '검증',
};

export function labelFrom(map: Record<string, string>, value: string | undefined) {
	return value ? map[value] ?? value : '';
}
