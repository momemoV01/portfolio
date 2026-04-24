#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const [, , type, ...rest] = process.argv;

if (!type) {
	printUsage();
	process.exit(1);
}

const today = new Date().toISOString().split('T')[0];

if (type === 'blog' || type === 'project') {
	const title = rest.join(' ').trim();
	if (!title) {
		printUsage();
		process.exit(1);
	}
	createSimple(type, title);
} else if (type === 'devlog') {
	const [projectSlug, ...titleParts] = rest;
	if (!projectSlug) {
		printUsage();
		process.exit(1);
	}
	createDevlog(projectSlug, titleParts.join(' ').trim());
} else {
	console.error(`알 수 없는 타입: "${type}".`);
	printUsage();
	process.exit(1);
}

function printUsage() {
	console.error('사용법:');
	console.error('  npm run new:blog    "제목"');
	console.error('  npm run new:project "제목"');
	console.error('  npm run new:devlog  <project-slug> ["추가 제목"]');
	console.error('');
	console.error('예시:');
	console.error('  npm run new:devlog sample-unity-project "셰이더 실험"');
	console.error('  npm run new:devlog sample-unity-project');
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

function createSimple(type, title) {
	const slug = slugify(title);
	if (!slug) {
		console.error('제목이 slug로 변환될 수 없어요.');
		process.exit(1);
	}

	const templates = {
		blog: `---
title: '${escapeYaml(title)}'
description: ''
pubDate: '${today}'
category: 'note'
tags: []
draft: true
---

`,
		project: `---
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
draft: true
---

`,
	};

	const targetDir = path.join(projectRoot, 'src', 'content', type === 'blog' ? 'blog' : 'projects');
	const filepath = path.join(targetDir, `${slug}.md`);

	writeFile(filepath, templates[type]);
	printSteps(type, title, filepath);
}

function createDevlog(projectSlug, extraTitle) {
	// Verify project exists
	const projectFile = path.join(projectRoot, 'src', 'content', 'projects', `${projectSlug}.md`);
	const projectFileMdx = path.join(projectRoot, 'src', 'content', 'projects', `${projectSlug}.mdx`);
	if (!fs.existsSync(projectFile) && !fs.existsSync(projectFileMdx)) {
		console.error(`프로젝트 파일을 못 찾아요: src/content/projects/${projectSlug}.md`);
		console.error('');
		console.error('사용 가능한 프로젝트:');
		const projectsDir = path.join(projectRoot, 'src', 'content', 'projects');
		if (fs.existsSync(projectsDir)) {
			fs.readdirSync(projectsDir)
				.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
				.forEach((f) => console.error(`  - ${f.replace(/\.(md|mdx)$/, '')}`));
		}
		process.exit(1);
	}

	// Find next day number from existing devlogs in project folder
	const projectDevlogDir = path.join(projectRoot, 'src', 'content', 'devlogs', projectSlug);
	let nextDay = 1;
	if (fs.existsSync(projectDevlogDir)) {
		const usedDays = fs
			.readdirSync(projectDevlogDir)
			.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
			.map((f) => {
				const content = fs.readFileSync(path.join(projectDevlogDir, f), 'utf-8');
				const m = content.match(/^day:\s*(\d+)/m);
				return m ? parseInt(m[1], 10) : 0;
			});
		nextDay = usedDays.length > 0 ? Math.max(...usedDays) + 1 : 1;
	}

	const dayLabel = `Day ${String(nextDay).padStart(2, '0')}`;
	const fullTitle = extraTitle ? `${dayLabel}: ${extraTitle}` : dayLabel;
	const fileSlug = `day-${String(nextDay).padStart(2, '0')}`;

	const template = `---
title: '${escapeYaml(fullTitle)}'
description: ''
pubDate: '${today}'
day: ${nextDay}
tags: []
draft: true
---

`;

	const filepath = path.join(projectDevlogDir, `${fileSlug}.md`);
	writeFile(filepath, template);
	printSteps('devlog', fullTitle, filepath, { projectSlug, day: nextDay });
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
	if (extra.day) {
		console.log(`  Day ${extra.day} — ${extra.projectSlug} 프로젝트의 devlog`);
	}
	console.log('');
	console.log('다음 단계:');
	console.log(`  1. 파일 열어서 description, tags 채우기`);
	console.log(`  2. 본문 작성`);
	console.log(`  3. 발행 준비되면 'draft: true' → 'draft: false'`);
	console.log(
		`  4. git add . && git commit -m "${type}: ${title.replace(/"/g, '\\"')}" && git push`,
	);
	console.log('');
}
