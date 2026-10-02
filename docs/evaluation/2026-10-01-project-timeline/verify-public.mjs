import { writeFile } from 'node:fs/promises';
import { parse } from 'parse5';

const base = 'https://yuxiangworks.com';
const version = 'portfolio-timeline-2026-10-01';
const expected = ['hard-hat-cafe', 'grandmothers-hearth', 'iterative-learning', 'half-diary', 'symsensory', 'continuation', 'gather-living'];
const featured = ['grandmothers-hearth', 'iterative-learning', 'half-diary'];
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const flatten = node => [node, ...(node.childNodes ?? []).flatMap(flatten)];
const readText = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(readText).join('');
const routes = ['/', '/work', '/about', '/work/grandmothers-hearth', '/work/iterative-learning'];

const results = await Promise.all(routes.map(async route => {
  const start = performance.now();
  try {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(45000), headers: { 'Cache-Control': 'no-cache' } });
    const html = await response.text();
    const nodes = flatten(parse(html));
    const body = nodes.find(n => n.tagName === 'body');
    const heading = nodes.find(n => n.tagName === 'h1');
    const checks = {
      http200: response.status === 200,
      correctVersion: attr(body, 'data-site-version') === version,
      chineseName: html.includes('王誉翔'),
      chineseLanguage: attr(nodes.find(n => n.tagName === 'html'), 'lang') === 'zh-CN',
    };
    if (route === '/' || route === '/work') {
      const ids = nodes.filter(n => attr(n, 'data-project-id')).map(n => attr(n, 'data-project-id'));
      checks.allSevenInOrder = JSON.stringify(ids) === JSON.stringify(expected);
    }
    if (route === '/') {
      const featuredHrefs = nodes.filter(n => attr(n, 'class')?.split(/\s+/).includes('project-card')).map(n => attr(n, 'href'));
      checks.correctFeatured = JSON.stringify(featuredHrefs) === JSON.stringify(featured.map(id => '/work/' + id));
      checks.allProjectsAnchor = nodes.some(n => attr(n, 'href') === '#all-projects' && readText(n).includes('查看全部 7 个项目'));
    }
    if (route.includes('grandmothers-hearth') || route.includes('iterative-learning')) {
      checks.bilingualCredits = html.includes('王誉翔 Yuxiang Wang · 刘涵 Han Liu');
    }
    return { route, status: response.status, durationMs: Math.round(performance.now() - start), version: attr(body, 'data-site-version') ?? null, heading: heading ? readText(heading).trim() : null, checks, pass: Object.values(checks).every(Boolean) };
  } catch (error) {
    return { route, durationMs: Math.round(performance.now() - start), error: String(error), pass: false };
  }
}));
const report = { checkedAt: new Date().toISOString(), base, version, method: 'Anonymous public HTTP requests; no browser session or credentials', network: 'Current host route; VPN/proxy state unknown. Not evidence of China mainland direct access.', sampleCount: results.length, results, pass: results.every(r => r.pass) };
await writeFile(new URL('./public-release-check.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;
