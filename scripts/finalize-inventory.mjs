import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const inventory=JSON.parse(await readFile('data/source-inventory.json','utf8'));
inventory.stage='local_complete_not_deployed';inventory.checkedDate='2026-10-07';
for(const source of inventory.sources){source.migrationStatus='completed_locally';source.sourceFilesCopied=true;source.sourceCommit=source.kind==='ai'?'88f7631f7c142b2f72b739b6d18547f676f5ff8e':'bcf1ebe3375034f7b991c3aa519989e2e6d18bb3';source.notes=source.kind==='ai'?'3篇案例、公开证据、当前及原版简历迁入；7个额外旧公开media文件保留链接兼容；GitHub保存与发布分开。':'7篇MDX、210原图、618唯一WebP、2轻量模型；当前未提交文本亦做选择性快照；原目录只读。';}
async function walk(dir){let rows=[];for(const e of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())rows.push(...await walk(file));else rows.push({path:file.replaceAll('\\','/'),bytes:(await stat(file)).size});}return rows;}
const files=await walk('public');inventory.mergedPublic={fileCount:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes,0),largest:files.sort((a,b)=>b.bytes-a.bytes).slice(0,6),note:'Total on disk, not initial page transfer. Original images are opened on demand.'};
inventory.manifests=['data/source-snapshot-manifest.json','data/architecture-assets.json','data/ai-source-manifest.json','data/legacy-media-manifest.json'];
await writeFile('data/source-inventory.json',JSON.stringify(inventory,null,2)+'\n');
const map=JSON.parse(await readFile('data/migration-map.json','utf8'));map.status='local_implemented_not_deployed';map.localCompatibility='Eight /work/ HTML compatibility pages preserve query/hash. Real HTTP 301 and old AI hostname redirects are deployment-only and not enabled.';
for(const route of map.routes){route.localTargetReady=true;route.action=route.from.includes('/work/')?'local_html_compatibility_ready_http_redirect_pending':'target_ready_host_redirect_pending';}
map.assetCompatibility={preservedAiPublicPaths:true,extraLegacyMediaManifest:'data/legacy-media-manifest.json',architectureAssetsManifest:'data/architecture-assets.json',note:'Known referenced architecture originals retain their paths; unknown historical links require pre-release access-log audit.'};
await writeFile('data/migration-map.json',JSON.stringify(map,null,2)+'\n');
const snapshot=JSON.parse(await readFile('data/source-snapshot-manifest.json','utf8'));const changes=[];for(const row of snapshot.files){const digest=createHash('sha256').update(await readFile(row.source)).digest('hex');if(digest!==row.sha256)changes.push(row.source);}
await writeFile('docs/qa/source-preservation.json',JSON.stringify({checkedDate:'2026-10-07',checkedSourceFiles:snapshot.files.length,changedSourceFiles:changes,scope:'All selected source and uncommitted text snapshot files. Public asset hashes separately verified.'},null,2)+'\n');
console.log(JSON.stringify({publicFiles:files.length,publicBytes:inventory.mergedPublic.bytes,sourceFilesChecked:snapshot.files.length,changed:changes},null,2));
