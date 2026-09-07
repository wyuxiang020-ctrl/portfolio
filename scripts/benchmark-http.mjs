import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
const origin = process.env.BENCHMARK_ORIGIN || 'http://127.0.0.1:4322';
function images(n) { return [...(n.tagName === 'img' ? [Object.fromEntries(n.attrs.map(a => [a.name, a.value]))] : []), ...(n.childNodes ?? []).flatMap(images)]; }
const runs = [];
for (const route of ['/', '/work/', '/work/half-diary/']) {
  for (let iteration = 1; iteration <= 5; iteration++) {
    const start = performance.now();
    const response = await fetch(new URL(route, origin));
    const html = await response.text();
    const htmlMs = performance.now() - start;
    const urls = [...new Set(images(parse(html)).filter(i => i.loading !== 'lazy' && i.src?.startsWith('/') && !i.src.startsWith('//')).map(i => i.src))];
    let bytes = Buffer.byteLength(html), failures = [];
    for (let i = 0; i < urls.length; i += 6) {
      await Promise.all(urls.slice(i, i + 6).map(async url => {
        const r = await fetch(new URL(url, origin));
        const body = await r.arrayBuffer();
        bytes += body.byteLength;
        if (!r.ok) failures.push({ url, status: r.status });
      }));
    }
    runs.push({ route, iteration, status: response.status, htmlMs: +htmlMs.toFixed(2),
      htmlAndEagerLocalImagesMs: +(performance.now() - start).toFixed(2), bytes, images: urls.length, failures });
  }
}
const result = { recordedAt: new Date().toISOString(), origin, node: process.version,
  method: 'Synthetic local HTTP baseline, 5 sequential runs per route; HTML plus eager local img src, up to 6 concurrent requests. No client cache, OS cache uncontrolled. Excludes lazy images, external images, CSS, JS, decoding and rendering. Not browser LCP or real-user loading time.', runs };
const output = process.argv[2];
if (output) { await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, JSON.stringify(result, null, 2) + '\n'); }
console.log(JSON.stringify(result, null, 2));
