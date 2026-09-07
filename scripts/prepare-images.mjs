import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Keep originals for the lightbox. Only derived display assets are generated here.
export async function prepareImages(root) {
  const source = path.join(root, 'public/images');
  const output = path.join(root, 'public/optimized');
  const manifestPath = path.join(root, '.generated/images.json');
  await mkdir(output, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  async function walk(dir) {
    return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
  }
  const manifest = {};
  for (const file of (await walk(source)).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
    const bytes = await readFile(file);
    const hash = createHash('sha256').update(bytes).update('webp-q84-v1').digest('hex').slice(0, 16);
    const meta = await sharp(bytes).metadata();
    const rotated = (meta.orientation ?? 1) >= 5;
    const width = rotated ? meta.height : meta.width;
    const height = rotated ? meta.width : meta.height;
    if (!width || !height) throw new Error(`Missing image dimensions: ${file}`);
    const widths = [...new Set([480, 960, 1600].map(w => Math.min(w, width)))];
    const variants = [];
    for (const w of widths) {
      const name = `${hash}-${w}.webp`;
      const destination = path.join(output, name);
      try { await stat(destination); }
      catch { await sharp(bytes).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toFile(destination); }
      variants.push({ width: w, src: `/optimized/${name}` });
    }
    const url = '/images/' + path.relative(source, file).replaceAll('\\', '/');
    manifest[url] = { width, height, variants };
  }
  const json = JSON.stringify(manifest, null, 2) + '\n';
  const previous = await readFile(manifestPath, 'utf8').catch(() => '');
  if (json !== previous) await writeFile(manifestPath, json);
  console.log(`[images] Prepared ${Object.keys(manifest).length} originals (cached WebP variants).`);
}
