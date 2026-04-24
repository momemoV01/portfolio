import { useEffect, useMemo, useState } from 'react';

export type ProjectNavItem = {
	id: string;
	title: string;
	engine: 'Unity' | 'Unreal' | 'Other';
};

export type DevlogNavItem = {
	id: string; // e.g. "udit/001-fork"
	project: string; // e.g. "udit"
	slug: string; // e.g. "001-fork"
	title: string;
	seq: number;
	type?: string;
	pubDate: string;
};

type Props = {
	projects: ProjectNavItem[];
	devlogs: DevlogNavItem[];
	currentProjectId?: string;
	currentDevlogId?: string;
};

const ENGINES: ProjectNavItem['engine'][] = ['Unity', 'Unreal', 'Other'];
const STORAGE_KEY = 'project-tree-state';

const TYPE_COLOR: Record<string, string> = {
	feat: 'text-[var(--color-accent)]',
	fix: 'text-blue-400',
	refactor: 'text-purple-400',
	docs: 'text-[var(--color-muted)]',
	ci: 'text-orange-400',
	security: 'text-red-400',
	release: 'text-emerald-400',
	planning: 'text-cyan-400',
	test: 'text-yellow-400',
};

export default function ProjectTreeNav({
	projects,
	devlogs,
	currentProjectId,
	currentDevlogId,
}: Props) {
	const activeProjectId = useMemo(() => {
		if (currentProjectId) return currentProjectId;
		if (currentDevlogId) {
			return devlogs.find((d) => d.id === currentDevlogId)?.project;
		}
		return undefined;
	}, [currentProjectId, currentDevlogId, devlogs]);

	const [expandedEngines, setExpandedEngines] = useState<Set<string>>(() => new Set(ENGINES));
	const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
		() => new Set(activeProjectId ? [activeProjectId] : []),
	);
	const [drawerOpen, setDrawerOpen] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const { engines, projs } = JSON.parse(stored);
				if (Array.isArray(engines)) setExpandedEngines(new Set(engines));
				if (Array.isArray(projs)) {
					const next = new Set<string>(projs);
					if (activeProjectId) next.add(activeProjectId);
					setExpandedProjects(next);
				}
			}
		} catch {}
	}, [activeProjectId]);

	useEffect(() => {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					engines: Array.from(expandedEngines),
					projs: Array.from(expandedProjects),
				}),
			);
		} catch {}
	}, [expandedEngines, expandedProjects]);

	const tree = useMemo(() => {
		const byEngine: Record<string, ProjectNavItem[]> = {};
		for (const p of projects) {
			if (!byEngine[p.engine]) byEngine[p.engine] = [];
			byEngine[p.engine].push(p);
		}

		const byProject: Record<string, DevlogNavItem[]> = {};
		for (const d of devlogs) {
			if (!byProject[d.project]) byProject[d.project] = [];
			byProject[d.project].push(d);
		}
		for (const slug in byProject) {
			byProject[slug].sort((a, b) => a.seq - b.seq);
		}

		return { byEngine, byProject };
	}, [projects, devlogs]);

	const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
		setter((prev) => {
			const next = new Set(prev);
			if (next.has(value)) next.delete(value);
			else next.add(value);
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
					<span className="text-[var(--color-accent)]">$</span> browse projects
				</span>
				<span>{drawerOpen ? '▴' : '▾'}</span>
			</button>

			<nav
				className={`${drawerOpen ? 'block' : 'hidden'} lg:block min-w-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}
			>
				<div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
					browse by engine
				</div>
				<ul className="space-y-0.5 font-mono text-sm">
					{ENGINES.map((engine) => {
						const projs = tree.byEngine[engine] || [];
						if (projs.length === 0) return null;
						const isOpen = expandedEngines.has(engine);
						return (
							<li key={engine}>
								<button
									type="button"
									onClick={() => toggle(setExpandedEngines, engine)}
									className="flex items-center gap-1.5 w-full py-1 px-1.5 -mx-1.5 rounded hover:bg-[var(--color-bg-elev)] text-left transition"
								>
									<span className="text-[var(--color-muted)] w-3 text-[10px]">
										{isOpen ? '▼' : '▶'}
									</span>
									<span className="text-[var(--color-fg)]">{engine}</span>
									<span className="ml-auto text-[10px] text-[var(--color-muted)]">
										{projs.length}
									</span>
								</button>
								{isOpen && (
									<ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--color-border)] pl-2">
										{projs.map((p) => {
											const projDevlogs = tree.byProject[p.id] || [];
											const hasLogs = projDevlogs.length > 0;
											const isProjOpen = expandedProjects.has(p.id);
											const isCurrentProject = p.id === currentProjectId;
											return (
												<li key={p.id}>
													<div className="flex items-center group">
														<button
															type="button"
															onClick={() => {
																if (hasLogs) toggle(setExpandedProjects, p.id);
															}}
															disabled={!hasLogs}
															className={`flex-1 flex items-center gap-1.5 py-1 px-1.5 -mx-1.5 rounded text-left transition min-w-0 ${
																hasLogs
																	? 'hover:bg-[var(--color-bg-elev)] cursor-pointer'
																	: 'cursor-default'
															}`}
														>
															<span className="text-[var(--color-muted)] w-3 text-[10px]">
																{hasLogs ? (isProjOpen ? '▼' : '▶') : '·'}
															</span>
															<span
																className={`truncate ${
																	isCurrentProject
																		? 'text-[var(--color-accent)] font-semibold'
																		: 'text-[var(--color-fg-dim)]'
																}`}
																title={p.title}
															>
																{p.title}
															</span>
															{hasLogs && (
																<span className="ml-auto text-[10px] text-[var(--color-muted)] tabular-nums">
																	{projDevlogs.length}
																</span>
															)}
														</button>
														<a
															href={`/projects/${p.id}/`}
															className={`text-[var(--color-muted)] hover:text-[var(--color-accent)] px-1.5 py-1 text-[10px] transition ${
																isCurrentProject ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
															}`}
															title="open project page"
															aria-label={`open ${p.title}`}
														>
															↗
														</a>
													</div>
													{hasLogs && isProjOpen && (
														<ul className="ml-4 mt-0.5 mb-1 space-y-px border-l border-[var(--color-border)] pl-2 text-xs">
															{projDevlogs.map((d) => {
																const isCurrentDevlog = d.id === currentDevlogId;
																return (
																	<li key={d.id}>
																		<a
																			href={`/projects/${d.project}/${d.slug}/`}
																			className={`flex items-baseline gap-2 py-1 px-1.5 -mx-1.5 rounded transition min-w-0 ${
																				isCurrentDevlog
																					? 'bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
																					: 'hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-accent)] text-[var(--color-fg-dim)]'
																			}`}
																		>
																			<span className="shrink-0 text-[10px] tabular-nums text-[var(--color-muted)]">
																				{String(d.seq).padStart(3, '0')}
																			</span>
																			<span className="truncate" title={d.title}>
																				{d.title}
																			</span>
																			{d.type && (
																				<span
																					className={`shrink-0 text-[9px] font-mono uppercase tracking-wider ${
																						TYPE_COLOR[d.type] || 'text-[var(--color-muted)]'
																					}`}
																				>
																					{d.type}
																				</span>
																			)}
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
								)}
							</li>
						);
					})}
				</ul>
			</nav>
		</>
	);
}
