import { useEffect, useMemo, useState } from 'react';
import {
	shortRoadmapDate,
	statusLabel,
	type RoadmapSnapshot,
	type RoadmapTask,
} from '../../lib/roadmapTypes';

type ViewMode = 'table' | 'gantt' | 'board';

type ExplorerProps = {
	snapshot: RoadmapSnapshot;
};

type DrawerHostProps = {
	snapshot: RoadmapSnapshot;
};

const VIEW_LABELS: Array<{ id: ViewMode; label: string }> = [
	{ id: 'table', label: 'Table' },
	{ id: 'gantt', label: 'Gantt' },
	{ id: 'board', label: 'Board' },
];

const BOARD_COLUMNS = ['todo', 'in-progress', 'review', 'blocked', 'done'] as const;

function dateValue(value: string): number {
	return value ? new Date(`${value}T12:00:00Z`).getTime() : 0;
}

function scheduleStyle(start: string, due: string, rangeStart: number, rangeEnd: number) {
	const span = Math.max(1, rangeEnd - rangeStart);
	const left = Math.max(0, Math.min(100, ((dateValue(start) - rangeStart) / span) * 100));
	const right = Math.max(left + 1.5, Math.min(100, ((dateValue(due) - rangeStart) / span) * 100));
	return { left: `${left}%`, width: `${Math.max(1.5, right - left)}%` };
}

function taskMap(snapshot: RoadmapSnapshot) {
	return new Map(snapshot.tasks.map((task) => [task.id, task]));
}

export default function RoadmapExplorer({ snapshot }: ExplorerProps) {
	const [view, setView] = useState<ViewMode>('gantt');
	const [phaseFilter, setPhaseFilter] = useState('all');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const tasksById = useMemo(() => taskMap(snapshot), [snapshot]);
	const selected = selectedId ? tasksById.get(selectedId) || null : null;

	const visiblePhases = phaseFilter === 'all'
		? snapshot.phases
		: snapshot.phases.filter((phase) => phase.id === phaseFilter);
	const visiblePhaseIds = new Set(visiblePhases.map((phase) => phase.id));
	const visibleTasks = snapshot.tasks.filter((task) => !task.code.startsWith('PH-') && visiblePhaseIds.has(task.parentId));

	return (
		<div className="roadmap-explorer">
			<div className="roadmap-toolbar">
				<div className="roadmap-view-tabs" role="tablist" aria-label="Roadmap 보기 방식">
					{VIEW_LABELS.map((item) => (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={view === item.id}
							className={view === item.id ? 'is-active' : ''}
							onClick={() => setView(item.id)}
						>
							{item.label}
						</button>
					))}
				</div>
				<label className="roadmap-phase-filter">
					<span>Phase</span>
					<select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}>
						<option value="all">전체 Phase</option>
						{snapshot.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.code} · {phase.title}</option>)}
					</select>
				</label>
				<p>행·막대·카드를 선택하면 원본 작업 문서를 오른쪽에서 확인합니다.</p>
			</div>

			{view === 'table' && (
				<TableView phases={visiblePhases} tasks={visibleTasks} tasksById={tasksById} onSelect={setSelectedId} />
			)}
			{view === 'gantt' && (
				<GanttView phases={visiblePhases} tasks={visibleTasks} onSelect={setSelectedId} />
			)}
			{view === 'board' && (
				<BoardView phases={visiblePhases} tasks={visibleTasks} onSelect={setSelectedId} />
			)}

			<RoadmapDetailDrawer
				selected={selected}
				tasksById={tasksById}
				onSelect={setSelectedId}
				onClose={() => setSelectedId(null)}
			/>
		</div>
	);
}

export function RoadmapDrawerHost({ snapshot }: DrawerHostProps) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const tasksById = useMemo(() => taskMap(snapshot), [snapshot]);
	const selected = selectedId ? tasksById.get(selectedId) || null : null;

	useEffect(() => {
		const handleClick = (event: MouseEvent) => {
			const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-roadmap-id]');
			if (!trigger?.dataset.roadmapId) return;
			setSelectedId(trigger.dataset.roadmapId);
		};
		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	}, []);

	return (
		<RoadmapDetailDrawer
			selected={selected}
			tasksById={tasksById}
			onSelect={setSelectedId}
			onClose={() => setSelectedId(null)}
		/>
	);
}

