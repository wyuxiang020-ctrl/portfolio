import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yuxiangworks.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap({filter: page => !new URL(page).pathname.startsWith('/work/') && !page.includes('/404')})],
  vite: { build: { chunkSizeWarningLimit: 650 } }
});
