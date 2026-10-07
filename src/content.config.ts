import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const architecture = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/architecture' }),
  schema: z.object({
    title: z.string(), subtitle: z.string(), year: z.string(), location: z.string(),
    area: z.string().optional(), collaborators: z.string().optional(), projectType: z.string().optional(),
    tags: z.array(z.string()), description: z.string(), coverImage: z.string(), bannerImage: z.string().optional(),
    featured: z.boolean().default(false), order: z.number().default(99),
  }),
});
export const collections = { architecture };
