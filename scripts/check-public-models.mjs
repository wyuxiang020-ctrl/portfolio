import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
const {code}=await transform(await readFile('src/scripts/model-download.ts','utf8'),{loader:'ts',format:'esm'});
const {downloadModel}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const results=[];
for(const name of ['itb','shekua']) {
  const local=await readFile(`public/models/${name}.glb`);const start=performance.now();let received=0;
  try {
    const data=await downloadModel(`https://yuxiangworks.com/models/${name}.glb`,new AbortController().signal,n=>{received=n;},local.length);
    const downloaded=performance.now();
    const matches=createHash('sha256').update(Buffer.from(data)).digest('hex')===createHash('sha256').update(local).digest('hex');
    if(!matches)throw new Error('SHA256 mismatch');
    const doc=await io.readBinary(new Uint8Array(data));
    results.push({name,outcome:'downloaded-and-decoded',bytes:received,downloadMs:Math.round(downloaded-start),decodeMs:Math.round(performance.now()-downloaded),sha256Matches:true,meshes:doc.getRoot().listMeshes().length,materials:doc.getRoot().listMaterials().length});
  }catch(error){results.push({name,outcome:'failed',elapsedMs:Math.round(performance.now()-start),bytes:received,error:String(error),code:error.code});}
}
const report={at:new Date().toISOString(),conditions:'Anonymous Node fetch of real public GLB, no cookies/API key; actual VPN routing unknown. Current production downloader, default 45s idle/300s total. NodeIO meshopt decode checks real data, not GPU/browser presentation or LLM API. n=1 per model.',results};
await writeFile('docs/evaluation/2026-10-01/public-models.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
