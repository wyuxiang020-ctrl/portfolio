// Real local GLB transfer; the viewer module delay is a software fixture, not a browser measurement.
import http from 'node:http';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import assert from 'node:assert/strict';

const bytes=await readFile('public/models/shekua-lite.glb');
const hash=data=>createHash('sha256').update(Buffer.from(data)).digest('hex');
const sha256=hash(bytes);
const {outputFiles}=await build({entryPoints:['src/scripts/model-preparation.ts'],bundle:true,write:false,platform:'node',format:'esm',target:'node22'});
const {prepareModel}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].contents).toString('base64'));
const requests=[];const connections=new Set();
const server=http.createServer((req,res)=>{
  const entry={path:req.url,at:performance.now(),range:req.headers.range||null,closed:false};requests.push(entry);
  res.on('close',()=>{entry.closed=true;});
  if(req.url==='/fail'){res.writeHead(503);res.end();return;}
  if(req.url==='/stall'){res.writeHead(200,{'content-length':bytes.length});res.flushHeaders();return;}
  const match=/^bytes=(\d+)-(\d+)$/.exec(req.headers.range||'');
  const start=match?Number(match[1]):0;const end=match?Number(match[2]):bytes.length-1;
  res.writeHead(match?206:200,{'content-type':'model/gltf-binary','content-length':end-start+1,etag:'"lite-v1"',...(match?{'content-range':`bytes ${start}-${end}/${bytes.length}`}:{})});
  const timer=setTimeout(()=>res.end(bytes.subarray(start,end+1)),60);res.on('close',()=>clearTimeout(timer));
});
server.on('connection',socket=>{connections.add(socket);socket.on('close',()=>connections.delete(socket));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const source=(path,transport='single')=>({modelUrl:origin+path,modelBytes:String(bytes.length),modelTransport:transport,modelSha256:sha256});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const cases=[];let failure;
try{
  const started=performance.now();const metrics={bytes:0};let moduleAt;
  const asset=prepareModel(source('/single'),new AbortController().signal,()=>{},started,metrics);
  const module=new Promise(resolve=>setTimeout(()=>{moduleAt=performance.now();resolve();},120));
  const [prepared]=await Promise.all([asset,module]);
  assert.equal(hash(prepared.data),sha256);assert.equal(requests.filter(r=>r.path==='/single').length,1);
  assert.ok(requests.find(r=>r.path==='/single').at<moduleAt);assert.equal(prepared.metrics.transport,'single');
  assert.equal(prepared.metrics.bytes,bytes.length);assert.ok(Number.isFinite(prepared.metrics.downloadMs));
  cases.push({name:'real unchanged GLB starts while module fixture is pending, one GET, exact hash',bytes:prepared.data.byteLength,metrics,moduleFixtureMs:Math.round(moduleAt-started),bothReadyMs:Math.round(performance.now()-started)});

  const rangeMetrics={bytes:0};const ranged=await prepareModel(source('/ranges','ranges'),new AbortController().signal,()=>{},performance.now(),rangeMetrics);
  assert.equal(hash(ranged.data),sha256);assert.equal(rangeMetrics.requestedTransport,'ranges');assert.equal(rangeMetrics.transport,'ranges');
  cases.push({name:'existing bounded range transport preserves exact GLB through preparation',requests:requests.filter(r=>r.path==='/ranges').length,bytes:ranged.data.byteLength,metrics:rangeMetrics});

  const failureMetrics={bytes:0};await assert.rejects(prepareModel(source('/fail'),new AbortController().signal,()=>{},performance.now(),failureMetrics),error=>error.code==='http');
  assert.equal(failureMetrics.bytes,0);assert.equal(failureMetrics.transport,undefined);assert.ok(Number.isFinite(failureMetrics.downloadMs));
  cases.push({name:'HTTP failure retains code and timing without claiming a completed transfer',metrics:failureMetrics});

  const cancel=new AbortController();const cancelMetrics={bytes:0};const pending=prepareModel(source('/stall'),cancel.signal,()=>{},performance.now(),cancelMetrics);
  const rejected=assert.rejects(pending,error=>error.name==='AbortError');await delay(30);cancel.abort();await rejected;await delay(30);
  assert.equal(requests.find(r=>r.path==='/stall').closed,true);assert.equal(cancelMetrics.bytes,0);
  cases.push({name:'abort releases an active HTTP transfer before viewer import completes',metrics:cancelMetrics});
}catch(error){failure=String(error?.stack||error);}
finally{for(const socket of connections)socket.destroy();await new Promise(resolve=>server.close(resolve));}
const report={at:new Date().toISOString(),scope:'Node local HTTP integration using unchanged public/models/shekua-lite.glb; module delay is a deterministic fixture. Not real public network, browser/GPU, physical device, reader, author self-test, or LLM call.',sha256,passed:cases.length,...(failure?{failure}:{}),cases};
const output='docs/evaluation/2026-10-01-transfer';await mkdir(output,{recursive:true});
try{await writeFile(`${output}/preparation-first.json`,JSON.stringify(report,null,2),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
await writeFile(`${output}/preparation-tests.json`,JSON.stringify(report,null,2));await appendFile(`${output}/preparation-attempts.jsonl`,JSON.stringify(report)+'\n');
console.log(JSON.stringify(report,null,2));if(failure)process.exitCode=1;
