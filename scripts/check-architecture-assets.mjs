import { readFile, stat, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const manifest = JSON.parse(await readFile('data/architecture-assets.json', 'utf8'));
const images = JSON.parse(await readFile('src/data/architecture-images.json', 'utf8'));
const failures = [], checks = [];
let bytes = 0;
for (const asset of manifest.files.filter(item => item.destination.startsWith('public/'))) {
  try {
    const content = await readFile(asset.destination);
    if (content.length !== asset.bytes || createHash('sha256').update(content).digest('hex') !== asset.sha256) throw new Error('Does not match original source identity');
    bytes += content.length;
    if (asset.destination.endsWith('.glb')) {
      if (content.readUInt32LE(0) !== 0x46546c67 || content.readUInt32LE(4) !== 2 || content.readUInt32LE(8) !== content.length) throw new Error('Invalid GLB header');
      const jsonLength = content.readUInt32LE(12);
      const gltf = JSON.parse(content.subarray(20,20 + jsonLength).toString('utf8'));
      const external = [...(gltf.buffers || []), ...(gltf.images || [])].filter(entry => entry.uri && !entry.uri.startsWith('data:'));
      if (external.length) throw new Error('Unexpected unresolved external model resources: ' + external.map(entry=>entry.uri).join(', '));
    }
  } catch (error) { failures.push({ file: asset.destination, error: String(error) }); }
}
const contentFiles = (await readdir('src/content/architecture')).filter(file=>file.endsWith('.mdx'));
let imageReferences=0, captions=0;
for (const file of contentFiles) {
  const content = await readFile(path.join('src/content/architecture',file),'utf8');
  const ids = [...content.matchAll(/<h2 id="([^"]+)"/g)].map(m=>m[1]);
  for (const anchor of content.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(anchor[1])) failures.push({file,error:'Unresolved section anchor: '+anchor[1]});
  for (const image of content.matchAll(/<OptimizedImage src="([^"]+)" alt="([^"]*)"/g)) {
    imageReferences++;
    if(!images[image[1]]) failures.push({file,error:'No responsive image: '+image[1]});
    if(!image[2]) failures.push({file,error:'Empty image alternative: '+image[1]});
  }
  captions += [...content.matchAll(/class="caption"/g)].length;
}
checks.push({name:'Source public asset identity and local presence',checked:manifest.uniquePublicFiles||manifest.files.filter(a=>a.destination.startsWith('public/')).length,passed:failures.length===0});
checks.push({name:'Architecture collection contains required seven projects',checked:contentFiles.length,passed:contentFiles.length===7});
if(contentFiles.length!==7)failures.push({error:'Expected seven project files'});
const report={checkedAt:new Date().toISOString(),scope:'Local asset byte integrity, GLB self-containment, responsive references, image alternatives and explicit chapter anchors. Not browser or online acceptance.',publicBytes:bytes,publicMiB:bytes/1048576,contentFiles:contentFiles.length,imageReferences,captions,checks,failures};
await mkdir('docs/verification',{recursive:true});
await writeFile('docs/verification/architecture-assets.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
