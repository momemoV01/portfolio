import { getCollection } from 'astro:content';
import type { ProjectNavItem, DevlogNavItem } from '../components/ProjectTreeNav';

export async function getProjectNavData() {
	const projects = await getCollection('projects', ({ data }) => !data.draft);
	const allPosts = await getCollection('blog', ({ data }) => !data.draft);

	const projectsData: ProjectNavItem[] = projects
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.map((p) => ({
			id: p.id,
			title: p.data.title,
			engine: p.data.engine,
		}));

	const devlogsData: DevlogNavItem[] = allPosts
		.filter((p) => p.data.project)
		.map((p) => ({
			id: p.id,
			title: p.data.title,
			day: p.data.day ?? null,
			project: p.data.project!.id,
		}));

	return { projects: projectsData, devlogs: devlogsData };
}
