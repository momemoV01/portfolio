import { useMemo, useState } from 'react';

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

export default function ProjectsExplorer({ projects }: { projects: ProjectItem[] }) {
	const [engineFilter, setEngineFilter] = useState<Set<string>>(new Set());
	const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
	const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set());
	const [featuredOnly, setFeaturedOnly] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);

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
		return projects.filter((p) => {
			if (engineFilter.size && !engineFilter.has(p.engine)) return false;
			if (statusFilter.size && !statusFilter.has(p.status)) return false;
			if (platformFilter.size && !p.platforms.some((pl) => platformFilter.has(pl))) return false;
			if (featuredOnly && !p.featured) return false;
			return true;
		});
	}, [projects, engineFilter, statusFilter, platformFilter, featuredOnly]);

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
				<div className="flex items-center justify-between mb-6 font-mono text-xs text-[var(--color-muted)]">
					<span>
						<span className="text-[var(--color-accent)]">{filtered.length}</span> / {projects.length} projects
					</span>
				</div>

				{filtered.length > 0 ? (
					<div className="grid gap-6 sm:grid-cols-2">
						{filtered.map((p) => (
							<ProjectCard key={p.id} project={p} />
						))}
					</div>
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

function ProjectCard({ project }: { project: ProjectItem }) {
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
