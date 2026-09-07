import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';

const root = path.resolve('dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
function nodes(node, tag) {
  return [...(node.tagName === tag ? [node] : []), ...(node.childNodes ?? []).flatMap(n => nodes(n, tag))];
}
const pages = [];
const missing = [];
for (const file of (await walk(root)).filter(f => f.endsWith('.html'))) {
  const dom = parse(await readFile(file, 'utf8'));
  const route = '/' + path.relative(root, file).replaceAll('\\', '/').replace(/index.html$/, '');
  const imgs = nodes(dom, 'img').map(n => Object.fromEntries(n.attrs.map(a => [a.name, a.value])));
  const assets = new Set(imgs.map(i => i.src).filter(s => s?.startsWith('/') && !s.startsWith('//')));
  let bytes = 0;
  for (const url of assets) {
    try { bytes += (await stat(path.join(root, decodeURIComponent(url.split('?')[0])))).size; }
    catch { missing.push({ route, url }); }
  }
  for (const img of imgs) {
    const original = img['data-full-src'];
    if (original?.startsWith('/images/')) {
      try { await stat(path.join(root, decodeURIComponent(original))); }
      catch { missing.push({ route, url: original, usage: 'lightbox' }); }
    }
    for (const candidate of (img.srcset ?? '').split(',').filter(Boolean)) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/')) {
        try { await stat(path.join(root, decodeURIComponent(url))); }
        catch { missing.push({ route, url }); }
      }
    }
  }
  pages.push({ route, images: imgs.length, lazy: imgs.filter(i => i.loading === 'lazy').length,
    dimensioned: imgs.filter(i => +i.width > 0 && +i.height > 0).length,
    responsive: imgs.filter(i => i.srcset).length, localDefaultSrcBytes: bytes,
    externalImages: imgs.filter(i => /^https?:/.test(i.src)).length });
}
const result = { recordedAt: new Date().toISOString(),
  method: 'Unique local HTML img src file sizes per page; not browser transfer, srcset selection, or loading duration. Original lightbox files excluded unless used by img src.',
  pages, missing };
const output = process.argv[2];
if (output) { await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, JSON.stringify(result, null, 2) + '\n'); }
console.log(JSON.stringify(result, null, 2));
if (missing.length && process.argv.includes('--strict')) process.exitCode = 1;
