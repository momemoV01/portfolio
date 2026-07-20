import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceRoot = path.resolve(process.env.RP_DOCS_ROOT || path.join(projectRoot, '..', 'RP', 'Docs', 'docs'));
const outputRoot = path.resolve(projectRoot, 'src', 'content', 'rp-docs');
const manifestPath = path.resolve(projectRoot, 'src', 'generated', 'rp-docs-manifest.json');
const dashboardSnapshotPath = path.resolve(projectRoot, 'src', 'generated', 'project-dashboard.json');
const allowMissingSource = process.argv.includes('--if-available');

const documents = [
	{ source: 'reference/index.md', section: 'overview', order: 0 },
	{ source: 'reference/flows/Session_Room_Lifecycle.md', section: 'flow', order: 10 },
	{ source: 'reference/flows/InGame_Menu_Navigation.md', section: 'flow', order: 11 },
	{ source: 'reference/flows/Late_Join_Observer.md', section: 'flow', order: 12 },
	{ source: 'reference/Online_Types_Reference.md', section: 'api', order: 20 },
	{ source: 'reference/Session_Subsystem_API_Reference.md', section: 'api', order: 21 },
	{ source: 'reference/ui/UI_Foundation_Input_API.md', section: 'api', order: 22 },
	{ source: 'reference/ui/UI_Controls_API.md', section: 'api', order: 23 },
	{ source: 'reference/ui/UI_Session_Widgets_API.md', section: 'api', order: 24 },
	{ source: 'phases/Phase_16_Steam_Lobby_UX_Completion.md', section: 'project', order: 30 },
	{ source: 'phases/Phase_17_Bureau_Room_Blockout_Interaction_Layout.md', section: 'project', order: 31 },
	{ source: 'phases/Phase_18_Recoverable_Item_Drop_Physics_Deposit_Flow.md', section: 'project', order: 32 },
	{ source: 'phases/Phase_19_Anomaly_Zone_Blockout_Expansion.md', section: 'project', order: 33 },
	{ source: 'phases/Phase_20_Visual_UX_Polish_Pass.md', section: 'project', order: 34 },
	{ source: 'reports/Phase_15_Work_Report.md', section: 'project', order: 35 },
	{ source: 'reports/Phase_16_Work_Report.md', section: 'project', order: 36 },
	{ source: 'checklists/Phase_16_Editor_Verification_Checklist.md', section: 'project', order: 37 },
	{ source: 'guides/Debug_Command_Reference.md', section: 'guide', order: 40 },
	{ source: 'guides/Debug_HUD_Guide.md', section: 'guide', order: 41 },
	{ source: 'guides/Development_Validation_Pipeline_Guide.md', section: 'guide', order: 42 },
	{ source: 'guides/Frontend_UI_Widget_Guide.md', section: 'guide', order: 43 },
	{ source: 'guides/Performance_Test_Profile_Guide.md', section: 'guide', order: 44 },
	{ source: 'guides/Phase_16_Steam_Packaging_Guide.md', section: 'guide', order: 45 },
	{ source: 'guides/Roadmap_Project_Manager_Guide.md', section: 'guide', order: 46 },
	{ source: 'guides/Session_UI_Flow_Guide.md', section: 'guide', order: 47 },
];

