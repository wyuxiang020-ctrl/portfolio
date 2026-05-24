import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    /** Display title */
    title: z.string(),
    /** Subtitle / short description under the title */
    subtitle: z.string(),
    /** Year or year range, e.g. "2026" or "2024–2025" */
    year: z.string(),
    /** City / country */
    location: z.string(),
    /** Optional floor area, e.g. "3 800 ㎡" */
    area: z.string().optional(),
    /** Optional collaborators */
    collaborators: z.string().optional(),
    /** Project type label, e.g. "MSA Studio Project" */
    projectType: z.string().optional(),
    /** Tags shown as chips */
    tags: z.array(z.string()),
    /** One-line description for card & meta */
    description: z.string(),
    /** Path or URL to the Work-grid cover image (3:2 ratio recommended) */
    coverImage: z.string(),
    /** Path or URL to the detail-page banner (16:9 or 21:9 recommended) */
    bannerImage: z.string().optional(),
    /** Pin to Home page "Selected Work" section (pick exactly 3) */
    featured: z.boolean().default(false),
    /** Lower = appears earlier in Work grid */
    order: z.number().default(99),
  }),
});

export const collections = { projects };
