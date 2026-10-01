// Controller lifecycle regression tests; no WebGL/device performance claims.
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { transform } from 'esbuild';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file = await readFile('src/components/ui/ITBViewer.astro','utf8');
const script = file.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/import \{ prepareModel, type ModelPreparationMetrics \} from '[^']+';/, '')
  .replace("import('../../scripts/itb-viewer')", 'loadModule()');
const { code } = await transform(script,{loader:'ts',format:'esm'});
class Element extends EventTarget {
  dataset = {};hidden = true;disabled = false;textContent = '';click() { if (!this.disabled) this.dispatchEvent(new Event('click')); }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup({ deferredAsset = false, measuring = false, clock = performance } = {}) {
  const root = new Element();const nodes = Object.fromEntries(['[data-load]','.model-status','[data-cancel]','[data-export]'].map(k=>[k,new Element()]));
  root.querySelector = selector => nodes[selector];
  const document = new EventTarget();document.querySelectorAll = () => [root];
  const imports=[], mounts=[], downloads=[];
  const loadModule = () => new Promise((resolve, reject) => {
    const ready = () => resolve({ mountITBViewer: (_root, signal, clickedAt, prepared) => new Promise((yes,no)=> mounts.push({signal,yes,no,clickedAt,prepared})) });
    ready.no = reject;imports.push(ready);
  });
  const prepareModel = (_source, signal, progress, started, metrics) => new Promise((yes, no) => {
    const data = new Uint8Array([103,108,84,70]).buffer;
    const entry = {signal,progress,metrics,data,yes: () => { metrics.downloadMs = Math.round(clock.now() - started);metrics.bytes=data.byteLength;yes({data,metrics}); },no};
    downloads.push(entry);signal.addEventListener('abort',()=>no(signal.reason),{once:true});
    if (!deferredAsset) entry.yes();
  });
  vm.runInNewContext(code,{document,AbortController,URLSearchParams,location:{search:measuring?'?modelTest=1':''},performance:clock,loadModule,prepareModel,console:{error(){}},Date,JSON,Blob,URL,setTimeout});
  return {root,nodes,document,imports,mounts,downloads};
}
const cases=[];
for (const [code, hint] of [['idle-timeout','45 秒'],['total-timeout','5 分钟'],['incomplete','完整']]) {
  const x=setup();x.nodes['[data-load]'].click();x.imports.shift()();await tick();
  x.mounts[0].no(Object.assign(new Error(code),{code}));await tick();
  assert.ok(x.nodes['.model-status'].textContent.includes(hint));
  assert.equal(x.nodes['[data-load]'].disabled,false);cases.push(`${code}: actionable feedback and retry available`);
}
{
  const x=setup();x.nodes['[data-load]'].click();assert.equal(x.nodes['[data-cancel]'].hidden,false);
  x.nodes['[data-cancel]'].click();assert.equal(x.nodes['[data-load]'].disabled,false);
  x.imports.shift()();await tick();assert.equal(x.mounts.length,0);cases.push('cancel during module import prevents mount');
}
{
  const x=setup();const button=x.nodes['[data-load]'];button.click();x.imports.shift()();await tick();const old=x.mounts[0];
  x.nodes['[data-cancel]'].click();assert.equal(old.signal.aborted,true);button.click();x.imports.shift()();await tick();
  old.no(new Error('old aborted'));await tick();assert.equal(button.disabled,true);assert.equal(x.nodes['[data-cancel]'].hidden,false);
  x.mounts[1].yes(()=>{});await tick();assert.equal(button.disabled,false);cases.push('cancel and immediate reopen: stale rejection cannot unlock or overwrite new attempt');
}
{
  const x=setup();x.nodes['[data-load]'].click();x.imports.shift()();await tick();x.mounts[0].no(new Error('HTTP 503'));await tick();
  assert.match(x.nodes['.model-status'].textContent,/暂时无法打开/);assert.equal(x.nodes['[data-load]'].disabled,false);cases.push('download failure exposes retry');
}
{
  const x=setup();x.nodes['[data-load]'].click();x.imports.shift()();await tick();x.document.dispatchEvent(new Event('astro:before-swap'));
  assert.equal(x.mounts[0].signal.aborted,true);x.mounts[0].no(new Error('navigation'));await tick();cases.push('page navigation aborts in-flight load');
}
{
  const x=setup();let disposed=0;x.nodes['[data-load]'].click();x.imports.shift()();await tick();x.mounts[0].yes(()=>disposed++);await tick();
  x.document.dispatchEvent(new Event('astro:before-swap'));assert.equal(disposed,1);cases.push('page navigation disposes ready model');
}
{
  const x=setup();x.document.dispatchEvent(new Event('astro:page-load'));x.document.dispatchEvent(new Event('astro:page-load'));
  x.nodes['[data-load]'].click();assert.equal(x.imports.length,1);cases.push('repeated page-load events do not duplicate load handlers');
}
{
  const x=setup({deferredAsset:true});assert.equal(x.downloads.length,0);assert.equal(x.imports.length,0);
  x.nodes['[data-load]'].click();assert.equal(x.downloads.length,1);assert.equal(x.imports.length,1);assert.equal(x.mounts.length,0);
  x.downloads[0].yes();await tick();assert.equal(x.mounts.length,0);
  x.imports[0]();await tick();assert.equal(x.mounts.length,1);assert.equal(x.mounts[0].prepared.data,x.downloads[0].data);
  assert.equal(x.downloads.length,1);x.mounts[0].yes(()=>{});await tick();
  cases.push('no preload before click; download starts before module resolves; exact prepared buffer reaches mount once');
}
{
  let now=1000;const x=setup({deferredAsset:true,clock:{now:()=>now}});
  x.nodes['[data-load]'].click();now+=40;x.imports[0]();await tick();assert.equal(x.mounts.length,0);
  now+=60;x.downloads[0].yes();await tick();assert.equal(x.mounts.length,1);
  assert.equal(x.mounts[0].prepared.metrics.moduleReadyMs,40);assert.equal(x.mounts[0].prepared.metrics.downloadMs,100);
  assert.equal(now-x.mounts[0].clickedAt,100);x.mounts[0].yes(()=>{});await tick();
  cases.push('deterministic timeline: 40 ms module and 100 ms model overlap; mount at 100 ms vs serial 140 ms (simulation)');
}
{
  const x=setup({deferredAsset:true,measuring:true});x.nodes['[data-load]'].click();
  x.imports[0].no(new Error('module unavailable'));await tick();
  assert.equal(x.downloads[0].signal.aborted,true);assert.equal(x.nodes['[data-load]'].disabled,false);
  assert.match(x.nodes['.model-status'].textContent,/暂时无法打开/);
  assert.equal(JSON.parse(x.root.dataset.modelEvaluation)[0].outcome,'module-failed');
  x.nodes['[data-load]'].click();x.imports[1]();x.downloads[1].yes();await tick();assert.equal(x.mounts.length,1);x.mounts[0].yes(()=>{});await tick();
  cases.push('module failure aborts pending download, preserves module error, and allows successful retry');
}
{
  const x=setup({deferredAsset:true,measuring:true});x.nodes['[data-load]'].click();
  x.downloads[0].no(Object.assign(new Error('HTTP 503'),{code:'http'}));await tick();
  assert.equal(x.nodes['[data-load]'].disabled,false);assert.match(x.nodes['.model-status'].textContent,/暂时无法打开/);
  assert.equal(JSON.parse(x.root.dataset.modelEvaluation)[0].outcome,'download-failed');
  x.imports[0]();await tick();assert.equal(x.mounts.length,0);
  cases.push('download failure is visible without waiting for module; late module resolution cannot mount');
}
{
  const x=setup({deferredAsset:true,measuring:true});x.nodes['[data-load]'].click();x.downloads[0].progress(2,4);
  x.nodes['[data-cancel]'].click();await tick();assert.equal(x.downloads[0].signal.aborted,true);
  assert.equal(JSON.parse(x.root.dataset.modelEvaluation)[0].outcome,'cancelled-before-mount');
  x.nodes['[data-load]'].click();x.downloads[1].progress(1,4);const freshStatus=x.nodes['.model-status'].textContent;
  x.downloads[0].progress(4,4);assert.equal(x.nodes['.model-status'].textContent,freshStatus);
  x.imports[0]();await tick();assert.equal(x.mounts.length,0);assert.equal(x.nodes['[data-load]'].disabled,true);
  x.imports[1]();x.downloads[1].yes();await tick();assert.equal(x.mounts.length,1);x.mounts[0].yes(()=>{});await tick();
  cases.push('cancel during parallel preparation records immediately; reopen ignores stale progress and stale module');
}
{
  const x=setup({deferredAsset:true});x.nodes['[data-load]'].click();
  x.document.dispatchEvent(new Event('astro:before-swap'));await tick();assert.equal(x.downloads[0].signal.aborted,true);
  x.imports[0]();await tick();assert.equal(x.mounts.length,0);
  cases.push('page leave aborts preparation download and prevents late mount');
}
for (const first of ['download','module']) {
  const x=setup({deferredAsset:true,measuring:true});x.nodes['[data-load]'].click();
  const downloadError=Object.assign(new Error('HTTP 503'),{code:'http'});const moduleError=new Error('module failed');
  if(first==='download'){x.downloads[0].no(downloadError);x.imports[0].no(moduleError);}
  else{x.imports[0].no(moduleError);x.downloads[0].no(downloadError);}
  await tick();const sample=JSON.parse(x.root.dataset.modelEvaluation)[0];
  assert.equal(sample.outcome,`${first}-failed`);assert.equal(sample.error,String(first==='download'?downloadError:moduleError));
  assert.equal(x.downloads[0].signal.aborted,true);assert.equal(x.nodes['[data-load]'].disabled,false);
  cases.push(`same-turn double failure preserves first ${first} rejection and its matching phase`);
}
const report={at:new Date().toISOString(),scope:'Node event-controller tests with mocked module and transport; no browser, GPU, real network, device or LLM. Timeline values are deterministic simulation, not observed user improvement.',passed:cases.length,cases};
const out='docs/evaluation/2026-10-01-transfer';await mkdir(out,{recursive:true});
try {await writeFile(`${out}/lifecycle-first.json`,JSON.stringify(report,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
await writeFile(`${out}/lifecycle-tests.json`,JSON.stringify(report,null,2));await appendFile(`${out}/lifecycle-attempts.jsonl`,JSON.stringify(report)+'\n');
console.log(JSON.stringify(report,null,2));
