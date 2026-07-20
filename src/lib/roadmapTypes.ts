export type RoadmapStatus = 'todo' | 'in-progress' | 'review' | 'blocked' | 'done' | 'cancelled' | string;

export type RoadmapChecklistItem = {
	completed: boolean;
	text: string;
};

export type RoadmapDocumentLink = {
	label: string;
	sourcePath: string;
	href: string;
	external: boolean;
};

export type RoadmapTask = {
	id: string;
	code: string;
	title: string;
	type: string;
	status: RoadmapStatus;
	priority: string;
	start: string;
	due: string;
	progress: number;
	parentId: string;
	assignees: string[];
	tags: string[];
	subtaskIds: string[];
	dependencies: string[];
	goal: string;
	doneCriteria: RoadmapChecklistItem[];
	blockingReason: string;
	evidence: string[];
	relatedDocs: RoadmapDocumentLink[];
	notes: string[];
	sourcePath: string;
};

export type RoadmapSnapshot = {
	project: {
		currentPhaseId: string;
	};
	phases: RoadmapTask[];
	tasks: RoadmapTask[];
};

export const ROADMAP_STATUS_LABELS: Record<string, string> = {
	todo: 'TODO',
	'in-progress': 'IN PROGRESS',
	review: 'REVIEW',
	blocked: 'BLOCKED',
	done: 'DONE',
	cancelled: 'CANCELLED',
};

export function statusLabel(status: string): string {
	return ROADMAP_STATUS_LABELS[status] || status.toUpperCase();
}

export function shortRoadmapDate(value: string): string {
	if (!value) return '미정';
	return new Intl.DateTimeFormat('ko-KR', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${value}T12:00:00Z`));
}
