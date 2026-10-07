// Export the central, literal TypeScript data for the PDF generator.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/data/profile.ts', import.meta.url), 'utf8')
  .replaceAll('export const ', 'const ').replaceAll(' as const', '');
const data = vm.runInNewContext(source + '\n({ profile, resumeProjects })');
mkdirSync(new URL('../tmp/pdfs/', import.meta.url), { recursive: true });
writeFileSync(new URL('../tmp/pdfs/profile.json', import.meta.url), JSON.stringify(data, null, 2));
console.log('Exported profile and complete resume projects.');
