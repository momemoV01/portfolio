#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const [, , type, ...rest] = process.argv;
const today = new Date().toISOString().split('T')[0];

if (!type) {
	printUsage();
	process.exit(1);
}

if (type === 'devlog') {
	const [projectSlug, ...titleParts] = rest;
	createDevlog(projectSlug, titleParts.join(' ').trim());
} else {
	const title = rest.join(' ').trim();
	createRecord(type, title);
}

function printUsage() {
	console.error('사용법:');
	console.error('  npm run new:journal  "제목"');
	console.error('  npm run new:project  "제목"');
	console.error('  npm run new:resource "제목"');
	console.error('  npm run new:travel   "제목"');
	console.error('  npm run new:health   "제목"');
	console.error('  npm run new:devlog   <project-slug> "제목"');
}

function slugify(title) {
	return title
		.toLowerCase()
		.replace(/['"`,.!?()[\]{}<>:;]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

function escapeYaml(s) {
	return s.replace(/'/g, "\\'");
}

function createRecord(type, title) {
	if (!title) {
		printUsage();
		process.exit(1);
	}

	const slug = slugify(title);
	if (!slug) {
		console.error('제목이 slug로 변환될 수 없어요.');
		process.exit(1);
	}

	const configs = {
		journal: {
			dir: 'journal',
			template: `---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
category: 'note'
tags: []
visibility: 'private'
draft: true
pinned: false
---

`,
		},
		project: {
			dir: 'projects',
			template: `---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
coverImage: '../../assets/blog-placeholder-1.jpg'
engine: 'Unity'
platforms: ['PC']
tech: []
role: 'Solo Developer'
duration: ''
status: 'in-progress'
featured: false
tags: []
visibility: 'private'
draft: true
pinned: false
---

`,
		},
		resource: {
			dir: 'resources',
			template: `---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
coverImage: '../../assets/blog-placeholder-3.jpg'
resourceType: 'asset'
status: 'watching'
price: ''
license: ''
relatedProjects: []
tags: []
visibility: 'private'
draft: true
pinned: false
---

`,
		},
		travel: {
			dir: 'travel',
			template: `---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
location: ''
coverImage: '../../assets/blog-placeholder-5.jpg'
companions: []
tags: []
visibility: 'private'
draft: true
pinned: false
---

`,
		},
		health: {
			dir: 'health',
			template: `---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
tags: []
visibility: 'private'
draft: true
exercise: []
pinned: false
---

`,
		},
	};

	const config = configs[type];
	if (!config) {
		console.error(`알 수 없는 타입: "${type}".`);
		printUsage();
		process.exit(1);
	}

	const filepath = path.join(projectRoot, 'src', 'content', config.dir, `${slug}.md`);
	writeFile(filepath, config.template);
	printSteps(type, title, filepath);
}

function createDevlog(projectSlug, title) {
	if (!projectSlug || !title) {
		printUsage();
		process.exit(1);
	}

	const projectFile = path.join(projectRoot, 'src', 'content', 'projects', `${projectSlug}.md`);
	const projectFileMdx = path.join(projectRoot, 'src', 'content', 'projects', `${projectSlug}.mdx`);
	if (!fs.existsSync(projectFile) && !fs.existsSync(projectFileMdx)) {
		console.error(`프로젝트 파일을 못 찾아요: src/content/projects/${projectSlug}.md`);
		process.exit(1);
	}

	const projectDevlogDir = path.join(projectRoot, 'src', 'content', 'devlogs', projectSlug);
	let nextSeq = 1;
	if (fs.existsSync(projectDevlogDir)) {
		const usedSeqs = fs
			.readdirSync(projectDevlogDir)
			.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
			.map((f) => {
				const content = fs.readFileSync(path.join(projectDevlogDir, f), 'utf-8');
				const m = content.match(/^seq:\s*(\d+)/m);
				return m ? parseInt(m[1], 10) : 0;
			});
		nextSeq = usedSeqs.length > 0 ? Math.max(...usedSeqs) + 1 : 1;
	}

	const seqStr = String(nextSeq).padStart(3, '0');
	const fileSlug = `${seqStr}-${slugify(title)}`;
	const filepath = path.join(projectDevlogDir, `${fileSlug}.md`);
	writeFile(
		filepath,
		`---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
seq: ${nextSeq}
type: 'feat'
commits: []
tags: []
visibility: 'private'
draft: true
pinned: false
---

`,
	);
	printSteps('devlog', title, filepath, { projectSlug, seq: nextSeq });
}

function writeFile(filepath, content) {
	const dir = path.dirname(filepath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	if (fs.existsSync(filepath)) {
		console.error(`이미 존재하는 파일: ${path.relative(projectRoot, filepath)}`);
		process.exit(1);
	}
	fs.writeFileSync(filepath, content, 'utf-8');
}

function printSteps(type, title, filepath, extra = {}) {
	const relPath = path.relative(projectRoot, filepath).replace(/\\/g, '/');
	console.log('');
	console.log(`✓ 생성됨: ${relPath}`);
	if (extra.seq) console.log(`  #${String(extra.seq).padStart(3, '0')} — ${extra.projectSlug}`);
	console.log('');
	console.log('다음 단계:');
	console.log('  1. description, tags, visibility 확인');
	console.log('  2. 본문 작성');
	console.log("  3. 공개 준비되면 visibility: 'public' 및 draft: false");
	console.log(`  4. git add . && git commit -m "${type}: ${title.replace(/"/g, '\\"')}"`);
	console.log('');
}
