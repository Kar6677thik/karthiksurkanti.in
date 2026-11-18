import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One file per case study. Every number here is quoted from the project's own
// README or results files (see CLAUDE.md, Rule 3).
const number = z.object({
	value: z.string(), // as written, e.g. "1,110"
	label: z.string(), // what it counts
});

export const collections = {
	work: defineCollection({
		loader: glob({ pattern: '*.md', base: './src/content/work' }),
		schema: z.object({
			title: z.string(),
			order: z.number(),
			year: z.string(),
			kind: z.string(), // the kind of work, a few words
			pitch: z.string(), // one sentence
			inspiredBy: z.string().optional(),
			github: z.string().url(),
			stack: z.array(z.string()),
			naive: number, // the failure, measured
			fixed: number, // the same measure after the fix
			conditions: z.string(), // where the numbers were measured
			media: z
				.object({
					src: z.string(),
					poster: z.string().optional(),
					alt: z.string(),
					caption: z.string(),
					width: z.number(),
					height: z.number(),
				})
				.optional(),
			charts: z
				.array(z.object({ src: z.string(), alt: z.string(), caption: z.string(), width: z.number(), height: z.number() }))
				.default([]),
		}),
	}),
};
