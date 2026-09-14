// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { prepareImages } from './scripts/prepare-images.mjs';

await prepareImages(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  site: 'https://yuxiangworks.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [mdx(), sitemap()],
});
