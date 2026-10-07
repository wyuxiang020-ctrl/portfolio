import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {mkdir,writeFile,readFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),out=resolve(root,'portable-dist');
const shared={configFile:false,root,plugins:[react()],resolve:{alias:{'@':root}},css:{postcss:{plugins:[tailwindcss()]}}};
await build({...shared,publicDir:false,build:{outDir:resolve(root,'work/portable-render'),ssr:'portable/render.tsx',rolldownOptions:{output:{entryFileNames:'render.mjs'}}}});
await build({...shared,publicDir:false,build:{outDir:out,manifest:true,rolldownOptions:{input:'portable/client.tsx'}}});
const manifest=JSON.parse(await readFile(resolve(out,'.vite/manifest.json'),'utf8'));
const entry=manifest['portable/client.tsx'];
const {pages}=await import('../work/portable-render/render.mjs');
const rendered=pages();
for(const page of rendered){const dir=resolve(out,'.'+page.path);await mkdir(dir,{recursive:true});await writeFile(resolve(dir,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${page.title}</title><meta name="description" content="王誉翔的 AI 产品作品集：建筑知识检索、健身与饮食记录、交互式建筑作品集。"><link rel="icon" href="/favicon.svg">${(entry.css||[]).map(css=>`<link rel="stylesheet" href="/${css}">`).join('')}</head><body><div id="root">${page.body}</div><script type="module" src="/${entry.file}"></script></body></html>`)}
await cp(resolve(root,'public'),out,{recursive:true});
await writeFile(resolve(out,'404.html'),'<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><title>页面未找到</title><h1>页面未找到</h1><a href="/">返回作品集</a></html>');
await writeFile(resolve(out,'edgeone.json'),JSON.stringify({rewrites:rendered.filter(p=>p.path!=='/').map(p=>({source:p.path,destination:p.path+'/index.html'}))},null,2));
console.log(`Portable site: ${rendered.length} pre-rendered pages in ${out}`);

