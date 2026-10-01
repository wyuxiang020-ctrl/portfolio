// Reproducible schematic model; the original GLB is never overwritten.
import { NodeIO, ColorUtils } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, prune, meshopt, getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const folder = 'docs/evaluation/2026-10-01-hearth-lite';
await mkdir(folder, { recursive: true });
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
});
const source = 'public/models/shekua.glb', output = 'public/models/shekua-lite.glb';
const sourceHash = createHash('sha256').update(await readFile(source)).digest('hex');
const doc = await io.read(source);
function metrics(document) {
  const root = document.getRoot();
  const layerInfo = root.getDefaultScene().listChildren().map(layer => {
    let nodes = 0, triangles = 0, instances = 0;
    layer.traverse(node => {
      if (!node.getMesh()) return;
      nodes++;
      const count = node.getExtension('EXT_mesh_gpu_instancing')?.listAttributes()[0].getCount() ?? 1;
      instances += count;
      for (const primitive of node.getMesh().listPrimitives()) {
        triangles += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3 * count;
      }
    });
    return { name: layer.getName(), nodes, instances, triangles };
  });
  return { bytes: 0, materials: root.listMaterials().length, textures: root.listTextures().length,
    meshes: root.listMeshes().length, bounds: getBounds(root.getDefaultScene()), layers: layerInfo };
}
const before = metrics(doc); before.bytes = (await stat(source)).size;
const definitions = [
  ['木色', '#ac8963', 1], ['浅灰', '#b7b3a6', 1], ['深灰', '#575c5b', 1],
  ['植被绿', '#718061', 1], ['半透明', '#a1b7b5', 0.24],
];
const palette = definitions.map(([name, hex, alpha]) => {
  const srgb = hex.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16) / 255);
  return doc.createMaterial(name).setBaseColorFactor([...ColorUtils.convertSRGBToLinear(srgb, [0, 0, 0]), alpha])
    .setRoughnessFactor(0.88).setMetallicFactor(0).setDoubleSided(true)
    .setAlphaMode(alpha < 1 ? 'BLEND' : 'OPAQUE');
});
const mapping = [];
for (const material of doc.getRoot().listMaterials().filter(m => !palette.includes(m))) {
  const name = material.getName();
  // Three tiny cutout textures encode openings, not decorative detail.
  if (material.getAlphaMode() === 'MASK') {
    mapping.push({ source: name, target: name, originalAlpha: 'MASK', reason: 'Preserve original alpha cutout and UVs so fences do not become solid panels' });
    continue;
  }
  let choice = 1, reason = 'neutral fallback';
  if (material.getAlphaMode() !== 'OPAQUE' || material.getBaseColorFactor()[3] < 1) {
    choice = 4; reason = 'transparent surface represented translucently';
  } else if (/wood|timber|bamboo|bark|plywood|木|樱桃|fencing/i.test(name)) {
    choice = 0; reason = 'source material name';
  } else if (/vegetation|grass|groundcover|树|草|叶/i.test(name)) {
    choice = 3; reason = 'source material name';
  } else if (/metal|roof|steel|blacktop|金属|瓦/i.test(name)) {
    choice = 2; reason = 'source material name';
  } else {
    let color = ColorUtils.convertLinearToSRGB(material.getBaseColorFactor().slice(0, 3), [0, 0, 0]);
    const texture = material.getBaseColorTexture();
    if (texture?.getImage()) {
      const stats = await sharp(Buffer.from(texture.getImage())).stats();
      color = stats.channels.slice(0, 3).map(v => v.mean / 255);
    }
    const [r, g, b] = color;
    if (g > r * 1.12 && g > b * 1.08) choice = 3;
    else if (r > b * 1.2 && r > g * 1.04) choice = 0;
    else if ((r + g + b) / 3 < 0.40) choice = 2;
    reason = 'source average color; schematic, not a claim about physical material';
  }
  mapping.push({ source: name, target: definitions[choice][0], originalAlpha: material.getAlphaMode(), reason });
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    if (p.getMaterial() === material) p.setMaterial(palette[choice]);
  }
}
// Preserve UVs on cutout exceptions; other palette surfaces do not need them.
for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
  if (p.getMaterial()?.getAlphaMode() === 'MASK') continue;
  for (const semantic of p.listSemantics()) if (/^(TEXCOORD_|COLOR_|TANGENT)/.test(semantic)) p.setAttribute(semantic, null);
}
await doc.transform(prune({ keepLeaves: true, keepExtras: true }), weld(), dedup(),
  meshopt({ encoder: MeshoptEncoder, level: 'high', quantizePosition: 16 }));
await io.write(output, doc);
const checked = await io.read(output), after = metrics(checked); after.bytes = (await stat(output)).size;
if (after.materials !== 8 || after.textures !== 3) throw new Error('Unexpected palette or texture count');
if (JSON.stringify(before.layers) !== JSON.stringify(after.layers)) throw new Error('Layer geometry counts changed');
if (createHash('sha256').update(await readFile(source)).digest('hex') !== sourceHash) throw new Error('Original changed');
const report = { at: new Date().toISOString(), source, output, sourceHash,
  outputHash: createHash('sha256').update(await readFile(output)).digest('hex'), before, after,
  removedBytes: before.bytes - after.bytes, reductionPercent: (1 - after.bytes / before.bytes) * 100,
  note: 'Five schematic materials plus three original alpha-mask exceptions (8 materials, 3 small textures total). No triangle decimation or node/layer removal. Existing instancing retained. Re-encoded with 16-bit positions. Decorative color/material realism is deliberately reduced, cutout holes preserved. Original file preserved.', mapping };
await writeFile(`${folder}/model.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ before, after, reductionPercent: report.reductionPercent }, null, 2));