function isInside(parent, child) {
	const relative = path.relative(parent, child);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function readBodyMetadata(markdown, label) {
	const prefix = `${label.toLowerCase()}:`;
	for (const originalLine of markdown.split(/\r?\n/)) {
		const line = originalLine.replace(/^\s*-\s*/, '').replaceAll('**', '').trim();
		if (line.toLowerCase().startsWith(prefix)) {
			return line.slice(prefix.length).trim();
		}
	}
	return '';
}

function titleFrom(markdown, source) {
	return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(source, path.extname(source));
}

function descriptionFor(title, section) {
	if (section === 'overview') return 'Recovery Protocol API 계약과 기능 흐름을 찾기 위한 공식 문서 진입점.';
	if (section === 'flow') return `${title}의 사용자 흐름, 상태 소유권과 시스템 간 책임을 설명합니다.`;
	if (section === 'api') return `${title}의 공개 계약, 완료 신호, 수명주기와 실패 경계를 설명합니다.`;
	if (section === 'project') return `${title}의 Phase 범위, 구현 결과와 검증 근거를 기록합니다.`;
	return `${title}의 Editor 조립, 개발 절차와 검증 기준을 설명합니다.`;
}

function defaultDocumentType(section) {
	return { overview: 'Reference Index', flow: 'Feature Flow', api: 'API Contract', project: 'Project Record', guide: 'Guide' }[section];
}

function routeIdFor(source) {
	return source
		.replace(/\.md$/i, '')
		.replaceAll('\\', '/')
		.replace(/\/index$/i, '')
		.toLocaleLowerCase('en-US');
}

function quote(value) {
	return JSON.stringify(String(value));
}

async function exists(target) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}

function parseFrontmatter(markdown) {
	const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
	const values = {};

	for (const line of frontmatter.split(/\r?\n/)) {
		const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
		if (!match) continue;

		const [, key, rawValue] = match;
		const value = rawValue.trim();
		if (!value) {
			values[key] = null;
			continue;
		}

		if (value === 'true' || value === 'false') {
			values[key] = value === 'true';
			continue;
		}

		if (/^-?\d+(?:\.\d+)?$/.test(value)) {
			values[key] = Number(value);
			continue;
		}

		if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('"') && value.endsWith('"'))) {
			try {
				values[key] = JSON.parse(value);
				continue;
			} catch {
				// Fall through to the plain-string representation for hand-edited Markdown.
			}
		}

		values[key] = value.replace(/^['"]|['"]$/g, '');
	}

	return values;
}

function readMarkdownSection(markdown, heading) {
	const lines = markdown.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trim() === heading);
	if (start < 0) return '';
	const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
	return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
}

function plainText(markdown) {
	return String(markdown || '')
		.replace(/<!--.*?-->/gs, ' ')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/^[-*+]\s+/gm, '')
		.replace(/[*_>#~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function parseChecklist(markdown) {
	return String(markdown || '')
		.split(/\r?\n/)
		.map((line) => line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/))
		.filter(Boolean)
		.map((match) => ({ completed: match[1].toLowerCase() === 'x', text: plainText(match[2]) }));
}

function parseBulletList(markdown) {
	return String(markdown || '')
		.split(/\r?\n/)
		.map((line) => line.match(/^\s*[-*+]\s+(?!\[[ xX]\])(.+)$/)?.[1] || '')
		.map(plainText)
		.filter(Boolean);
}

function parseRelatedDocs(markdown, taskPath) {
	const links = [];
	const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
	for (const match of String(markdown || '').matchAll(pattern)) {
		const label = plainText(match[1]);
		const rawTarget = match[2].trim();
		if (/^https?:\/\//i.test(rawTarget)) {
			links.push({ label, sourcePath: rawTarget, href: rawTarget, external: true });
			continue;
		}

		const withoutAnchor = rawTarget.split('#')[0];
		const resolved = path.resolve(path.dirname(taskPath), withoutAnchor);
		if (!isInside(sourceRoot, resolved) || !/\.md$/i.test(resolved)) continue;
		const relative = path.relative(sourceRoot, resolved).replaceAll('\\', '/');
		const isPublished = documents.some((document) => document.source === relative);
		links.push({
			label,
			sourcePath: relative,
			href: isPublished ? `/docs/${routeIdFor(relative)}` : '',
			external: false,
		});
	}
	return links;
}

function splitTableRow(line) {
	return line
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => plainText(cell));
}

