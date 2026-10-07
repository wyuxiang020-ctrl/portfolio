import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://yuxiangworks.com', version='spatial-ux-2026-10-01-parallel-load';
const hash=b=>createHash('sha256').update(b).digest('hex');
const out='docs/evaluation/2026-10-01-transfer';
const checks=[];
async function get(path,kind){
  const started=performance.now();
  try{
    const response=await fetch(origin+path,{signal:AbortSignal.timeout(90000)});
    const data=Buffer.from(await response.arrayBuffer());
    const entry={path,status:response.status,ms:Math.round(performance.now()-started),bytes:data.length};
    if(kind==='page'){entry.versionPresent=data.includes(Buffer.from(version));entry.model=data.toString().match(/data-model-url="([^"]+)"/)?.[1];}
    else entry.matchesLocalBuild=hash(data)===hash(await readFile('dist'+path));
    checks.push(entry);
  }catch(error){checks.push({path,error:String(error),ms:Math.round(performance.now()-started)});}
}
await get('/work/grandmothers-hearth/?modelTest=1','page');
await get('/work/iterative-learning/?modelTest=1','page');
for(const file of (await readdir('dist/_astro')).filter(f=>/^(itb-viewer\.|ITBViewer\.)/.test(f))) await get('/_astro/'+file,'script');
const report={at:new Date().toISOString(),version,git:'3831d5a58d10e21239f5d37e2a6c8efd4ddc1319',environment:'Anonymous Node HTTPS GET from current Windows host; no login cookies; VPN/tunnel unknown. Not mainland-direct, physical-device or public browser UI acceptance.',checks};
await writeFile(out+'/public-release-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
process.exitCode=checks.every(x=>x.status===200&&(x.versionPresent===true||x.matchesLocalBuild===true))?0:1;
