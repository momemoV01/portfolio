import { useEffect, useMemo, useState } from 'react';

export type BlogNavItem = {
	id: string;
	title: string;
	category: 'tech' | 'daily' | 'note';
	pubDate: string;
};

type Props = {
	posts: BlogNavItem[];
	currentPostId?: string;
};

const CATEGORIES: BlogNavItem['category'][] = ['tech', 'daily', 'note'];
const STORAGE_KEY = 'blog-tree-state';

export default function BlogTreeNav({ posts, currentPostId }: Props) {
	// Determine which category contains current post
	const activeCategory = useMemo(() => {
		if (!currentPostId) return undefined;
		return posts.find((p) => p.id === currentPostId)?.category;
	}, [currentPostId, posts]);

	const [expanded, setExpanded] = useState<Set<string>>(() => new Set(CATEGORIES));
	const [drawerOpen, setDrawerOpen] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const { cats } = JSON.parse(stored);
				if (Array.isArray(cats)) {
					const next = new Set<string>(cats);
					if (activeCategory) next.add(activeCategory);
					setExpanded(next);
				}
			}
		} catch {}
	}, [activeCategory]);

	useEffect(() => {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ cats: Array.from(expanded) }),
			);
		} catch {}
	}, [expanded]);

	const grouped = useMemo(() => {
		const g: Record<string, BlogNavItem[]> = {};
		for (const p of posts) {
			if (!g[p.category]) g[p.category] = [];
			g[p.category].push(p);
		}
		return g;
	}, [posts]);

	const toggle = (cat: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(cat)) next.delete(cat);
			else next.add(cat);
			return next;
		});
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setDrawerOpen(!drawerOpen)}
				className="lg:hidden flex items-center justify-between w-full px-4 py-3 mb-6 border border-[var(--color-border)] rounded-lg font-mono text-sm text-[var(--color-fg)]"
			>
				<span>
					<span className="text-[var(--color-accent)]">$</span> browse blog
				</span>
				<span>{drawerOpen ? '▴' : '▾'}</span>
			</button>

			<nav
				className={`${drawerOpen ? 'block' : 'hidden'} lg:block min-w-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}
			>
				<div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
					browse by category
				</div>
				<ul className="space-y-1 font-mono text-sm">
					{CATEGORIES.map((cat) => {
						const items = grouped[cat] || [];
						if (items.length === 0) return null;
						const isOpen = expanded.has(cat);
						return (
							<li key={cat}>
								<button
									type="button"
									onClick={() => toggle(cat)}
									className="flex items-center gap-1.5 w-full py-1 px-1.5 -mx-1.5 rounded hover:bg-[var(--color-bg-elev)] text-left transition"
								>
									<span className="text-[var(--color-muted)] w-3 text-[10px]">
										{isOpen ? '▼' : '▶'}
									</span>
									<span className="text-[var(--color-fg)] uppercase tracking-wider text-xs">
										{cat}
									</span>
									<span className="ml-auto text-[10px] text-[var(--color-muted)]">
										{items.length}
									</span>
								</button>
								{isOpen && (
									<ul className="ml-3 mt-1 mb-2 space-y-px border-l border-[var(--color-border)] pl-2 text-xs">
										{items.map((post) => {
											const isCurrent = post.id === currentPostId;
											return (
												<li key={post.id}>
													<a
														href={`/blog/${post.id}/`}
														className={`flex items-baseline gap-2 py-1 px-1.5 -mx-1.5 rounded transition min-w-0 ${
															isCurrent
																? 'bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
																: 'hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-accent)] text-[var(--color-fg-dim)]'
														}`}
													>
														<span
															className={`shrink-0 text-[9px] tabular-nums ${
																isCurrent
																	? 'text-[var(--color-accent)]'
																	: 'text-[var(--color-muted)]'
															}`}
														>
															{new Date(post.pubDate)
																.toLocaleDateString('en-US', {
																	month: 'short',
																	day: '2-digit',
																})
																.toLowerCase()}
														</span>
														<span className="truncate" title={post.title}>
															{post.title}
														</span>
													</a>
												</li>
											);
										})}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</nav>
		</>
	);
}
