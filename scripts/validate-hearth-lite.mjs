// Independent asset checks; does not modify either published model.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, uninstance, getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import { validateBytes, version as validatorVersion } from 'gltf-validator';
import { createHash } from 'node:crypto';
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { Matrix4, Quaternion, Vector3 } from 'three';

const folder = 'docs/evaluation/2026-10-01-hearth-lite';
const sourcePath = 'public/models/shekua.glb';
const candidatePath = 'public/models/shekua-lite.glb';
const started = performance.now();
await mkdir(folder, { recursive: true });
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const sha = data => createHash('sha256').update(data).digest('hex');
const validatorOptions = { maxIssues: 10000, ignoredIssues: ['UNUSED_OBJECT'] };
const report = { at: new Date().toISOString(), type: 'automated asset validation',
  browserVisualTest: false, realDeviceTest: false, validator: validatorVersion(), validatorOptions,
  failures: [], notes: [
    'Geometry comparison ignores triangle/index ordering but preserves winding; coordinates are rounded to 8 decimal places in each mesh local space.',
    'Normal vectors may change slightly on repeated Meshopt octahedral encoding. Maximum accepted angular difference is 0.04 radians.',
    'Instance transforms are compared after composition into world matrices with a 0.00001-unit tolerance. Raw quaternion sign is not a spatial difference (q and -q describe the same rotation).',
    'Decoded validator input has Meshopt decompressed, GPU instances expanded to nodes and quantized attributes converted to float32; this temporary representation is held in memory and not published.',
  ] };