function TableView({
	phases,
	tasks,
	tasksById,
	onSelect,
}: {
	phases: RoadmapTask[];
	tasks: RoadmapTask[];
	tasksById: Map<string, RoadmapTask>;
	onSelect: (id: string) => void;
}) {
	return (
		<div className="roadmap-table-view" role="tabpanel">
			{phases.map((phase) => {
				const children = tasks.filter((task) => task.parentId === phase.id);
				return (
					<section key={phase.id} className="roadmap-table-phase">
						<button type="button" className="roadmap-table-phase-heading" onClick={() => onSelect(phase.id)}>
							<div><code>{phase.code}</code><strong>{phase.title}</strong><p>{phase.goal}</p></div>
							<span className={`dash-status is-${phase.status}`}>{statusLabel(phase.status)}</span>
							<b>{phase.progress}%</b>
							<time>{shortRoadmapDate(phase.start)} – {shortRoadmapDate(phase.due)}</time>
						</button>
						<div className="roadmap-data-table" role="table" aria-label={`${phase.code} 작업 목록`}>
							<div className="roadmap-data-head" role="row"><span>Task</span><span>Status</span><span>Owner</span><span>Schedule</span><span>Depends on</span></div>
							{children.map((task) => (
								<button key={task.id} type="button" className="roadmap-data-row" role="row" onClick={() => onSelect(task.id)}>
									<div><code>{task.code}</code><strong>{task.title}</strong><p>{task.goal}</p></div>
									<span className={`dash-status is-${task.status}`}>{statusLabel(task.status)} · {task.progress}%</span>
									<span>{task.assignees.join(', ') || '—'}</span>
									<time>{shortRoadmapDate(task.start)} – {shortRoadmapDate(task.due)}</time>
									<span>{task.dependencies.length ? task.dependencies.map((id) => tasksById.get(id)?.code || id).join(', ') : '—'}</span>
								</button>
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}

function GanttView({ phases, tasks, onSelect }: { phases: RoadmapTask[]; tasks: RoadmapTask[]; onSelect: (id: string) => void }) {
	const scheduled = [...phases, ...tasks].filter((task) => task.start && task.due);
	const rangeStart = Math.min(...scheduled.map((task) => dateValue(task.start)));
	const rangeEnd = Math.max(...scheduled.map((task) => dateValue(task.due)));

	return (
		<div className="roadmap-gantt-view" role="tabpanel">
			<div className="roadmap-gantt-scroll">
				<div className="roadmap-gantt-canvas">
					<div className="roadmap-gantt-header">
						<div className="roadmap-gantt-label"><strong>Task</strong><span>{scheduled.length} scheduled items</span></div>
						<div className="roadmap-gantt-timeline-header">
							{phases.map((phase) => (
								<button key={phase.id} type="button" style={scheduleStyle(phase.start, phase.due, rangeStart, rangeEnd)} onClick={() => onSelect(phase.id)}>
									<strong>{phase.code}</strong><span>{shortRoadmapDate(phase.start)} – {shortRoadmapDate(phase.due)}</span>
								</button>
							))}
						</div>
					</div>
					{phases.map((phase) => (
						<section key={phase.id} className="roadmap-gantt-group">
							<button type="button" className="roadmap-gantt-phase-row" onClick={() => onSelect(phase.id)}>
								<span><code>{phase.code}</code><strong>{phase.title}</strong></span><em>{phase.progress}%</em>
							</button>
							{tasks.filter((task) => task.parentId === phase.id).map((task) => (
								<div key={task.id} className="roadmap-gantt-task-row">
									<button type="button" className="roadmap-gantt-task-label" onClick={() => onSelect(task.id)}><code>{task.code}</code><span>{task.title}</span></button>
									<div className="roadmap-gantt-track">
										<button
											type="button"
											className={`roadmap-gantt-bar is-${task.status}`}
											style={scheduleStyle(task.start, task.due, rangeStart, rangeEnd)}
											onClick={() => onSelect(task.id)}
											title={`${task.code} · ${task.title}`}
										>
											<strong>{task.code}</strong><span>{task.title}</span><em>{task.progress}%</em>
										</button>
									</div>
								</div>
							))}
						</section>
					))}
				</div>
			</div>
		</div>
	);
}

function BoardView({ phases, tasks, onSelect }: { phases: RoadmapTask[]; tasks: RoadmapTask[]; onSelect: (id: string) => void }) {
	const phaseById = new Map(phases.map((phase) => [phase.id, phase]));
	return (
		<div className="roadmap-board-view" role="tabpanel">
			{BOARD_COLUMNS.map((status) => {
				const items = tasks.filter((task) => task.status === status);
				return (
					<section key={status} className={`roadmap-board-column is-${status}`}>
						<header><span>{statusLabel(status)}</span><b>{items.length}</b></header>
						<div>
							{items.map((task) => (
								<button key={task.id} type="button" className="roadmap-board-card" onClick={() => onSelect(task.id)}>
									<div><code>{task.code}</code><span>{phaseById.get(task.parentId)?.code}</span></div>
									<strong>{task.title}</strong>
									<p>{task.goal}</p>
									<footer><span>{task.assignees.join(', ') || '—'}</span><time>{shortRoadmapDate(task.due)}</time></footer>
								</button>
							))}
							{items.length === 0 && <p className="roadmap-board-empty">작업 없음</p>}
						</div>
					</section>
				);
			})}
		</div>
	);
}

function RoadmapDetailDrawer({
	selected,
	tasksById,
	onSelect,
	onClose,
}: {
	selected: RoadmapTask | null;
	tasksById: Map<string, RoadmapTask>;
	onSelect: (id: string) => void;
	onClose: () => void;
}) {
	useEffect(() => {
		if (!selected) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [selected, onClose]);

	if (!selected) return null;
	const parent = selected.parentId ? tasksById.get(selected.parentId) : null;
	const dependencies = selected.dependencies.map((id) => tasksById.get(id)).filter((task): task is RoadmapTask => Boolean(task));
	const subtasks = selected.subtaskIds.map((id) => tasksById.get(id)).filter((task): task is RoadmapTask => Boolean(task));

	return (
		<div className="roadmap-drawer-layer">
			<button type="button" className="roadmap-drawer-backdrop" aria-label="상세 닫기" onClick={onClose}></button>
			<aside className="roadmap-drawer" role="dialog" aria-modal="true" aria-labelledby="roadmap-drawer-title">
				<header className="roadmap-drawer-header">
					<div><span>PROJECT MANAGER SNAPSHOT</span><code>{selected.code}</code></div>
					<button type="button" aria-label="상세 닫기" onClick={onClose}>×</button>
				</header>
				<div className="roadmap-drawer-scroll">
					<div className="roadmap-drawer-title">
						<span className={`dash-status is-${selected.status}`}>{statusLabel(selected.status)}</span>
						<h2 id="roadmap-drawer-title">[{selected.code}] {selected.title}</h2>
					</div>
					<div className="roadmap-drawer-properties">
						<div><span>Type</span><strong>{selected.type}</strong></div>
						<div><span>Priority</span><strong>{selected.priority}</strong></div>
						<div><span>Progress</span><strong>{selected.progress}%</strong></div>
						<div><span>Schedule</span><strong>{shortRoadmapDate(selected.start)} – {shortRoadmapDate(selected.due)}</strong></div>
						<div><span>Assignees</span><strong>{selected.assignees.join(', ') || '—'}</strong></div>
						<div><span>Tags</span><strong>{selected.tags.map((tag) => `#${tag}`).join(' ') || '—'}</strong></div>
					</div>

					<DrawerSection title="Goal"><p>{selected.goal || '기록 없음'}</p></DrawerSection>
					<DrawerSection title="Done Criteria">
						{selected.doneCriteria.length ? (
							<ul className="roadmap-checklist">{selected.doneCriteria.map((item, index) => <li key={index} className={item.completed ? 'is-done' : ''}><span>{item.completed ? '✓' : ''}</span><p>{item.text}</p></li>)}</ul>
						) : <p>기록 없음</p>}
					</DrawerSection>
					<DrawerSection title="Blocking Reason"><p>{selected.blockingReason || '없음'}</p></DrawerSection>
					<DrawerSection title="Evidence">
						{selected.evidence.length ? <ul>{selected.evidence.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>기록 없음</p>}
					</DrawerSection>
					<DrawerSection title="Related Docs">
						{selected.relatedDocs.length ? (
							<div className="roadmap-related-docs">{selected.relatedDocs.map((doc) => doc.href ? <a key={doc.sourcePath} href={doc.href} target={doc.external ? '_blank' : undefined} rel={doc.external ? 'noreferrer' : undefined}><strong>{doc.label}</strong><span>{doc.sourcePath}</span></a> : <div key={doc.sourcePath}><strong>{doc.label}</strong><span>{doc.sourcePath} · Obsidian 원본</span></div>)}</div>
						) : <p>연결된 문서 없음</p>}
					</DrawerSection>
					{selected.notes.length > 0 && <DrawerSection title="Notes"><ul>{selected.notes.map((item, index) => <li key={index}>{item}</li>)}</ul></DrawerSection>}

					{(parent || dependencies.length > 0 || subtasks.length > 0) && (
						<DrawerSection title="Task Relations">
							<div className="roadmap-task-relations">
								{parent && <TaskRelation label="Parent" task={parent} onSelect={onSelect} />}
								{dependencies.map((task) => <TaskRelation key={task.id} label="Depends on" task={task} onSelect={onSelect} />)}
								{subtasks.map((task) => <TaskRelation key={task.id} label="Subtask" task={task} onSelect={onSelect} />)}
							</div>
						</DrawerSection>
					)}
				</div>
				<footer className="roadmap-drawer-footer"><span>READ ONLY</span><code>{selected.sourcePath}</code></footer>
			</aside>
		</div>
	);
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
	return <section className="roadmap-drawer-section"><h3>{title}</h3>{children}</section>;
}

function TaskRelation({ label, task, onSelect }: { label: string; task: RoadmapTask; onSelect: (id: string) => void }) {
	return <button type="button" onClick={() => onSelect(task.id)}><span>{label}</span><code>{task.code}</code><strong>{task.title}</strong></button>;
}
