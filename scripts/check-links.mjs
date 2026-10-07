import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
const root=path.resolve('dist');
async function walk(dir){let r=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);r.push(...(e.isDirectory()?await walk(p):[p]));}return r;}
const files=await walk(root), pages=files.filter(p=>p.endsWith('.html')), failures=[], checked=[];
const existing=new Set(files.map(p=>p.replaceAll('\\','/')));
const fragmentCache=new Map();
async function targetHasFragment(file,id){if(!fragmentCache.has(file)){const source=await readFile(file,'utf8');const found=new Set();const tree=parse(source);function visit(node){for(const a of node.attrs||[])if(a.name==='id')found.add(a.value);for(const child of node.childNodes||[])visit(child);}visit(tree);fragmentCache.set(file,found);}return fragmentCache.get(file).has(id);}
for(const file of pages){const html=await readFile(file,'utf8'), tree=parse(html);const ids=new Set(), links=[];function scan(node){const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));if(attrs.id)ids.add(attrs.id);for(const key of ['href','src','data-full-src','data-model-src','data-src'])if(attrs[key])links.push({url:attrs[key],tag:node.tagName,key});if(attrs.srcset)for(const src of attrs.srcset.split(','))links.push({url:src.trim().split(' ')[0],tag:node.tagName,key:'srcset'});for(const c of node.childNodes||[])scan(c);}scan(tree);
const relative=path.relative(root,file).replaceAll('\\','/'),route=relative==='index.html'?'/':'/'+relative.replace(/index\.html$/,'');
for(const link of links){if(/^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/.test(link.url))continue;const url=new URL(link.url,'https://local.test'+route);const pathname=decodeURIComponent(url.pathname);let target=path.join(root,pathname).replaceAll('\\','/');if(!existing.has(target)){if(existing.has(target+'/index.html'))target+='/index.html';else if(existing.has(target+'index.html'))target+='index.html';else {failures.push({page:route,...link,error:'missing file'});continue;}}if(url.hash&&target.endsWith('.html')&&!await targetHasFragment(target,decodeURIComponent(url.hash.slice(1))))failures.push({page:route,...link,error:'missing destination fragment'});checked.push({page:route,url:link.url});}
if(/(?:https?:\/\/localhost|chatgpt\.site)/.test(html))failures.push({page:route,error:'legacy business host reference'});}
const report={date:'2026-10-07',pages:pages.length,localReferences:checked.length,files:files.length,totalBytes:(await Promise.all(files.map(f=>stat(f)))).reduce((sum,s)=>sum+s.size,0),failures};
await mkdir('docs/qa',{recursive:true});await writeFile('docs/qa/static-checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
