import { getCollection } from 'astro:content';
import type { DevlogNavItem, ProjectNavItem } from '../components/ProjectTreeNav';

export async function getProjectNavData() {
	const projects = await getCollection('projects', ({ data }) => !data.draft);
	const devlogs = await getCollection('devlogs', ({ data }) => !data.draft);

	const projectsData: ProjectNavItem[] = projects
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.map((p) => ({
			id: p.id,
			title: p.data.title,
			engine: p.data.engine,
		}));

	const devlogsData: DevlogNavItem[] = devlogs.map((d) => {
		const [project, slug] = d.id.split('/');
		return {
			id: d.id,
			project,
			slug: slug ?? d.id,
			title: d.data.title,
			seq: d.data.seq,
			type: d.data.type,
			pubDate: d.data.pubDate.toISOString(),
		};
	});

	return { projects: projectsData, devlogs: devlogsData };
}
