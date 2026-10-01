// Controller lifecycle regression tests; no WebGL/device performance claims.
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file = await readFile('src/components/ui/ITBViewer.astro','utf8');
const script = file.match(/<script>([\s\S]*?)<\/script>/)[1].replace("import('../../scripts/itb-viewer')", 'loadModule()');
const { code } = await transform(script,{loader:'ts',format:'esm'});
class Element extends EventTarget {
  dataset = {};hidden = true;disabled = false;textContent = '';click() { if (!this.disabled) this.dispatchEvent(new Event('click')); }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const root = new Element();const nodes = Object.fromEntries(['[data-load]','.model-status','[data-cancel]','[data-export]'].map(k=>[k,new Element()]));
  root.querySelector = selector => nodes[selector];
  const document = new EventTarget();document.querySelectorAll = () => [root];
  const imports=[], mounts=[];
  const loadModule = () => new Promise(resolve => imports.push(() => resolve({ mountITBViewer: (_root, signal) => new Promise((yes,no)=> mounts.push({signal,yes,no})) })));
  vm.runInNewContext(code,{document,AbortController,URLSearchParams,location:{search:''},performance,loadModule,console:{error(){}},Date,JSON,Blob,URL,setTimeout});
  return {root,nodes,document,imports,mounts};
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
console.log(JSON.stringify({at:new Date().toISOString(),scope:'Node event-controller tests with mocked loader; not browser, WebGL or physical device',passed:cases.length,cases},null,2));
