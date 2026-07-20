import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const visibility = z.enum(['public', 'unlisted', 'private']).default('public');
const baseRecord = z.object({
	title: z.string(),
	description: z.string().default(''),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	tags: z.array(z.string()).default([]),
	visibility,
	draft: z.boolean().default(false),
	pinned: z.boolean().default(false),
});

// Personal notes, life logs, essays, and public daily records.
const journal = defineCollection({
	loader: glob({ base: './src/content/journal', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		baseRecord.extend({
			heroImage: z.optional(image()),
			category: z.enum(['life', 'thought', 'review', 'note']).default('note'),
			relatedProjects: z.array(z.string()).default([]),
		}),
});

// Project case studies
const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		baseRecord.extend({
			coverImage: image(),
			engine: z.enum(['Unity', 'Unreal', 'Other']),
			platforms: z.array(z.enum(['PC', 'Mobile', 'Console', 'Web', 'VR'])).default([]),
			tech: z.array(z.string()).default([]),
			role: z.string().default('Solo Developer'),
			duration: z.string().optional(),
			status: z.enum(['prototype', 'in-progress', 'released']).default('in-progress'),
			playableUrl: z.string().url().optional(),
			repoUrl: z.string().url().optional(),
			videoUrl: z.string().url().optional(),
			featured: z.boolean().default(false),
		}),
});

// Project devlogs — one entry per logical work unit (commit or commit group).
// Files at src/content/devlogs/<project>/<seq-slug>.md
// Project association inferred from folder name.
export const DEVLOG_TYPES = [
	'feat',
	'fix',
	'refactor',
	'docs',
	'ci',
	'security',
	'release',
	'planning',
	'test',
] as const;

const devlogs = defineCollection({
	loader: glob({ base: './src/content/devlogs', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		baseRecord.extend({
			heroImage: z.optional(image()),
			seq: z.number().int().positive(),
			type: z.enum(DEVLOG_TYPES).optional(),
			commits: z.array(z.string()).default([]),
		}),
});

const resources = defineCollection({
	loader: glob({ base: './src/content/resources', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		baseRecord.extend({
			coverImage: z.optional(image()),
			resourceType: z.enum(['plugin', 'asset', 'tool', 'service', 'reference']).default('asset'),
			url: z.string().url().optional(),
			price: z.string().optional(),
			license: z.string().optional(),
			status: z.enum(['watching', 'testing', 'using', 'archived']).default('watching'),
			relatedProjects: z.array(z.string()).default([]),
			rating: z.number().min(0).max(5).optional(),
		}),
});

const travel = defineCollection({
	loader: glob({ base: './src/content/travel', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		baseRecord.extend({
			location: z.string(),
			startedAt: z.coerce.date().optional(),
			endedAt: z.coerce.date().optional(),
			coverImage: z.optional(image()),
			companions: z.array(z.string()).default([]),
			cost: z.string().optional(),
		}),
});

const health = defineCollection({
	loader: glob({ base: './src/content/health', pattern: '**/*.{md,mdx}' }),
	schema: () =>
		baseRecord.extend({
			visibility: z.literal('private').default('private'),
			weight: z.number().optional(),
			calories: z.number().int().positive().optional(),
			exercise: z.array(z.string()).default([]),
			mood: z.string().optional(),
			notes: z.string().optional(),
		}),
});

const rpDocs = defineCollection({
	loader: glob({ base: './src/content/rp-docs', pattern: '**/*.{md,mdx}' }),
	schema: () =>
		z.object({
			title: z.string(),
			description: z.string(),
			section: z.enum(['overview', 'flow', 'api', 'project', 'guide']),
			sourcePath: z.string(),
			status: z.string().default('Current'),
			documentType: z.string(),
			lastReviewed: z.string().optional(),
			searchKeywords: z.array(z.string()).default([]),
			order: z.number().int().nonnegative(),
		}),
});

export const collections = { journal, projects, devlogs, resources, travel, health, rpDocs };
