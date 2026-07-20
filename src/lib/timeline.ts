import { getCollection, getEntry } from 'astro:content';
import { isPublic } from './contentFilters';
import {
	devlogTypeLabel,
	journalCategoryLabel,
	labelFrom,
	projectStatusLabel,
	resourceStatusLabel,
	resourceTypeLabel,
} from './labels';

export type TimelineKind = 'project' | 'devlog' | 'journal' | 'resource' | 'travel';

export type TimelineItem = {
	id: string;
	kind: TimelineKind;
	title: string;
	description: string;
	date: Date;
	href: string;
	tags: string[];
	meta: string;
	projectTitle?: string;
};

const KIND_LABEL: Record<TimelineKind, string> = {
	project: '프로젝트',
	devlog: '작업 일지',
	journal: '기록',
	resource: '도구함',
	travel: '여행',
};

export async function getTimelineItems(limit?: number): Promise<TimelineItem[]> {
	const [projects, devlogs, journal, resources, travel] = await Promise.all([
		getCollection('projects', ({ data }) => isPublic(data)),
		getCollection('devlogs', ({ data }) => isPublic(data)),
		getCollection('journal', ({ data }) => isPublic(data)),
		getCollection('resources', ({ data }) => isPublic(data)),
		getCollection('travel', ({ data }) => isPublic(data)),
	]);

	const projectTitleCache = new Map<string, string>();
	const getProjectTitle = async (projectId: string) => {
		if (projectTitleCache.has(projectId)) return projectTitleCache.get(projectId)!;
		const entry = await getEntry('projects', projectId);
		const title = entry?.data.title ?? projectId;
		projectTitleCache.set(projectId, title);
		return title;
	};

	const items: TimelineItem[] = [];

	for (const p of projects) {
		items.push({
			id: p.id,
			kind: 'project',
			title: p.data.title,
			description: p.data.description,
			date: p.data.pubDate,
			href: `/projects/${p.id}/`,
			tags: p.data.tags,
			meta: `${p.data.engine} · ${labelFrom(projectStatusLabel, p.data.status)}`,
		});
	}

	for (const d of devlogs) {
		const [project, slug] = d.id.split('/');
		items.push({
			id: d.id,
			kind: 'devlog',
			title: d.data.title,
			description: d.data.description,
			date: d.data.pubDate,
			href: `/projects/${project}/${slug}/`,
			tags: d.data.tags,
			meta: `${String(d.data.seq).padStart(3, '0')}번째 기록${d.data.type ? ` · ${labelFrom(devlogTypeLabel, d.data.type)}` : ''}`,
			projectTitle: await getProjectTitle(project),
		});
	}

	for (const j of journal) {
		items.push({
			id: j.id,
			kind: 'journal',
			title: j.data.title,
			description: j.data.description,
			date: j.data.pubDate,
			href: `/journal/${j.id}/`,
			tags: j.data.tags,
			meta: labelFrom(journalCategoryLabel, j.data.category),
		});
	}

	for (const r of resources) {
		items.push({
			id: r.id,
			kind: 'resource',
			title: r.data.title,
			description: r.data.description,
			date: r.data.pubDate,
			href: `/resources/${r.id}/`,
			tags: r.data.tags,
			meta: `${labelFrom(resourceTypeLabel, r.data.resourceType)} · ${labelFrom(resourceStatusLabel, r.data.status)}`,
		});
	}

	for (const t of travel) {
		items.push({
			id: t.id,
			kind: 'travel',
			title: t.data.title,
			description: t.data.description,
			date: t.data.pubDate,
			href: `/travel/${t.id}/`,
			tags: t.data.tags,
			meta: t.data.location,
		});
	}

	items.sort((a, b) => b.date.valueOf() - a.date.valueOf());
	return typeof limit === 'number' ? items.slice(0, limit) : items;
}

export function getKindLabel(kind: TimelineKind) {
	return KIND_LABEL[kind];
}
