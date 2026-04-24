import { useEffect, useMemo, useState } from 'react';

export type ProjectItem = {
	id: string;
	title: string;
	description: string;
	engine: 'Unity' | 'Unreal' | 'Other';
	status: 'prototype' | 'in-progress' | 'released';
	platforms: string[];
	tech: string[];
	featured: boolean;
	pubDate: string;
	coverImage: string;
};

const ALL_ENGINES: ProjectItem['engine'][] = ['Unity', 'Unreal', 'Other'];
const ALL_STATUSES: ProjectItem['status'][] = ['released', 'in-progress', 'prototype'];
const ALL_PLATFORMS = ['PC', 'Mobile', 'Console', 'Web', 'VR'];

type SortMode = 'latest' | 'oldest' | 'engine' | 'status';
type ViewMode = 'grid' | 'list';

const STATUS_ORDER: Record<ProjectItem['status'], number> = {
	released: 0,
	'in-progress': 1,
	prototype: 2,
};

const PREFS_KEY = 'projects-view-prefs';

export default function ProjectsExplorer({ projects }: { projects: ProjectItem[] }) {
	const [engineFilter, setEngineFilter] = useState<Set<string>>(new Set());
	const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
	const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set());
	const [featuredOnly, setFeaturedOnly] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [sortMode, setSortMode] = useState<SortMode>('latest');
	const [viewMode, setViewMode] = useState<ViewMode>('grid');

	// Load preferences from localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem(PREFS_KEY);
			if (stored) {
				const p = JSON.parse(stored);
				if (p.sort) setSortMode(p.sort);
				if (p.view) setViewMode(p.view);
			}
		} catch {}
	}, []);

	// Persist preferences
	useEffect(() => {
		try {
			localStorage.setItem(PREFS_KEY, JSON.stringify({ sort: sortMode, view: viewMode }));
		} catch {}
	}, [sortMode, viewMode]);

	const counts = useMemo(() => {
		const c = {
			engine: {} as Record<string, number>,
			status: {} as Record<string, number>,
			platform: {} as Record<string, number>,
			featured: 0,
		};
		for (const p of projects) {
			c.engine[p.engine] = (c.engine[p.engine] || 0) + 1;
			c.status[p.status] = (c.status[p.status] || 0) + 1;
			for (const pl of p.platforms) c.platform[pl] = (c.platform[pl] || 0) + 1;
			if (p.featured) c.featured++;
		}
		return c;
	}, [projects]);

	const filtered = useMemo(() => {
		const result = projects.filter((p) => {
			if (engineFilter.size && !engineFilter.has(p.engine)) return false;
			if (statusFilter.size && !statusFilter.has(p.status)) return false;
			if (platformFilter.size && !p.platforms.some((pl) => platformFilter.has(pl))) return false;
			if (featuredOnly && !p.featured) return false;
			return true;
		});

		const sorted = [...result];
		switch (sortMode) {
			case 'latest':
				sorted.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
				break;
			case 'oldest':
				sorted.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());
				break;
			case 'engine':
				sorted.sort((a, b) => a.engine.localeCompare(b.engine));
				break;
			case 'status':
				sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
				break;
		}
		return sorted;
	}, [projects, engineFilter, statusFilter, platformFilter, featuredOnly, sortMode]);

	const activeCount =
		engineFilter.size + statusFilter.size + platformFilter.size + (featuredOnly ? 1 : 0);

	const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
		setter((prev) => {
			const next = new Set(prev);
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return next;
		});
	};

	const clearAll = () => {
		setEngineFilter(new Set());
		setStatusFilter(new Set());
		setPlatformFilter(new Set());
		setFeaturedOnly(false);
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
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

			{/* Sidebar */}
			<aside
				className={`${drawerOpen ? 'block' : 'hidden'} md:block space-y-8 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto`}
			>
				<FilterGroup label="engine">
					{ALL_ENGINES.map((e) => (
						<FilterCheckbox
							key={e}
							label={e}
							count={counts.engine[e] || 0}
							checked={engineFilter.has(e)}
							onChange={() => toggle(setEngineFilter, e)}
						/>
					))}
				</FilterGroup>

				<FilterGroup label="status">
					{ALL_STATUSES.map((s) => (
						<FilterCheckbox
							key={s}
							label={s}
							count={counts.status[s] || 0}
							checked={statusFilter.has(s)}
							onChange={() => toggle(setStatusFilter, s)}
						/>
					))}
				</FilterGroup>

				<FilterGroup label="platform">
					{ALL_PLATFORMS.filter((pl) => counts.platform[pl]).map((pl) => (
						<FilterCheckbox
							key={pl}
							label={pl}
							count={counts.platform[pl] || 0}
							checked={platformFilter.has(pl)}
							onChange={() => toggle(setPlatformFilter, pl)}
						/>
					))}
				</FilterGroup>

				<FilterGroup label="other">
					<FilterCheckbox
						label="featured only"
						count={counts.featured}
						checked={featuredOnly}
						onChange={() => setFeaturedOnly(!featuredOnly)}
					/>
				</FilterGroup>

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

			{/* Results */}
			<div>
				{/* Toolbar: sort + view toggle + count */}
				<div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-[var(--color-border)]">
					<div className="flex items-center gap-3">
						<label className="flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
							<span>sort:</span>
							<select
								value={sortMode}
								onChange={(e) => setSortMode(e.target.value as SortMode)}
								className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] text-[var(--color-fg)] px-2 py-1 rounded font-mono text-xs focus:outline-none focus:border-[var(--color-accent)]"
							>
								<option value="latest">latest</option>
								<option value="oldest">oldest</option>
								<option value="engine">engine</option>
								<option value="status">status</option>
							</select>
						</label>

						<div className="flex border border-[var(--color-border)] rounded overflow-hidden">
							<button
								type="button"
								onClick={() => setViewMode('grid')}
								className={`px-3 py-1 font-mono text-xs transition ${
									viewMode === 'grid'
										? 'bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
										: 'text-[var(--color-fg-dim)] hover:bg-[var(--color-bg-elev)]'
								}`}
								aria-label="grid view"
							>
								⊞ grid
							</button>
							<button
								type="button"
								onClick={() => setViewMode('list')}
								className={`px-3 py-1 font-mono text-xs border-l border-[var(--color-border)] transition ${
									viewMode === 'list'
										? 'bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
										: 'text-[var(--color-fg-dim)] hover:bg-[var(--color-bg-elev)]'
								}`}
								aria-label="list view"
							>
								☰ list
							</button>
						</div>
					</div>

					<span className="font-mono text-xs text-[var(--color-muted)]">
						<span className="text-[var(--color-accent)]">{filtered.length}</span> / {projects.length}
					</span>
				</div>

				{filtered.length > 0 ? (
					viewMode === 'grid' ? (
						<div className="grid gap-6 sm:grid-cols-2">
							{filtered.map((p) => (
								<ProjectCardGrid key={p.id} project={p} />
							))}
						</div>
					) : (
						<ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
							{filtered.map((p) => (
								<ProjectCardList key={p.id} project={p} />
							))}
						</ul>
					)
				) : (
					<div className="py-20 text-center font-mono text-sm text-[var(--color-muted)]">
						no projects match the filters_
					</div>
				)}
			</div>
		</div>
	);
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
				{label}
			</div>
			<div className="space-y-1.5">{children}</div>
		</div>
	);
}

