import sharp from 'sharp';
import { stat, writeFile } from 'node:fs/promises';

// Display derivatives only. Gallery data-full-src continues to reference the original.
const jobs = [
  ['spatial-home.png', 'spatial-home-thumb.webp', 900],
  ['spatial-selected.png', 'spatial-selected-thumb.webp', 1200],
  ['gym-plan-hd.png', 'gym-plan-thumb.webp', 450],
  ['meal-01-chicken-rice-broccoli.png', 'meal-01-chicken-rice-broccoli-thumb.webp', 640],
  ['meal-02-oatmeal-fruit-walnuts.png', 'meal-02-oatmeal-fruit-walnuts-thumb.webp', 640],
  ['meal-03-noodles-egg-bokchoy.png', 'meal-03-noodles-egg-bokchoy-thumb.webp', 640],
  ['meal-04-yogurt-strawberry-granola.png', 'meal-04-yogurt-strawberry-granola-thumb.webp', 640],
];
const manifest = [];
for (const [source, output, width] of jobs) {
  const sourcePath = `public/media/${source}`;
  const outputPath = `public/media/${output}`;
  await sharp(sourcePath).resize({ width, withoutEnlargement: true }).webp({ quality: 85 }).toFile(outputPath);
  const original = await stat(sourcePath);
  const derivative = await stat(outputPath);
  manifest.push({ source: `/media/${source}`, output: `/media/${output}`, width, originalBytes: original.size, outputBytes: derivative.size });
}
await writeFile('data/ai-image-derivatives.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
