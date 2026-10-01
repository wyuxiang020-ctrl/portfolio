// Real public transfer samples, sequential to avoid competing with each other.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const folder = 'docs/evaluation/2026-10-01-transfer';
const reportName = process.env.MODEL_TRANSFER_REPORT || 'transfer-comparison';
await mkdir(folder, { recursive: true });
const bundle = await build({ entryPoints: ['src/scripts/model-range-download.ts'], bundle: true, write: false, format: 'esm', platform: 'browser' });
const { downloadModelInRanges } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const source = await readFile('public/models/shekua-lite.glb');
const hash = createHash('sha256').update(source).digest('hex');
const originalFetch = globalThis.fetch;
const report = { at: new Date().toISOString(), conditions: 'Sequential anonymous public Node fetch samples on same host. VPN/tunnel unknown. No network emulation; uncontrolled live network. Full request advertises br,gzip like a modern HTTPS browser. Not user efficiency or physical mobile testing.', samples: [] };
const modes = process.argv.slice(2).length ? process.argv.slice(2) : ['full', 'ranges', 'full'];
for (const mode of modes) {
  const sample = { mode, requests: [], progress: [] }; report.samples.push(sample);
  const started = performance.now(); let lastProgress = 0;
  globalThis.fetch = async (url, options) => {
    const request = { range: new Headers(options?.headers).get('range'), startMs: Math.round(performance.now()-started) };
    sample.requests.push(request);
    const response = await originalFetch(url, options);
    Object.assign(request, { status: response.status, headerMs: Math.round(performance.now()-started), encoding: response.headers.get('content-encoding'), length: response.headers.get('content-length'), etag: response.headers.get('etag'), cache: response.headers.get('x-vercel-cache') });
    return response;
  };
  try {
    let buffer;
    if (mode === 'ranges') buffer = await downloadModelInRanges('https://yuxiangworks.com/models/shekua-lite.glb', new AbortController().signal, received => {
      if (performance.now()-lastProgress > 10000) { sample.progress.push({ ms: Math.round(performance.now()-started), received }); lastProgress=performance.now(); }
    }, source.length, hash);
    else {
      const response = await fetch('https://yuxiangworks.com/models/shekua-lite.glb', { headers: { 'Accept-Encoding': 'br,gzip' }, signal: AbortSignal.timeout(180000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      buffer = await response.arrayBuffer();
    }
    Object.assign(sample, { result: 'complete', ms: Math.round(performance.now()-started), decodedBytes: buffer.byteLength, hashMatches: createHash('sha256').update(Buffer.from(buffer)).digest('hex') === hash });
  } catch (error) { Object.assign(sample, { result: 'failed', ms: Math.round(performance.now()-started), error: String(error) }); }
  finally { globalThis.fetch = originalFetch; }
  console.log(JSON.stringify(sample));
  await writeFile(`${folder}/${reportName}.json`, JSON.stringify(report,null,2));
}