const check = (condition, message) => { if (!condition) report.failures.push(message); };
function nodes(doc) { const out = []; doc.getRoot().getDefaultScene().traverse(n => out.push(n)); return out; }
function maxArrayDifference(a, b) {
  if (a.length !== b.length) return Infinity;
  let max = 0; for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i])); return max;
}
function instanceWorldMatrix(node, extension, index) {
  const translation = extension.getAttribute('TRANSLATION')?.getElement(index, []) || [0, 0, 0];
  const rotation = extension.getAttribute('ROTATION')?.getElement(index, []) || [0, 0, 0, 1];
  const scale = extension.getAttribute('SCALE')?.getElement(index, []) || [1, 1, 1];
  return new Matrix4().fromArray(node.getWorldMatrix()).multiply(new Matrix4().compose(
    new Vector3(...translation), new Quaternion(...rotation), new Vector3(...scale))).elements;
}
function corners(primitive, extraSemantic) {
  const positions = primitive.getAttribute('POSITION');
  const normals = primitive.getAttribute('NORMAL');
  const indices = primitive.getIndices();
  const pointKeys = [], normalMap = new Map(), element = [];
  const extra = extraSemantic && primitive.getAttribute(extraSemantic);
  for (let i = 0; i < positions.getCount(); i++) {
    positions.getElement(i, element);
    const key = element.map(x => x.toFixed(8)).join(',');
    pointKeys.push(key + (extra ? `;${extra.getElement(i, []).map(x => x.toFixed(8)).join(',')}` : ''));
    if (normals) {
      normals.getElement(i, element); const normal = [...element];
      const list = normalMap.get(key) || []; list.push(normal); normalMap.set(key, list);
    }
  }
  const triangles = [];
  const count = indices?.getCount() ?? positions.getCount();
  for (let i = 0; i < count; i += 3) {
    const vertex = [0, 1, 2].map(j => pointKeys[indices ? indices.getScalar(i + j) : i + j]);
    // Cyclic rotation is harmless; reversed winding is not treated as equal.
    triangles.push([vertex.join('|'), [vertex[1], vertex[2], vertex[0]].join('|'),
      [vertex[2], vertex[0], vertex[1]].join('|')].sort()[0]);
  }
  return { hash: sha(triangles.sort().join('\n')), triangles: triangles.length, normalMap };
}
function normalDifference(before, after) {
  let max = 0, unmatched = 0;
  for (const [key, normals] of before) {
    const candidates = after.get(key);
    if (!candidates) { unmatched += normals.length; continue; }
    for (const v of normals) {
      let min = Math.PI;
      for (const w of candidates) {
        const dot = (v[0] * w[0] + v[1] * w[1] + v[2] * w[2]) /
          (Math.hypot(...v) * Math.hypot(...w));
        min = Math.min(min, Math.acos(Math.max(-1, Math.min(1, dot))));
      }
      max = Math.max(max, min);
    }
  }
  return { max, unmatched };
}
function summarize(result) {
  return { errors: result.issues.numErrors, warnings: result.issues.numWarnings,
    infos: result.issues.numInfos, hints: result.issues.numHints,
    messages: result.issues.messages, truncated: result.issues.truncated };
}
try {
  const [sourceBytes, candidateBytes] = await Promise.all([readFile(sourcePath), readFile(candidatePath)]);
  report.source = { path: sourcePath, bytes: sourceBytes.length, sha256: sha(sourceBytes) };
  report.candidate = { path: candidatePath, bytes: candidateBytes.length, sha256: sha(candidateBytes) };
  check(report.source.sha256 === '21ab5b2a859f61ad308ec7df9f40c971fa47f3ca23aec36e4536415d0425b74a', 'Original source file changed');
  report.compressed = {
    source: summarize(await validateBytes(sourceBytes, { uri: sourcePath, ...validatorOptions })),
    candidate: summarize(await validateBytes(candidateBytes, { uri: candidatePath, ...validatorOptions })),
  };
  for (const [name, result] of Object.entries(report.compressed)) {
    check(!result.truncated, `Compressed ${name} validator diagnostics are truncated`);
    check(result.errors === 0, `Compressed ${name} has glTF validation errors`);
  }
  const decodeStarted = performance.now();
  const source = await io.readBinary(sourceBytes), candidate = await io.readBinary(candidateBytes);
  report.decodeBothMs = Math.round(performance.now() - decodeStarted);
  const sn = nodes(source), cn = nodes(candidate);
  check(sn.length === cn.length, 'Scene node counts changed');
  const pairs = new Map();
  const geometry = report.geometry = { nodesCompared: sn.length, primitivePairsCompared: 0,
    distinctPrimitivePairsCompared: 0, triangleReferencesCompared: 0, maxNodeMatrixDifference: 0,
    maxInstanceValueDifference: 0, maxInstanceWorldMatrixDifference: 0, instancesCompared: 0, maxNormalAngleRadians: 0,
    unmatchedNormalVertices: 0, positionAndWindingMismatches: [], cutoutPrimitivesCompared: 0, layers: [] };
  for (let i = 0; i < Math.min(sn.length, cn.length); i++) {
    const a = sn[i], b = cn[i];
    check(a.getName() === b.getName(), `Node name changed at ${i}`);
    check(JSON.stringify(a.getExtras()) === JSON.stringify(b.getExtras()), `Node extras changed at ${i}`);
    check(a.listChildren().length === b.listChildren().length, `Node children changed at ${i}`);
    geometry.maxNodeMatrixDifference = Math.max(geometry.maxNodeMatrixDifference,
      maxArrayDifference(a.getMatrix(), b.getMatrix()));
    const ai = a.getExtension('EXT_mesh_gpu_instancing'), bi = b.getExtension('EXT_mesh_gpu_instancing');
    check(Boolean(ai) === Boolean(bi), `Instancing changed at ${i}`);
    if (ai && bi) {
      check(JSON.stringify(ai.listSemantics()) === JSON.stringify(bi.listSemantics()), `Instance semantics changed at ${i}`);
      geometry.instancesCompared += ai.listAttributes()[0].getCount();
      for (let instance = 0; instance < ai.listAttributes()[0].getCount(); instance++) {
        geometry.maxInstanceWorldMatrixDifference = Math.max(geometry.maxInstanceWorldMatrixDifference,
          maxArrayDifference(instanceWorldMatrix(a, ai, instance), instanceWorldMatrix(b, bi, instance)));
      }
      for (const semantic of ai.listSemantics()) {
        geometry.maxInstanceValueDifference = Math.max(geometry.maxInstanceValueDifference,
          maxArrayDifference(ai.getAttribute(semantic).getArray(), bi.getAttribute(semantic).getArray()));
      }
    }
    const ap = a.getMesh()?.listPrimitives() || [], bp = b.getMesh()?.listPrimitives() || [];
    check(ap.length === bp.length, `Primitive count changed at node ${i}`);
    for (let j = 0; j < Math.min(ap.length, bp.length); j++) {
      geometry.primitivePairsCompared++;
      let cache = pairs.get(ap[j]); if (!cache) { cache = new Map(); pairs.set(ap[j], cache); }
      if (cache.has(bp[j])) continue;
      const left = corners(ap[j]), right = corners(bp[j]);
      geometry.distinctPrimitivePairsCompared++;
      geometry.triangleReferencesCompared += left.triangles;
      if (left.hash !== right.hash) geometry.positionAndWindingMismatches.push({ node: i, primitive: j,
        sourceTriangles: left.triangles, candidateTriangles: right.triangles });
      const normals = normalDifference(left.normalMap, right.normalMap);
      geometry.maxNormalAngleRadians = Math.max(geometry.maxNormalAngleRadians, normals.max);
      geometry.unmatchedNormalVertices += normals.unmatched;
      if (ap[j].getMaterial()?.getAlphaMode() === 'MASK') {
        geometry.cutoutPrimitivesCompared++;
        const uv = `TEXCOORD_${ap[j].getMaterial().getBaseColorTextureInfo().getTexCoord()}`;
        check(Boolean(bp[j].getAttribute(uv)) && corners(ap[j], uv).hash === corners(bp[j], uv).hash,
          `Cutout UV coordinates changed: node ${i}, primitive ${j}`);
      }
      cache.set(bp[j], true);
    }
  }
  geometry.layers = source.getRoot().getDefaultScene().listChildren().map(n => n.getName());
  check(geometry.maxNodeMatrixDifference < 1e-10, 'Node transforms changed');
  check(geometry.maxInstanceWorldMatrixDifference < 1e-5, 'Instance world transforms changed beyond floating-point tolerance');
  check(geometry.positionAndWindingMismatches.length === 0, 'Triangle positions or winding changed');
  check(geometry.unmatchedNormalVertices === 0, 'Normal matching lost vertices');
  check(geometry.maxNormalAngleRadians <= 0.04, 'Normals changed beyond repeat-encoding tolerance');
  report.palette = { materials: candidate.getRoot().listMaterials().length, textures: candidate.getRoot().listTextures().length,
    cutoutMaterials: candidate.getRoot().listMaterials().filter(m => m.getAlphaMode() === 'MASK').map(m => ({ name: m.getName(),
      cutoff: m.getAlphaCutoff(), textureSHA256: sha(m.getBaseColorTexture().getImage()) })) };
  check(report.palette.materials === 8 && report.palette.textures === 3, 'Expected five base materials and three preserved cutout exceptions');
  for (const material of source.getRoot().listMaterials().filter(m => m.getAlphaMode() === 'MASK')) {
    const hash = sha(material.getBaseColorTexture().getImage());
    check(report.palette.cutoutMaterials.some(m => m.textureSHA256 === hash && m.cutoff === material.getAlphaCutoff()),
      `Cutout texture or threshold changed: ${material.getName()}`);
    const twin = candidate.getRoot().listMaterials().find(m => m.getAlphaMode() === 'MASK' && sha(m.getBaseColorTexture().getImage()) === hash);
    if (twin) {
      const properties = m => {
        const info = m.getBaseColorTextureInfo();
        return { color: m.getBaseColorFactor(), doubleSided: m.getDoubleSided(), cutoff: m.getAlphaCutoff(),
          texCoord: info.getTexCoord(), wrapS: info.getWrapS(), wrapT: info.getWrapT(),
          minFilter: info.getMinFilter(), magFilter: info.getMagFilter() };
      };
      check(JSON.stringify(properties(material)) === JSON.stringify(properties(twin)), `Cutout material settings changed: ${material.getName()}`);
    }
  }
  const expanded = {};
  for (const [name, doc] of [['source', source], ['candidate', candidate]]) {
    for (const extension of doc.getRoot().listExtensionsUsed()) if (extension.extensionName === 'EXT_meshopt_compression') extension.dispose();
    await doc.transform(uninstance(), dequantize());
    const bytes = await io.writeBinary(doc);
    expanded[name] = { nodes: doc.getRoot().listNodes().length, bounds: getBounds(doc.getRoot().getDefaultScene()),
      bytes: bytes.byteLength, validation: summarize(await validateBytes(bytes, { uri: `${name}-decoded.glb`, ...validatorOptions })) };
    check(!expanded[name].validation.truncated, `Decoded ${name} validator diagnostics are truncated`);
  }
  report.decoded = expanded;
  check(expanded.candidate.validation.errors === 0, 'Decoded candidate has glTF validation errors');
  const boundsDelta = maxArrayDifference([...expanded.source.bounds.min, ...expanded.source.bounds.max],
    [...expanded.candidate.bounds.min, ...expanded.candidate.bounds.max]);
  report.expandedBoundsMaxDifference = boundsDelta;
  check(boundsDelta < 1e-6, 'Instance-expanded bounds changed');
} catch (error) {
  report.failures.push(`${error.name}: ${error.message}`);
}
report.elapsedMs = Math.round(performance.now() - started);
report.passed = report.failures.length === 0;
const json = JSON.stringify(report, null, 2);
try { await writeFile(`${folder}/validation-first.json`, json, { flag: 'wx' }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
await writeFile(`${folder}/validation.json`, json);
await appendFile(`${folder}/validation-attempts.jsonl`, `${JSON.stringify({ at: report.at, passed: report.passed, elapsedMs: report.elapsedMs,
  candidate: report.candidate, failures: report.failures })}\n`);
console.log(JSON.stringify({ passed: report.passed, elapsedMs: report.elapsedMs, failures: report.failures,
  geometry: report.geometry, compressed: report.compressed && {
    sourceErrors: report.compressed.source.errors, candidateErrors: report.compressed.candidate.errors },
  decoded: report.decoded && { sourceErrors: report.decoded.source.validation.errors, candidateErrors: report.decoded.candidate.validation.errors } }, null, 2));
if (!report.passed) process.exitCode = 1;
