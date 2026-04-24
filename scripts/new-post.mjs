#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const [, , type, ...titleParts] = process.argv;
const title = titleParts.join(' ').trim();

if (!type || !title) {
	console.error('사용법:');
	console.error('  npm run new:blog    "제목"');
	console.error('  npm run new:project "제목"');
	process.exit(1);
}

if (type !== 'blog' && type !== 'project') {
	console.error(`알 수 없는 타입: "${type}". 'blog' 또는 'project'만 가능.`);
	process.exit(1);
}

// Slugify — keeps Korean characters, strips punctuation, spaces → hyphens
const slug = title
	.toLowerCase()
	.replace(/['"`,.!?()[\]{}<>:;]/g, '')
	.trim()
	.replace(/\s+/g, '-')
	.replace(/-+/g, '-')
	.replace(/^-|-$/g, '');

if (!slug) {
	console.error('제목이 slug로 변환될 수 없어요. 제목을 다시 확인하세요.');
	process.exit(1);
}

const today = new Date().toISOString().split('T')[0];
const escapedTitle = title.replace(/'/g, "\\'");

const templates = {
	blog: `---
title: '${escapedTitle}'
description: ''
pubDate: '${today}'
category: 'note'
tags: []
draft: true
---

`,
	project: `---
title: '${escapedTitle}'
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
const filename = `${slug}.md`;
const filepath = path.join(targetDir, filename);

if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(filepath)) {
	console.error(`이미 존재하는 파일: ${path.relative(projectRoot, filepath)}`);
	process.exit(1);
}

fs.writeFileSync(filepath, templates[type], 'utf-8');

const relPath = path.relative(projectRoot, filepath).replace(/\\/g, '/');
console.log('');
console.log(`✓ 생성됨: ${relPath}`);
console.log('');
console.log('다음 단계:');
console.log(`  1. 파일 열어서 description 채우기`);
console.log(`     ${type === 'blog' ? 'category (devlog|tech|daily|note), tags' : 'engine, platforms, tech, status, coverImage'} 확인`);
console.log(`  2. 본문 작성`);
console.log(`  3. 발행할 준비 되면 'draft: true' → 'draft: false'`);
console.log(`  4. git add . && git commit -m "${type}: ${title}" && git push`);
console.log(`     → Vercel 자동 배포`);
console.log('');
