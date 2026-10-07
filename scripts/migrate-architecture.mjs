import { readFile, writeFile, mkdir, copyFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Explicit source allow-list. Never copies credentials, repositories, dependencies or old builds.
const source = 'E:/cd portfolio';
const target = process.cwd();
if (!target.replaceAll('\\', '/').endsWith('/unified-portfolio')) throw new Error('Run from unified-portfolio');
let alreadyImported = false;
try { await access(path.join(target, 'data/architecture-assets.json')); alreadyImported = true; } catch {}
if (alreadyImported) throw new Error('Architecture already imported. This one-time migration script will not overwrite reviewed content or viewer fixes.');
const assets = new Map();
const sources = [];
const manifest = JSON.parse(await readFile(path.join(source, '.generated/images.json'), 'utf8'));
const imageManifest = {};
const hash = value => createHash('sha256').update(value).digest('hex');
async function copy(relative, destination = relative) {
  const existing = sources.find(item => item.destination === destination);
  if (existing) return existing;
  const input = path.join(source, relative), output = path.join(target, destination);
  await mkdir(path.dirname(output), { recursive: true });
  await copyFile(input, output);
  const bytes = await readFile(input);
  const item = { source: input.replaceAll('\\', '/'), destination: destination.replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) };
  sources.push(item);
  return item;
}
function slug(text) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); }
const files = (await readdir(path.join(source, 'src/content/projects'))).filter(file => file.endsWith('.mdx'));
for (const file of files) {
  const relative = 'src/content/projects/' + file;
  const input = await readFile(path.join(source, relative), 'utf8');
  let content = input.replaceAll('\r\n', '\n');
  // Chinese is the reading hierarchy; stable original English anchors remain available.
  content = content.replace(/^## (.+)\n<span class="h-sub">([^<]+)<\/span>/gm, (_, english, chinese) => `<h2 id="${slug(english)}">${chinese}</h2>\n<span class="h-sub">${english}</span>`);
  // Preserve drawing names as accessible descriptions where the earlier page used an empty alt.
  content = content.replace(/<OptimizedImage src="([^"]+)" alt="" \/>(\s*<p class="caption">([^<]+)<\/p>)?/g, (_, src, caption = '', text = '') => {
    const alt = text ? text.split(' · ')[0].split(' — ')[0].replaceAll('"', '“') : `${file.replace('.mdx', '')} 项目图纸与设计表达`;
    return `<OptimizedImage src="${src}" alt="${alt}" />${caption}`;
  });
  if (file === 'continuation.mdx') {
    content = content.replace('场地周边使用人群结构多元：', '原设计分析图将场地周边使用人群划分为四类：');
    content = content.replace('四类人群在活动时段', '> 资料边界：以上 60% / 15% / 15% / 10% 来自原课程设计分析图，现有资料未提供样本量、抽样方法或统计时间，仅保留为设计阶段的人群构成假设，不代表实测人口分布。\n\n四类人群在活动时段');
  }
  if (file === 'half-diary.mdx') {
    content = content.replace('采访群体年龄大部分', '> 资料边界：原项目包含问卷与访谈图表，但当前归档未列出有效样本数、问卷原始记录和调查日期。以下比例仅转述原图，不作为可复核的统计结论。\n\n采访群体年龄大部分');
  }
  if (file === 'hard-hat-cafe.mdx') {
    content = content.replace('这里的人口结构出乎我们意料：超过 52% 的居民具有南亚裔背景，比例之高在英格兰北部并不多见。这一数字不只是统计数据——它渗透在街道上每一块手写的店招、每一扇开着的橱窗里，以及城镇独特的气味中。', '原项目人口分析图标注南亚裔居民占比超过 52%；当前归档未附统计年份、地理边界与原始人口数据，因而将其作为待核对的背景材料。场地观察也记录了店招、橱窗与不同文化的日常生活线索，用于帮助团队理解社区。');
    content = content.replace('Nelson 的南亚裔人口占比超过 52%，是英格兰北部比例最高的城镇之一。', '原项目人口分析图；其中 52% 的统计口径与来源仍待补充，不视为本次验证结果。');
    content = content.replace('<h2 id="after-completion">落地呈现</h2>\n<span class="h-sub">After Completion</span>', '<h2 id="after-completion">方案中的社区场景</h2>\n<span class="h-sub">Proposed community use</span>');
    content = content.replace('真正重要的画面，是最后这一张：一群各有来历的人围坐在一个胶合板咖啡馆旁，在一个既不再是过去、也还不是未来的城镇中心里，吃东西，聊天，坐着。', '最后的提案渲染图呈现设计希望支持的日常：居民围坐在胶合板咖啡馆旁，吃东西、聊天、停留。这是方案效果表达；现有材料不能据此确认建筑已经落成或发生了真实运营。');
  }
  const output = path.join(target, 'src/content/architecture', file);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, content);
  sources.push({ source: path.join(source, relative).replaceAll('\\', '/'), destination: 'src/content/architecture/' + file, bytes: Buffer.byteLength(input), sha256: hash(input), migratedSha256: hash(content), transformed: true });
  for (const match of input.matchAll(/\/(?:images|models)\/[\w./-]+\.(?:jpg|jpeg|png|webp|glb)/g)) {
    if (!assets.has(match[0])) assets.set(match[0], new Set());
    assets.get(match[0]).add(file.replace('.mdx', ''));
  }
}
// Default prop in ITBViewer is an explicit runtime dependency.
assets.set('/models/itb.glb', new Set(['iterative-learning']));
for (const [url, references] of assets) {
  const item = await copy('public' + url);
  item.referencedBy = [...references];
  if (url.startsWith('/images/')) {
    const entry = manifest[url];
    if (!entry) throw new Error('Missing image metadata: ' + url);
    // Keep only responsive derivatives used by our component, with original full resolution for zoom.
    const variants = entry.variants.filter(v => v.width <= 1600);
    if (!variants.length) variants.push(entry.variants[0]);
    imageManifest[url] = { ...entry, variants };
    item.width = entry.width; item.height = entry.height;
    for (const variant of variants) {
      const variantItem = await copy('public' + variant.src);
      variantItem.derivedFrom = [...new Set([...(variantItem.derivedFrom || []), url])];variantItem.width = variant.width;variantItem.referencedBy = [...new Set([...(variantItem.referencedBy || []), ...references])];
    }
  }
}
for (const relative of ['src/components/ui/ITBViewer.astro', 'src/scripts/itb-viewer.ts', 'src/scripts/model-download.ts', 'src/scripts/model-range-download.ts', 'src/scripts/model-preparation.ts']) await copy(relative);
await mkdir(path.join(target, 'src/data'), { recursive: true });
await writeFile(path.join(target, 'src/data/architecture-images.json'), JSON.stringify(imageManifest, null, 2) + '\n');
const report = { checkedDate: '2026-10-07', sourceRoot: source, sourceCommit: 'bcf1ebe3375034f7b991c3aa519989e2e6d18bb3', sourcePolicy: 'Copied from current local working directory, not reconstructed from Git. No source modifications.', contentItems: files.length, originalImages: Object.keys(imageManifest).length, files: sources, publicBytes: sources.filter(item => item.destination.startsWith('public/')).reduce((sum, item) => sum + item.bytes, 0) };
await writeFile(path.join(target, 'data/architecture-assets.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ contentItems: report.contentItems, originalImages: report.originalImages, copiedFiles: sources.length, publicMiB: (report.publicBytes / 1048576).toFixed(2) }, null, 2));