function parseTableUnderHeading(markdown, headingPattern) {
	const lines = markdown.split(/\r?\n/);
	const headingIndex = lines.findIndex((line) => headingPattern.test(line));
	if (headingIndex < 0) return [];

	const rows = [];
	for (let index = headingIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (/^##\s+/.test(line)) break;
		if (!/^\s*\|/.test(line) || /^\s*\|?\s*:?-+/.test(line)) continue;
		rows.push(splitTableRow(line));
	}
	return rows.slice(1);
}

function taskCode(title) {
	return String(title || '').match(/^\[([^\]]+)\]/)?.[1] || '';
}

function taskName(title) {
	return String(title || '').replace(/^\[[^\]]+\]\s*/, '').trim();
}

function runGit(repoRoot, args) {
	try {
		return execFileSync('git', ['-C', repoRoot, ...args], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
	} catch {
		return '';
	}
}

function normaliseRepositoryUrl(remote) {
	const value = String(remote || '').trim().replace(/\.git$/i, '');
	if (/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/i.test(value)) return value;
	const ssh = value.match(/^git@github\.com:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/i);
	return ssh ? `https://github.com/${ssh[1]}` : '';
}

async function createDashboardSnapshot() {
	const roadmapRoot = path.resolve(sourceRoot, 'roadmap', 'data');
	const taskRoot = path.resolve(roadmapRoot, 'RP Project Roadmap_tasks');
	if (!(await exists(taskRoot))) return null;

	const taskFiles = (await readdir(taskRoot, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
		.map((entry) => entry.name);
	const tasks = [];
	for (const fileName of taskFiles) {
		const taskPath = path.join(taskRoot, fileName);
		const markdown = (await readFile(taskPath, 'utf8')).replace(/^\uFEFF/, '');
		const data = parseFrontmatter(markdown);
		const title = String(data.title || path.basename(fileName, '.md'));
		const doneCriteria = readMarkdownSection(markdown, '## Done Criteria');
		const evidence = readMarkdownSection(markdown, '## Evidence');
		const relatedDocs = readMarkdownSection(markdown, '## Related Docs');
		const notes = readMarkdownSection(markdown, '## Notes');
		tasks.push({
			id: String(data.id || ''),
			code: taskCode(title),
			title: taskName(title),
			type: String(data.type || 'task'),
			status: String(data.status || 'todo'),
			priority: String(data.priority || 'medium'),
			start: String(data.start || ''),
			due: String(data.due || ''),
			progress: Number(data.progress || 0),
			parentId: String(data.parentId || ''),
			assignees: Array.isArray(data.assignees) ? data.assignees.map(String) : [],
			tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag).replace(/^#/, '')) : [],
			subtaskIds: Array.isArray(data.subtaskIds) ? data.subtaskIds.map(String) : [],
			dependencies: Array.isArray(data.dependencies) ? data.dependencies.map(String) : [],
			goal: plainText(readMarkdownSection(markdown, '## Goal')),
			doneCriteria: parseChecklist(doneCriteria),
			blockingReason: plainText(readMarkdownSection(markdown, '## Blocking Reason')),
			evidence: parseBulletList(evidence),
			relatedDocs: parseRelatedDocs(relatedDocs, taskPath),
			notes: parseBulletList(notes),
			sourcePath: path.relative(sourceRoot, taskPath).replaceAll('\\', '/'),
		});
	}

	tasks.sort((left, right) => left.start.localeCompare(right.start) || left.code.localeCompare(right.code));
	const phases = tasks.filter((task) => task.code.startsWith('PH-'));
	const currentPhase =
		phases.find((phase) => phase.status === 'in-progress' || phase.tags.includes('current')) ||
		phases.find((phase) => phase.status !== 'done' && phase.status !== 'cancelled') ||
		phases.at(-1);
	const currentChildren = currentPhase ? tasks.filter((task) => task.parentId === currentPhase.id) : [];
	const currentActions = currentChildren.filter((task) => task.code.startsWith('ACT-'));
	const nextMilestone = currentChildren.find((task) => task.code.startsWith('MS-')) || null;
	const currentPhaseNumber = currentPhase?.code.match(/^PH-(\d+)$/)?.[1] || '16';
	const reportsRoot = path.resolve(sourceRoot, 'reports');
	let workReportPath = path.resolve(reportsRoot, `Phase_${currentPhaseNumber}_Work_Report.md`);
	if (!(await exists(workReportPath))) {
		const reportCandidates = (await readdir(reportsRoot, { withFileTypes: true }))
			.filter((entry) => entry.isFile() && /^Phase_\d+_Work_Report\.md$/i.test(entry.name))
			.sort((left, right) => {
				const leftPhase = Number(left.name.match(/^Phase_(\d+)/i)?.[1] || 0);
				const rightPhase = Number(right.name.match(/^Phase_(\d+)/i)?.[1] || 0);
				return rightPhase - leftPhase;
			});
		if (reportCandidates.length === 0) return null;
		workReportPath = path.resolve(reportsRoot, reportCandidates[0].name);
	}
	const evidencePhaseNumber = path.basename(workReportPath).match(/^Phase_(\d+)/i)?.[1] || currentPhaseNumber;

	const workReport = (await readFile(workReportPath, 'utf8')).replace(/^\uFEFF/, '');
	const validations = parseTableUnderHeading(workReport, /^##\s+5\.\s+최신 검증 Snapshot\s*$/).map((cells) => ({
		label: cells[0] || '',
		status: cells[1] || 'Not Run',
		detail: cells[2] || '',
		evidence: cells[3] || '',
	}));
	const openActions = parseTableUnderHeading(workReport, /^##\s+6\.\s+Open Action Register\s*$/)
		.map((cells) => ({
			code: cells[0] || '',
			title: cells[1] || '',
			assignee: cells[2] || '',
			blocked: /^yes\b/i.test(cells[3] || ''),
			blockingReason: (cells[3] || '').replace(/^yes\s*[-–—]?\s*/i, ''),
			doneCondition: cells[4] || '',
			evidence: cells[5] || '',
		}))
		.filter((action) => /^ACT-\d+-\d+$/i.test(action.code));

	const rpRoot = path.resolve(sourceRoot, '..', '..');
	const branch = runGit(rpRoot, ['branch', '--show-current']);
	const repositoryUrl = normaliseRepositoryUrl(runGit(rpRoot, ['remote', 'get-url', 'origin']));
	const logOutput = runGit(rpRoot, [
		'log', '--all', '--since=365 days ago', '--date=short',
		'--pretty=format:%H%x1f%h%x1f%ad%x1f%s',
	]);
	const commits = logOutput
		? logOutput.split(/\r?\n/).map((line) => {
			const [hash, shortHash, date, subject] = line.split('\x1f');
			return { hash, shortHash, date, subject };
		}).filter((commit) => commit.hash && commit.date)
		: [];
	const commitCounts = new Map();
	for (const commit of commits) commitCounts.set(commit.date, (commitCounts.get(commit.date) || 0) + 1);
	const now = new Date();
	const activity = [];
	for (let offset = 364; offset >= 0; offset -= 1) {
		const date = new Date(now);
		date.setHours(12, 0, 0, 0);
		date.setDate(date.getDate() - offset);
		const key = date.toISOString().slice(0, 10);
		activity.push({ date: key, count: commitCounts.get(key) || 0 });
	}
	const currentMonth = now.toISOString().slice(0, 7);

	return {
		schemaVersion: 1,
		snapshotAt: now.toISOString(),
		project: {
			name: 'Recovery Protocol',
			roadmapTitle: 'RP Project Roadmap',
			currentPhaseId: currentPhase?.id || '',
			currentPhaseCode: currentPhase?.code || '',
			currentPhaseTitle: currentPhase?.title || '',
			phaseStage: currentPhase?.status === 'in-progress' ? 'Current' : currentPhase?.status === 'done' ? 'Done' : 'Next',
			evidencePhaseCode: `PH-${evidencePhaseNumber}`,
			progress: currentPhase?.progress || 0,
			start: currentPhase?.start || '',
			due: currentPhase?.due || '',
			reviewCount: currentActions.filter((task) => task.status === 'review').length,
			blockedCount: openActions.filter((action) => action.blocked).length,
			nextMilestone: nextMilestone ? { code: nextMilestone.code, title: nextMilestone.title, due: nextMilestone.due } : null,
		},
		phases,
		tasks,
		currentActions,
		openActions,
		validations,
		git: {
			branch,
			repositoryUrl,
			commitsLastYear: commits.length,
			commitsThisMonth: commits.filter((commit) => commit.date.startsWith(currentMonth)).length,
			activity,
			recentCommits: commits.slice(0, 6).map((commit) => ({
				...commit,
				url: repositoryUrl ? `${repositoryUrl}/commit/${commit.hash}` : '',
			})),
		},
	};
}

if (!(await exists(sourceRoot))) {
	if (allowMissingSource && (await exists(outputRoot))) {
		console.log(`[rp-docs] Canonical source unavailable; using the checked-in snapshot at ${outputRoot}`);
		process.exit(0);
	}
	throw new Error(`RP docs source was not found: ${sourceRoot}`);
}

if (!isInside(projectRoot, outputRoot) || path.basename(outputRoot) !== 'rp-docs') {
	throw new Error(`Unsafe generated output path: ${outputRoot}`);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

const manifest = [];

for (const document of documents) {
	const sourcePath = path.resolve(sourceRoot, document.source);
	if (!isInside(sourceRoot, sourcePath)) throw new Error(`Source escaped docs root: ${document.source}`);

	const markdown = (await readFile(sourcePath, 'utf8')).replace(/^\uFEFF/, '');
	const title = titleFrom(markdown, document.source);
	const status = readBodyMetadata(markdown, 'Status') || 'Current';
	const documentType = readBodyMetadata(markdown, 'Document Type') || defaultDocumentType(document.section);
	const lastReviewed =
		readBodyMetadata(markdown, 'Last Contract Review') ||
		readBodyMetadata(markdown, 'Last Reviewed') ||
		'';
	const searchKeywords = (readBodyMetadata(markdown, 'Search Keywords') || title)
		.split(',')
		.map((keyword) => keyword.trim())
		.filter(Boolean);
	const description = descriptionFor(title, document.section);
	const targetPath = path.resolve(outputRoot, document.source);
	if (!isInside(outputRoot, targetPath)) throw new Error(`Output escaped generated root: ${document.source}`);

	const frontmatter = [
		'---',
		`title: ${quote(title)}`,
		`description: ${quote(description)}`,
		`section: ${quote(document.section)}`,
		`sourcePath: ${quote(document.source)}`,
		`status: ${quote(status)}`,
		`documentType: ${quote(documentType)}`,
		...(lastReviewed ? [`lastReviewed: ${quote(lastReviewed)}`] : []),
		'searchKeywords:',
		...searchKeywords.map((keyword) => `  - ${quote(keyword)}`),
		`order: ${document.order}`,
		'---',
		'',
	].join('\n');

	const contentMarkdown = markdown.replace(/^#\s+.+?(?:\r?\n|$)/, '').trim();
	await mkdir(path.dirname(targetPath), { recursive: true });
	await writeFile(targetPath, `${frontmatter}${contentMarkdown}\n`, 'utf8');

	manifest.push({
		id: routeIdFor(document.source),
		title,
		description,
		section: document.section,
		documentType,
		status,
		lastReviewed,
		searchKeywords,
		order: document.order,
		searchText: markdown.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_`>|\[\](){}-]/g, ' ').replace(/\s+/g, ' ').trim(),
	});
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const dashboardSnapshot = await createDashboardSnapshot();
if (dashboardSnapshot) {
	await writeFile(dashboardSnapshotPath, `${JSON.stringify(dashboardSnapshot, null, 2)}\n`, 'utf8');
}
console.log(`[rp-docs] Synced ${manifest.length} documents${dashboardSnapshot ? ' and the project dashboard' : ''} from ${sourceRoot}`);