function FilterCheckbox({
	label,
	count,
	checked,
	onChange,
}: {
	label: string;
	count: number;
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<label className="flex items-center justify-between gap-2 cursor-pointer group py-1 px-2 -mx-2 rounded hover:bg-[var(--color-bg-elev)] transition">
			<span className="flex items-center gap-2 font-mono text-sm">
				<input
					type="checkbox"
					checked={checked}
					onChange={onChange}
					className="appearance-none w-3.5 h-3.5 border border-[var(--color-border-strong)] rounded-sm checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] cursor-pointer relative"
				/>
				<span
					className={
						checked
							? 'text-[var(--color-fg)]'
							: 'text-[var(--color-fg-dim)] group-hover:text-[var(--color-fg)] transition'
					}
				>
					{label}
				</span>
			</span>
			<span className="font-mono text-[10px] text-[var(--color-muted)]">{count}</span>
		</label>
	);
}

function ProjectCardGrid({ project }: { project: ProjectItem }) {
	return (
		<a
			href={`/projects/${project.id}/`}
			className="card-hover rounded-lg overflow-hidden block group"
		>
			<div className="relative overflow-hidden aspect-video">
				<img
					src={project.coverImage}
					alt={project.title}
					loading="lazy"
					className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
				/>
				{project.featured && (
					<div className="absolute top-3 left-3 bg-[var(--color-accent)] text-[var(--color-bg)] font-mono text-xs px-2 py-0.5 rounded">
						featured
					</div>
				)}
			</div>
			<div className="p-5">
				<div className="flex items-center gap-2 mb-3 font-mono text-xs">
					<span className="text-[var(--color-accent)]">[{project.engine}]</span>
					<span className="text-[var(--color-muted)]">·</span>
					<span className="text-[var(--color-muted)] uppercase tracking-wider">{project.status}</span>
				</div>
				<h3 className="text-lg mb-2 font-bold group-hover:text-[var(--color-accent)] transition">
					{project.title}
				</h3>
				<p className="text-sm text-[var(--color-fg-dim)] line-clamp-2 mb-4">{project.description}</p>
				{project.tech.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{project.tech.slice(0, 4).map((t) => (
							<span
								key={t}
								className="font-mono text-[10px] text-[var(--color-muted)] px-1.5 py-0.5 border border-[var(--color-border)] rounded"
							>
								{t}
							</span>
						))}
						{project.tech.length > 4 && (
							<span className="font-mono text-[10px] text-[var(--color-muted)]">
								+{project.tech.length - 4}
							</span>
						)}
					</div>
				)}
			</div>
		</a>
	);
}

function ProjectCardList({ project }: { project: ProjectItem }) {
	return (
		<li>
			<a
				href={`/projects/${project.id}/`}
				className="group grid grid-cols-[80px_1fr_auto] gap-5 py-4 px-3 -mx-3 items-center hover:bg-[var(--color-bg-elev)] rounded transition"
			>
				<div className="relative overflow-hidden aspect-video rounded border border-[var(--color-border)]">
					<img
						src={project.coverImage}
						alt={project.title}
						loading="lazy"
						className="w-full h-full object-cover"
					/>
				</div>
				<div className="min-w-0">
					<div className="flex items-center gap-2 mb-1 font-mono text-[10px]">
						<span className="text-[var(--color-accent)]">[{project.engine}]</span>
						<span className="text-[var(--color-muted)]">·</span>
						<span className="text-[var(--color-muted)] uppercase tracking-wider">
							{project.status}
						</span>
						{project.featured && (
							<span className="bg-[var(--color-accent)] text-[var(--color-bg)] px-1.5 py-px rounded">
								featured
							</span>
						)}
					</div>
					<h3 className="font-semibold group-hover:text-[var(--color-accent)] transition truncate">
						{project.title}
					</h3>
					<p className="text-xs text-[var(--color-fg-dim)] line-clamp-1 mt-0.5">
						{project.description}
					</p>
				</div>
				<span className="font-mono text-[10px] text-[var(--color-muted)] hidden sm:inline">→</span>
			</a>
		</li>
	);
}
