import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
const bundle=await build({entryPoints:['src/scripts/model-range-download.ts'],bundle:true,write:false,format:'esm',platform:'browser'});
const {downloadModelInRanges}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const modelFile=process.argv[3]||'shekua.glb';
if (!/^shekua(?:-lite)?\.glb$/.test(modelFile)) throw new Error('Unsupported model file');
const outputDir=process.argv[4]||'docs/evaluation/2026-10-01-hearth';
const original=await readFile(`public/models/${modelFile}`);const hash=createHash('sha256').update(original).digest('hex');
const originalFetch=globalThis.fetch, requests=[];
globalThis.fetch=async (...args)=>{const start=performance.now();const record={range:new Headers(args[1]?.headers).get('range'),ifRange:new Headers(args[1]?.headers).get('if-range')};requests.push(record);try{const response=await originalFetch(...args);Object.assign(record,{status:response.status,contentRange:response.headers.get('content-range'),encoding:response.headers.get('content-encoding'),etag:response.headers.get('etag'),headerMs:Math.round(performance.now()-start)});return response;}catch(error){record.error=String(error);throw error;}};
const start=performance.now();let received=0,result;
try {
  const data=await downloadModelInRanges(`https://yuxiangworks.com/models/${modelFile}`,new AbortController().signal,n=>{received=n;},original.length,hash);
  const downloaded=performance.now();
  await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
  const doc=await io.readBinary(new Uint8Array(data));
  result={outcome:'downloaded-verified-decoded',bytes:data.byteLength,downloadMs:Math.round(downloaded-start),decodeMs:Math.round(performance.now()-downloaded),sha256Matches:createHash('sha256').update(Buffer.from(data)).digest('hex')===hash,meshes:doc.getRoot().listMeshes().length,materials:doc.getRoot().listMaterials().length};
}catch(error){result={outcome:'failed',elapsedMs:Math.round(performance.now()-start),confirmedBytes:received,error:String(error),code:error.code};}
finally{globalThis.fetch=originalFetch;}
const report={at:new Date().toISOString(),modelFile,conditions:'Anonymous Node fetch, actual public GLB compared with the local file, no explicit proxy/auth. VPN unknown. <=4 workers,512KiB chunks,45s per-request idle,300s shared deadline. Real transfer/hash/decode software verification, NOT browser GPU or user study. n=1; historical comparisons are not controlled.',expectedHash:hash,...result,requests};
const name=process.argv[2]||'public-ranges-first';
await writeFile(`${outputDir}/${name}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,requests:requests.length},null,2));
