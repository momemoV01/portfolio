import { useMemo, useState } from 'react';

export type PostItem = {
	id: string;
	title: string;
	description: string;
	category: 'devlog' | 'tech' | 'daily' | 'note';
	tags: string[];
	pubDate: string;
};

const ALL_CATEGORIES: PostItem['category'][] = ['devlog', 'tech', 'daily', 'note'];

export default function BlogExplorer({ posts }: { posts: PostItem[] }) {
	const [category, setCategory] = useState<string | null>(null);
	const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
	const [activeYear, setActiveYear] = useState<number | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const counts = useMemo(() => {
		const cat: Record<string, number> = {};
		const tag: Record<string, number> = {};
		const year: Record<number, number> = {};
		for (const p of posts) {
			cat[p.category] = (cat[p.category] || 0) + 1;
			for (const t of p.tags) tag[t] = (tag[t] || 0) + 1;
			const y = new Date(p.pubDate).getFullYear();
			year[y] = (year[y] || 0) + 1;
		}
		return { cat, tag, year };
	}, [posts]);

	const sortedTags = useMemo(
		() => Object.entries(counts.tag).sort((a, b) => b[1] - a[1]).map(([name]) => name),
		[counts],
	);

	const sortedYears = useMemo(
		() =>
			Object.keys(counts.year)
				.map(Number)
				.sort((a, b) => b - a),
		[counts],
	);

	const filtered = useMemo(() => {
		return posts.filter((p) => {
			if (category && p.category !== category) return false;
			if (activeTags.size && !p.tags.some((t) => activeTags.has(t))) return false;
			if (activeYear !== null && new Date(p.pubDate).getFullYear() !== activeYear) return false;
			return true;
		});
	}, [posts, category, activeTags, activeYear]);

	const grouped = useMemo(() => {
		const g: Record<number, PostItem[]> = {};
		for (const p of filtered) {
			const y = new Date(p.pubDate).getFullYear();
			if (!g[y]) g[y] = [];
			g[y].push(p);
		}
		return g;
	}, [filtered]);

	const toggleTag = (t: string) => {
		setActiveTags((prev) => {
			const next = new Set(prev);
			if (next.has(t)) next.delete(t);
			else next.add(t);
			return next;
		});
	};

	const activeCount =
		(category ? 1 : 0) + activeTags.size + (activeYear !== null ? 1 : 0);

	const clearAll = () => {
		setCategory(null);
		setActiveTags(new Set());
		setActiveYear(null);
	};

	const years = Object.keys(grouped)
		.map(Number)
		.sort((a, b) => b - a);

	return (
		<div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
			{/* Mobile toggle */}
			<button
				type="button"
				onClick={() => setDrawerOpen(!drawerOpen)}
				className="md:hidden flex items-center justify-between w-full px-4 py-3 border border-[var(--color-border)] rounded-lg font-mono text-sm text-[var(--color-fg)]"
			>
				<span>
					<span className="text-[var(--color-accent)]">$</span> filter
					{activeCount > 0 && (
						<span className="ml-2 text-[var(--color-accent)]">[{activeCount}]</span>
					)}
				</span>
				<span>{drawerOpen ? '▴' : '▾'}</span>
			</button>

			<aside
				className={`${drawerOpen ? 'block' : 'hidden'} md:block space-y-8 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto`}
			>
				<div>
					<div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
						categories
					</div>
					<div className="space-y-1">
						<CategoryItem
							label="all"
							count={posts.length}
							active={category === null}
							onClick={() => setCategory(null)}
						/>
						{ALL_CATEGORIES.map((c) => (
							<CategoryItem
								key={c}
								label={c}
								count={counts.cat[c] || 0}
								active={category === c}
								onClick={() => setCategory(category === c ? null : c)}
							/>
						))}
					</div>
				</div>

				{sortedTags.length > 0 && (
					<div>
						<div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
							tags
						</div>
						<div className="flex flex-wrap gap-1.5">
							{sortedTags.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => toggleTag(t)}
									className={`font-mono text-[11px] px-2 py-0.5 border rounded transition ${
										activeTags.has(t)
											? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
											: 'border-[var(--color-border)] text-[var(--color-fg-dim)] hover:border-[var(--color-fg-dim)]'
									}`}
								>
									#{t}
								</button>
							))}
						</div>
					</div>
				)}

				{sortedYears.length > 0 && (
					<div>
						<div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
							archive
						</div>
						<div className="space-y-1">
							{sortedYears.map((y) => (
								<CategoryItem
									key={y}
									label={String(y)}
									count={counts.year[y] || 0}
									active={activeYear === y}
									onClick={() => setActiveYear(activeYear === y ? null : y)}
								/>
							))}
						</div>
					</div>
				)}

				{activeCount > 0 && (
					<button
						type="button"
						onClick={clearAll}
						className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition"
					>
						× clear filters ({activeCount})
					</button>
				)}
			</aside>

			<div>
				<div className="mb-6 font-mono text-xs text-[var(--color-muted)]">
					<span className="text-[var(--color-accent)]">{filtered.length}</span> / {posts.length} posts
				</div>

				{filtered.length === 0 ? (
					<div className="py-20 text-center font-mono text-sm text-[var(--color-muted)]">
						no posts match the filters_
					</div>
				) : (
					years.map((y) => (
						<section key={y} className="mb-10">
							<h2 className="font-mono text-sm text-[var(--color-muted)] mb-4 border-b border-[var(--color-border)] pb-2">
								{y}
							</h2>
							<ul className="divide-y divide-[var(--color-border)]">
								{grouped[y].map((post) => (
									<li key={post.id}>
										<a
											href={`/blog/${post.id}/`}
											className="group grid grid-cols-[auto_1fr_auto] gap-5 py-4 items-baseline hover:bg-[var(--color-bg-elev)] px-3 -mx-3 rounded transition"
										>
											<time className="font-mono text-xs text-[var(--color-muted)] tabular-nums">
												{new Date(post.pubDate).toLocaleDateString('ko-KR', {
													month: 'short',
													day: 'numeric',
												})}
											</time>
											<div>
												<h3 className="text-base font-semibold group-hover:text-[var(--color-accent)] transition">
													{post.title}
												</h3>
												<p className="text-sm text-[var(--color-fg-dim)] mt-1 line-clamp-1">
													{post.description}
												</p>
											</div>
											<span className="font-mono text-[10px] text-[var(--color-muted)] uppercase tracking-wider hidden sm:inline">
												[{post.category}]
											</span>
										</a>
									</li>
								))}
							</ul>
						</section>
					))
				)}
			</div>
		</div>
	);
}

function CategoryItem({
	label,
	count,
	active,
	onClick,
}: {
	label: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center justify-between w-full py-1 px-2 -mx-2 rounded font-mono text-sm transition ${
				active
					? 'bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
					: 'text-[var(--color-fg-dim)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]'
			}`}
		>
			<span>
				{active && '→ '}
				{label}
			</span>
			<span className="text-[10px] text-[var(--color-muted)]">{count}</span>
		</button>
	);
}
