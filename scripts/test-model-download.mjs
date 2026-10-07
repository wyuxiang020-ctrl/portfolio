import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transform } from 'esbuild';
import assert from 'node:assert/strict';
const {code}=await transform(await readFile('src/scripts/model-download.ts','utf8'),{loader:'ts',format:'esm'});
const {downloadModel}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const models={itb:await readFile('public/models/itb.glb'),shekua:await readFile('public/models/shekua-lite.glb')};
const hash=b=>createHash('sha256').update(Buffer.from(b)).digest('hex');
const server=http.createServer((req,res)=>{
  const name=req.url.slice(1);
  if(models[name]){res.writeHead(200,{'content-length':models[name].length});res.end(models[name]);return;}
  if(name==='503'){res.writeHead(503);res.end();return;}
  res.writeHead(200);res.flushHeaders();
  if(name==='short'){res.end('partial');return;}
  if(name==='trickle') {const t=setInterval(()=>res.write('a'),30);res.on('close',()=>clearInterval(t));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/`;
const results=[];
async function test(name,run){const start=performance.now();try{await run();results.push({name,passed:true,ms:Math.round(performance.now()-start)});}catch(error){results.push({name,passed:false,error:String(error),ms:Math.round(performance.now()-start)});}}
const limits={idleMs:200,totalMs:500};
try{
  for(const name of Object.keys(models))await test(`${name}: real file transfer integrity`,async()=>{
    let last=0;const data=await downloadModel(base+name,new AbortController().signal,n=>{assert.ok(n>=last);last=n;},models[name].length);
    assert.equal(hash(data),hash(models[name]));assert.equal(last,models[name].length);
  });
  for(const [route,code] of [['503','http'],['stall','idle-timeout'],['trickle','total-timeout'],['short','incomplete']])
    await test(`fault ${route} => ${code}`,()=>assert.rejects(downloadModel(base+route,new AbortController().signal,()=>{},route==='short'?99:0,limits),e=>e.code===code));
  await test('cancel in flight',async()=>{const c=new AbortController();const timer=setTimeout(()=>c.abort(),50);try{await assert.rejects(downloadModel(base+'stall',c.signal,()=>{},0,limits),e=>e.name==='AbortError');}finally{clearTimeout(timer);}});
  await test('already cancelled',async()=>{const c=new AbortController();c.abort();await assert.rejects(downloadModel(base+'itb',c.signal,()=>{},0,limits),e=>e.name==='AbortError');});
  await test('retry after failure transfers real GLB',async()=>{await assert.rejects(downloadModel(base+'503',new AbortController().signal,()=>{}));const data=await downloadModel(base+'itb',new AbortController().signal,()=>{},models.itb.length);assert.equal(hash(data),hash(models.itb));});
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
const report={at:new Date().toISOString(),environment:'Node HTTP software integration tests, localhost. Uses real GLB bytes for success; deterministic injected HTTP faults for failure. Fault timers scaled to 200/500ms, not production performance. No browser rendering or LLM call/replay.',results};
await writeFile('docs/verification/models/download-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(results.some(r=>!r.passed))process.exitCode=1;

