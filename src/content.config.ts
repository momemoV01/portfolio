import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			category: z.enum(['devlog', 'tech', 'daily', 'note']).default('note'),
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
		}),
});

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
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
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog, projects };
