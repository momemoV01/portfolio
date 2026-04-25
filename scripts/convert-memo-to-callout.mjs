#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const udit = path.join(projectRoot, 'src/content/devlogs/udit');

const files = fs.readdirSync(udit).filter((f) => f.endsWith('.md'));

let convertedCount = 0;

for (const file of files) {
	const filePath = path.join(udit, file);
	const raw = fs.readFileSync(filePath, 'utf-8');
	const usedCRLF = raw.includes('\r\n');
	const content = raw.replace(/\r\n/g, '\n');

	// Find "## 메모\n" position
	const memoMarker = '\n## 메모\n';
	const memoStart = content.indexOf(memoMarker);
	if (memoStart === -1) continue;

	// Body starts right after the marker
	const bodyStart = memoStart + memoMarker.length;

	// Body ends at next "\n## " (next h2) or EOF
	let bodyEnd = content.indexOf('\n## ', bodyStart);
	if (bodyEnd === -1) bodyEnd = content.length;

	const memoBody = content.slice(bodyStart, bodyEnd).trim();
	if (!memoBody) continue;

	// Split into blocks where each block starts with **bold** at line start
	const lines = memoBody.split('\n');
	const blocks = [];
	let current = null;

	for (const line of lines) {
		const boldMatch = line.match(/^\*\*([^*]+)\*\*\s*$/);
		if (boldMatch) {
			if (current) blocks.push(current);
			current = { label: boldMatch[1].trim(), lines: [] };
		} else {
			if (!current) current = { label: null, lines: [] };
			current.lines.push(line);
		}
	}
	if (current) blocks.push(current);

	const calloutPieces = blocks
		.map(({ label, lines }) => {
			while (lines.length && lines[0].trim() === '') lines.shift();
			while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
			const body = lines.join('\n').trim();
			const labelStr = label ? escapeForHtml(label) : 'memo';
			if (!body) {
				return `<aside class="callout callout-note">\n<span class="callout-label">${labelStr}</span>\n</aside>`;
			}
			return `<aside class="callout callout-note">\n<span class="callout-label">${labelStr}</span>\n\n${body}\n</aside>`;
		})
		.join('\n\n');

	// Replace the entire "## 메모\n\n...body..." block with callouts.
	// memoStart points to the "\n" before "## 메모"; keep that single newline.
	const before = content.slice(0, memoStart + 1);
	let after = content.slice(bodyEnd); // starts with "\n## " or is empty
	// Ensure blank line between last </aside> and next heading (or EOF cleanly)
	if (after.startsWith('\n## ')) {
		after = '\n' + after; // now "\n\n## "
	}
	const newNormalized = before + calloutPieces + after;

	if (newNormalized === content) continue;

	const newContent = usedCRLF ? newNormalized.replace(/\n/g, '\r\n') : newNormalized;
	fs.writeFileSync(filePath, newContent, 'utf-8');
	convertedCount++;
	console.log(`✓ ${file}`);
}

console.log(`\nConverted ${convertedCount} files.`);

function escapeForHtml(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
