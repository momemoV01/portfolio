import { getCollection } from 'astro:content';
import type { BlogNavItem } from '../components/BlogTreeNav';

export async function getBlogNavData() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);

	const items: BlogNavItem[] = posts
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.map((p) => ({
			id: p.id,
			title: p.data.title,
			category: p.data.category,
			pubDate: p.data.pubDate.toISOString(),
		}));

	return { posts: items };
}
