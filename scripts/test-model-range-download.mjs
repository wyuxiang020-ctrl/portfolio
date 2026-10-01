// Local HTTP integration tests: real GLB bytes plus deterministic transport faults.
// These are software tests, not browser rendering, device acceptance, or reader research.
import http from 'node:http';
import { readFile, writeFile, appendFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { brotliCompressSync } from 'node:zlib';
import { build } from 'esbuild';
import assert from 'node:assert/strict';

const outputDir = 'docs/evaluation/2026-10-01-hearth';
const { outputFiles } = await build({ entryPoints: ['src/scripts/model-range-download.ts'], bundle: true, write: false, platform: 'node', format: 'esm', target: 'node22' });
const { downloadModelInRanges } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));
const models = { itb: await readFile('public/models/itb.glb'), hearth: await readFile('public/models/shekua.glb') };
const hash = bytes => createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const hashes = Object.fromEntries(Object.entries(models).map(([key, bytes]) => [key, hash(bytes)]));
const chunkBytes = 256 * 1024;
const ordinary = { chunkBytes, concurrency: 4, idleMs: 1500, totalMs: 10000 };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const runs = new Map();
let nextId = 0;

const server = http.createServer((req, res) => {
  const run = runs.get(req.url?.slice(1));
  if (!run) { res.writeHead(404); res.end(); return; }
  const range = req.headers.range;
  const match = range && /^bytes=(\d+)-(\d+)$/.exec(range);
  const start = match ? Number(match[1]) : 0;
  const end = match ? Number(match[2]) : run.data.length - 1;
  const record = { range: range || null, ifRange: req.headers['if-range'] || null, start, end, finished: false, canceled: false };
  run.requests.push(record); run.active++; run.maxActive = Math.max(run.maxActive, run.active);
  const timers = new Set();
  res.on('finish', () => { record.finished = true; });
  res.on('close', () => { run.active--; record.canceled = !record.finished; for (const timer of timers) clearTimeout(timer); });
  const later = (fn, ms) => { const timer = setTimeout(fn, ms); timers.add(timer); };
  const interval = (fn, ms) => { const timer = setInterval(fn, ms); timers.add(timer); };
  const head = (status, headers = {}) => { record.status = status; res.writeHead(status, { 'content-type': 'model/gltf-binary', ...headers }); };
  const stall = () => { head(206, { 'content-range': `bytes ${start}-${end}/${run.data.length}`, etag: '"model-v1"' }); res.flushHeaders(); };
  const complete = (status, body, headers = {}, delay = 0) => {
    head(status, { 'content-length': body.length, ...headers }); res.flushHeaders();
    later(() => { if (!res.destroyed) res.end(body); }, delay);
  };
  if (!range) {
    if (run.kind === 'fallback-deadline') {
      head(200, { etag: '"model-v1"' }); res.flushHeaders(); interval(() => res.write(run.data.subarray(0, 64)), 35); return;
    }
    complete(200, run.data, { etag: '"model-v1"' }); return;
  }
  if (!match || end >= run.data.length || start > end) { head(416); res.end(); return; }
  if (run.kind === 'first-200') { complete(200, run.data, { etag: '"model-v1"' }); return; }
  if (run.kind === 'all-stall') { stall(); return; }
  if (run.kind === 'trickle') { stall(); interval(() => res.write(run.data.subarray(start, start + 64)), 35); return; }
  if ((run.kind === 'later-200' || run.kind === 'fallback-deadline') && start > 0) { complete(200, run.data, { etag: '"model-v1"' }); return; }
  if (run.kind === '503' && start > 0) {
    if (start === chunkBytes) { later(() => { head(503); res.end(); }, 25); } else stall();
    return;
  }
  if (run.kind === 'disconnect' && start > 0) {
    stall(); if (start === chunkBytes) later(() => res.destroy(), 25); return;
  }
  if (run.kind === 'one-stall' && start === chunkBytes) { stall(); return; }
  const headers = { 'content-range': `bytes ${start}-${end}/${run.data.length}`, etag: '"model-v1"' };
  let body = run.data.subarray(start, end + 1);
  if (run.kind === 'missing-etag') delete headers.etag;
  if (run.kind === 'weak-etag') headers.etag = 'W/"model-v1"';
  if (run.kind === 'changed-etag' && start > 0) headers.etag = '"model-v2"';
  if (run.kind === 'wrong-range') headers['content-range'] = `bytes ${start + 1}-${end + 1}/${run.data.length}`;
  if (run.kind === 'wrong-total') headers['content-range'] = `bytes ${start}-${end}/${run.data.length + 1}`;
  if (run.kind === 'short') body = body.subarray(0, body.length - 1);
  if (run.kind === 'long') body = Buffer.concat([body, Buffer.from([0])]);
  if (run.kind === 'corrupt') { body = Buffer.from(body); body[Math.min(40, body.length - 1)] ^= 1; }
  if (run.kind === 'encoded-range') { headers['content-encoding'] = 'br'; body = brotliCompressSync(body); }
  const delay = run.kind === 'fallback-deadline' && start === 0 ? 180 : 5 + (Math.floor(start / chunkBytes) % 3) * 10;
  complete(206, body, headers, delay);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const results = [];
function setup(kind, model = 'itb') {
  const id = String(++nextId);
  const run = { kind, model, data: models[model], active: 0, maxActive: 0, requests: [] };
  runs.set(id, run);
  return { run, url: base + id, expectedHash: hashes[model] };
}
function transfer(context, signal = new AbortController().signal, progress = () => {}, options = ordinary, expectedHash = context.expectedHash) {
  return downloadModelInRanges(context.url, signal, progress, context.run.data.length, expectedHash, options);
}
async function test(name, fn) {
  const start = performance.now(); const firstRunId = nextId;
  let passed = false, error;
  try { await fn(); passed = true; } catch (caught) { error = caught.stack || String(caught); }
  await wait(25);
  const requests = [...runs.entries()].filter(([id]) => Number(id) > firstRunId).map(([id, run]) => ({ id, route: run.kind, model: run.model, requests: run.requests.length, fullGets: run.requests.filter(r => !r.range).length, maxActive: run.maxActive, remainingActive: run.active, canceled: run.requests.filter(r => r.canceled).length }));
  if (requests.some(r => r.remainingActive)) { passed = false; error = (error || '') + '\nRequests remain active after settlement'; }
  results.push({ name, passed, ms: Math.round(performance.now() - start), ...(error ? { error } : {}), requests });
  console.log(JSON.stringify({ name, passed, ms: results.at(-1).ms, ...(error ? { error: error.split('\n')[0] } : {}) }));
}
const errorCode = code => error => error?.code === code;
try {
  await test('actual hearth GLB: four-worker out-of-order transfer preserves SHA256', async () => {
    const context = setup('normal', 'hearth'); let last = 0;
    const data = await transfer(context, undefined, (received, total) => { assert.ok(received >= last); assert.ok(received <= context.run.data.length); assert.equal(total, context.run.data.length); last = received; });
    assert.equal(hash(data), hashes.hearth); assert.equal(last, context.run.data.length);
    assert.ok(context.run.maxActive <= 4); assert.ok(context.run.maxActive > 1);
    assert.ok(context.run.requests.slice(1).every(r => r.ifRange === '"model-v1"'));
  });
  await test('first 200 is consumed once as a complete response', async () => {
    const context = setup('first-200'); const data = await transfer(context);
    assert.equal(hash(data), hashes.itb); assert.equal(context.run.requests.length, 1);
  });
  for (const kind of ['later-200', 'encoded-range', 'missing-etag', 'weak-etag']) {
    await test(`${kind}: at most one complete GET fallback preserves real GLB`, async () => {
      const context = setup(kind); const data = await transfer(context);
      assert.equal(hash(data), hashes.itb); assert.equal(context.run.requests.filter(r => !r.range).length, 1);
      assert.ok(context.run.maxActive <= 4);
    });
  }
  for (const kind of ['wrong-range', 'wrong-total', 'short', 'long', 'changed-etag', 'corrupt']) {
    await test(`${kind}: invalid segmented data rejects as incomplete`, async () => {
      const context = setup(kind); await assert.rejects(transfer(context), errorCode('incomplete'));
      assert.equal(context.run.requests.filter(r => !r.range).length, 0);
    });
  }
  await test('explicit incorrect expected SHA256 rejects assembled data', async () => {
    const context = setup('normal'); await assert.rejects(transfer(context, undefined, undefined, ordinary, '0'.repeat(64)), errorCode('incomplete'));
  });
  for (const [kind, code] of [['503', 'http'], ['disconnect', 'network']]) {
    await test(`${kind}: a failed worker cancels remaining workers without automatic retry`, async () => {
      const context = setup(kind); await assert.rejects(transfer(context), errorCode(code));
      assert.equal(context.run.requests.filter(r => !r.range).length, 0);
    });
  }
  await test('one stalled worker receives its own idle timeout', async () => {
    const context = setup('one-stall'); await assert.rejects(transfer(context, undefined, undefined, { ...ordinary, idleMs: 140, totalMs: 1000 }), errorCode('idle-timeout'));
  });
  await test('continuously progressing response still respects total deadline', async () => {
    const context = setup('trickle'); await assert.rejects(transfer(context, undefined, undefined, { ...ordinary, idleMs: 150, totalMs: 320 }), errorCode('total-timeout'));
  });
  await test('fallback uses the original total deadline', async () => {
    const context = setup('fallback-deadline'); const start = performance.now();
    await assert.rejects(transfer(context, undefined, undefined, { ...ordinary, idleMs: 240, totalMs: 340 }), errorCode('total-timeout'));
    assert.ok(performance.now() - start < 460, 'Fallback restarted the global deadline');
    assert.equal(context.run.requests.filter(r => !r.range).length, 1);
  });
  await test('already aborted attempt starts no requests', async () => {
    const context = setup('normal'); const controller = new AbortController(); controller.abort();
    await assert.rejects(transfer(context, controller.signal), error => error?.name === 'AbortError');
    assert.equal(context.run.requests.length, 0);
  });
  await test('cancel in flight aborts requests and suppresses late progress', async () => {
    const context = setup('all-stall'); const controller = new AbortController(); let progress = 0;
    const timer = setTimeout(() => controller.abort(), 55);
    try { await assert.rejects(transfer(context, controller.signal, () => progress++), error => error?.name === 'AbortError'); } finally { clearTimeout(timer); }
    const afterCancel = progress; await wait(60); assert.equal(progress, afterCancel);
  });
  await test('cancel then immediate reopen cannot cancel the new attempt', async () => {
    const old = setup('all-stall'); const controller = new AbortController();
    const settledOld = assert.rejects(transfer(old, controller.signal), error => error?.name === 'AbortError');
    await wait(30); controller.abort(); const fresh = setup('normal');
    const data = await transfer(fresh); await settledOld; assert.equal(hash(data), hashes.itb);
  });
  await test('failed transfer can be explicitly retried with real GLB success', async () => {
    const broken = setup('503'); await assert.rejects(transfer(broken), errorCode('http'));
    const healthy = setup('normal'); const data = await transfer(healthy); assert.equal(hash(data), hashes.itb);
  });
} finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
const report = { at: new Date().toISOString(), environment: { type: 'automated software integration test', node: process.version, platform: process.platform, arch: process.arch, network: 'localhost HTTP; no public-network or mobile measurement', data: 'Real repository GLB files; deterministic HTTP faults, not AI response replay', limits: 'Fault timers are shortened deliberately and must not be quoted as production speed', llmCalls: 0, participants: 0 }, models: { itb: { bytes: models.itb.length, sha256: hashes.itb }, hearth: { bytes: models.hearth.length, sha256: hashes.hearth } }, results };
await mkdir(outputDir, { recursive: true });
const text = JSON.stringify(report, null, 2);
try { await access(`${outputDir}/range-tests-first.json`); } catch { await writeFile(`${outputDir}/range-tests-first.json`, text); }
await appendFile(`${outputDir}/range-tests-attempts.jsonl`, JSON.stringify(report) + '\n');
await writeFile(`${outputDir}/range-tests.json`, text);
console.log(JSON.stringify({ passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, report: `${outputDir}/range-tests.json` }));
if (results.some(result => !result.passed)) process.exitCode = 1;
