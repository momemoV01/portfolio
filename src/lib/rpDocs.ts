import { getCollection, type CollectionEntry } from 'astro:content';

export type RPDocEntry = CollectionEntry<'rpDocs'>;

export const RP_DOC_SECTION_LABELS = {
	overview: 'Overview',
	flow: 'Feature Flows',
	api: 'API Reference',
	project: 'Project Records',
	guide: 'Guides',
} as const;

export const RP_DOC_SECTION_DESCRIPTIONS = {
	overview: '문서 체계와 탐색 방법',
	flow: '하고 싶은 일을 기준으로 보는 전체 흐름',
	api: '현재 유효한 공개 계약과 실패 경계',
	project: 'Phase 범위, Work Report와 Editor 검증 근거',
	guide: 'Editor 조립, 개발 도구와 검증 절차',
} as const;

export async function getRPDocs(): Promise<RPDocEntry[]> {
	return (await getCollection('rpDocs')).sort(
		(left, right) => left.data.order - right.data.order || left.data.title.localeCompare(right.data.title, 'ko'),
	);
}

export function rpDocHref(entry: RPDocEntry): string {
	return `/docs/${entry.id}`;
}

export function normalizeRPDocSlug(value: string | undefined): string {
	return decodeURIComponent(value ?? '')
		.replace(/^\/+|\/+$/g, '')
		.replace(/\.md$/i, '')
		.replace(/\/index$/i, '')
		.toLocaleLowerCase('en-US');
}

export function groupRPDocs(entries: RPDocEntry[]): Map<RPDocEntry['data']['section'], RPDocEntry[]> {
	const groups = new Map<RPDocEntry['data']['section'], RPDocEntry[]>();
	for (const section of ['overview', 'flow', 'api', 'project', 'guide'] as const) groups.set(section, []);
	for (const entry of entries) groups.get(entry.data.section)?.push(entry);
	return groups;
}
