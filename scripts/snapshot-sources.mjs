import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const target=process.cwd();
const sources=[
  {id:'ai',root:'E:/ai作品网站/portfolio',trees:['app'],files:['package.json','portable/build.mjs','README.md']},
  {id:'architecture',root:'E:/cd portfolio',trees:['src','docs/evaluation','docs/design','docs/models','docs/hearth'],files:['package.json','astro.config.mjs','README.md','PROJECT_CHECKUP.md','docs/AI-PRODUCT-PORTFOLIO-CASE-STUDY.md']}
];
const extensions=new Set(['.ts','.tsx','.js','.mjs','.astro','.md','.mdx','.json','.css','.txt']);
const records=[];
async function walk(root,relative){let files=[];try{for(const e of await readdir(path.join(root,relative),{withFileTypes:true})){const rel=path.join(relative,e.name);if(e.isDirectory()){if(!['node_modules','.git','.claude','.codex'].includes(e.name))files.push(...await walk(root,rel));}else if(extensions.has(path.extname(rel)))files.push(rel);}}catch(e){if(e.code!=='ENOENT')throw e;}return files;}
for(const source of sources){let files=[...source.files];for(const tree of source.trees)files.push(...await walk(source.root,tree));let commit;try{commit=execFileSync('git',['-c',`safe.directory=${source.root}`,'-C',source.root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{commit='unavailable';}
 for(const rel of [...new Set(files)]){const input=path.join(source.root,rel);let bytes;try{bytes=await readFile(input);}catch(e){if(e.code==='ENOENT')continue;throw e;}const dest=path.join('docs/source-snapshots',source.id,rel);await mkdir(path.dirname(path.join(target,dest)),{recursive:true});await copyFile(input,path.join(target,dest));records.push({source:input,destination:dest.replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),sourceCommit:commit});}}
await writeFile('data/source-snapshot-manifest.json',JSON.stringify({date:'2026-10-07',scope:'Selected current source and useful uncommitted text records; excludes account config, secrets, dependencies, git history, unused generated binaries. Original public files preserved in source; migrated assets have separate manifests.',files:records},null,2));
console.log(`Saved ${records.length} current source/evidence files (${(records.reduce((s,r)=>s+r.bytes,0)/1048576).toFixed(2)} MiB).`);
