import { useMemo, useState } from 'react';
import { labelFrom, projectStatusLabel } from '../lib/labels';

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

export type DevlogItem = {
	id: string;
	title: string;
	seq: number;
	slug: string;
	pubDate: string;
	project: string;
};

const ALL_STATUSES: ProjectItem['status'][] = ['in-progress', 'prototype', 'released'];
const ALL_PLATFORMS = ['PC', 'Mobile', 'Console', 'Web', 'VR'];

type SortMode = 'recent' | 'oldest' | 'name';

type Props = {
	projects: ProjectItem[];
	devlogs: DevlogItem[];
};

export default function ProjectsExplorer({ projects, devlogs }: Props) {
	const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
	const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set());
	const [featuredOnly, setFeaturedOnly] = useState(false);
	const [sortMode, setSortMode] = useState<SortMode>('recent');

	const devlogCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const log of devlogs) counts[log.project] = (counts[log.project] || 0) + 1;
		return counts;
	}, [devlogs]);

	const counts = useMemo(() => {
		const next = {
			status: {} as Record<string, number>,
			platform: {} as Record<string, number>,
			featured: 0,
		};
		for (const project of projects) {
			next.status[project.status] = (next.status[project.status] || 0) + 1;
			for (const platform of project.platforms) {
				next.platform[platform] = (next.platform[platform] || 0) + 1;
			}
			if (project.featured) next.featured++;
		}
		return next;
	}, [projects]);

	const filtered = useMemo(() => {
		const result = projects.filter((project) => {
			if (statusFilter.size && !statusFilter.has(project.status)) return false;
			if (platformFilter.size && !project.platforms.some((platform) => platformFilter.has(platform))) return false;
			if (featuredOnly && !project.featured) return false;
			return true;
		});

		const sorted = [...result];
		if (sortMode === 'recent') {
			sorted.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
		} else if (sortMode === 'oldest') {
			sorted.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());
		} else {
			sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko-KR'));
		}
		return sorted;
	}, [featuredOnly, platformFilter, projects, sortMode, statusFilter]);

	const activeCount = statusFilter.size + platformFilter.size + (featuredOnly ? 1 : 0);

	const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
		setter((prev) => {
			const next = new Set(prev);
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return next;
		});
	};

	const clearAll = () => {
		setStatusFilter(new Set());
		setPlatformFilter(new Set());
		setFeaturedOnly(false);
	};

	return (
		<div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
			<aside className="lg:sticky lg:top-24 lg:self-start">
				<div className="border-y border-[var(--color-border)] py-5">
					<div className="mb-4 text-xs font-bold text-[var(--color-muted)]">분류</div>
					<div className="space-y-6">
						<FilterGroup label="상태">
							{ALL_STATUSES.map((status) => (
								<FilterCheckbox
									key={status}
									label={labelFrom(projectStatusLabel, status)}
									count={counts.status[status] || 0}
									checked={statusFilter.has(status)}
									onChange={() => toggle(setStatusFilter, status)}
								/>
							))}
						</FilterGroup>

						<FilterGroup label="플랫폼">
							{ALL_PLATFORMS.filter((platform) => counts.platform[platform]).map((platform) => (
								<FilterCheckbox
									key={platform}
									label={platform}
									count={counts.platform[platform] || 0}
									checked={platformFilter.has(platform)}
									onChange={() => toggle(setPlatformFilter, platform)}
								/>
							))}
						</FilterGroup>

						<FilterGroup label="선택">
							<FilterCheckbox
								label="대표 프로젝트"
								count={counts.featured}
								checked={featuredOnly}
								onChange={() => setFeaturedOnly(!featuredOnly)}
							/>
						</FilterGroup>

						{activeCount > 0 && (
							<button
								type="button"
								onClick={clearAll}
								className="text-sm font-bold text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
							>
								필터 지우기 ({activeCount})
							</button>
						)}
					</div>
				</div>
			</aside>

			<div className="min-w-0">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
					<div className="text-sm font-bold text-[var(--color-muted)]">
						{filtered.length}개의 케이스 파일
					</div>
					<label className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">
						<span>정렬</span>
						<select
							value={sortMode}
							onChange={(event) => setSortMode(event.target.value as SortMode)}
							className="rounded-full border border-[var(--color-border)] bg-[rgba(255,250,240,0.75)] px-3 py-1.5 text-sm font-bold text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none"
						>
							<option value="recent">최근순</option>
							<option value="oldest">오래된순</option>
							<option value="name">이름순</option>
						</select>
					</label>
				</div>

				{filtered.length > 0 ? (
					<div className="grid gap-6 sm:grid-cols-2">
						{filtered.map((project) => (
							<ProjectCard key={project.id} project={project} devlogCount={devlogCounts[project.id] || 0} />
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed border-[var(--color-border)] px-5 py-14 text-center text-sm font-bold text-[var(--color-muted)]">
						조건에 맞는 프로젝트가 없습니다.
					</div>
				)}
			</div>
		</div>
	);
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<div className="mb-3 text-xs font-bold text-[var(--color-muted)]">{label}</div>
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
		<label className="group flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 transition hover:bg-[rgba(255,250,240,0.68)]">
			<span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
				<input
					type="checkbox"
					checked={checked}
					onChange={onChange}
					className="h-3.5 w-3.5 shrink-0 rounded-sm border border-[var(--color-border-strong)] accent-[var(--color-accent)]"
				/>
				<span className={checked ? 'text-[var(--color-fg)]' : 'truncate text-[var(--color-fg-dim)] group-hover:text-[var(--color-fg)]'}>
					{label}
				</span>
			</span>
			<span className="shrink-0 text-xs font-bold text-[var(--color-muted)]">{count}</span>
		</label>
	);
}

function ProjectCard({ project, devlogCount }: { project: ProjectItem; devlogCount: number }) {
	return (
		<a href={`/projects/${project.id}/`} className="record-card group overflow-hidden p-0">
			<div className="relative overflow-hidden">
				<img
					src={project.coverImage}
					alt={project.title}
					loading="lazy"
					className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
				/>
				{project.featured && (
					<span className="absolute left-3 top-3 rounded-full bg-[var(--color-bg-elev)] px-3 py-1 text-xs font-extrabold text-[var(--color-accent)] shadow-sm">
						대표
					</span>
				)}
			</div>
			<div className="p-5">
				<div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--color-muted)]">
					<span>{project.engine}</span>
					<span>·</span>
					<span>{labelFrom(projectStatusLabel, project.status)}</span>
					{devlogCount > 0 && (
						<>
							<span>·</span>
							<span>작업 기록 {devlogCount}</span>
						</>
					)}
				</div>
				<h3 className="mb-2 text-lg group-hover:text-[var(--color-accent)]">{project.title}</h3>
				<p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-fg-dim)]">{project.description}</p>
				{project.tech.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{project.tech.slice(0, 4).map((tech) => (
							<span key={tech} className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-muted)]">
								{tech}
							</span>
						))}
					</div>
				)}
			</div>
		</a>
	);
}
