// Real GLB bytes over a controlled local HTTP connection; no browser or LLM.
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
const mode = process.argv[2] || 'before';
const bytes = await readFile('public/models/itb.glb');
const source = execFileSync('git',['show','b494d9d:src/scripts/itb-viewer.ts'],{encoding:'utf8'});
const oldBody = source.slice(source.indexOf('    const response = await fetch'),source.indexOf('    const downloaded ='));
const { code: legacyCode } = await transform(`async function old(){${oldBody};return data.buffer}`, { loader:'ts' });
const legacy = new Function('fetch','root','signal','status',`${legacyCode};return old();`);
let download;
if (mode === 'after') {
  const {code} = await transform(await readFile('src/scripts/model-download.ts','utf8'),{loader:'ts',format:'esm'});
  download = (await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).downloadModel;
}
const connections = new Set();
const server = http.createServer((req,res)=> {
  res.writeHead(200,{'content-length':bytes.length,'content-type':'model/gltf-binary'});
  let offset=0;
  // 100 chunks at 1 second intervals: ~100s, continuously progressing beyond old 90s limit.
  const timer=setInterval(()=>{ const end=Math.min(bytes.length,offset+Math.ceil(bytes.length/100));res.write(bytes.subarray(offset,end));offset=end;if(offset===bytes.length){clearInterval(timer);res.end();}},1000);
  res.on('close',()=>clearInterval(timer));
});
server.on('connection',socket=>{connections.add(socket);socket.on('close',()=>connections.delete(socket));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/itb.glb`;
const start=performance.now();let result;
try {
  let data;
  if(mode==='before') {
    const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),90000);
    try { data=await legacy(fetch,{dataset:{modelUrl:url}},abort.signal,{textContent:''}); } finally {clearTimeout(timer);}
  } else data=await download(url,new AbortController().signal,()=>{},bytes.length);
  result={outcome:'complete',bytes:data.byteLength,sha256Matches:createHash('sha256').update(Buffer.from(data)).digest('hex')===createHash('sha256').update(bytes).digest('hex')};
} catch(error){result={outcome:'failed',error:String(error)};}
finally{for(const socket of connections)socket.destroy();await new Promise(resolve=>server.close(resolve));}
const report={at:new Date().toISOString(),mode,environment:'Node 24 Windows, local HTTP, real unchanged ITB GLB served in 100 timed chunks. Controlled software test, not real public-network/GLB render/user test. No LLM API or response replay.',elapsedMs:Math.round(performance.now()-start),...result};
await writeFile(`docs/evaluation/2026-10-01/transfer-${mode}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
