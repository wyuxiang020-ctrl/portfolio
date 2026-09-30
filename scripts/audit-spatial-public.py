"""Anonymous GET audit. Does not certify VPN-off or mainland connectivity."""
import concurrent.futures, hashlib, json, pathlib, subprocess, tempfile, time
from html.parser import HTMLParser
from urllib.parse import urljoin
ROOT = pathlib.Path(__file__).resolve().parents[1]
ORIGIN = 'https://yuxiangworks.com'
class Assets(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        candidates = []
        if tag in ('img', 'script', 'source'): candidates.append(a.get('src', ''))
        if tag in ('img', 'source'):
            candidates.extend(s.strip().split(' ')[0] for s in a.get('srcset', '').split(','))
        if tag == 'link' and a.get('rel') == 'stylesheet': candidates.append(a.get('href', ''))
        self.urls.update(urljoin(ORIGIN, u) for u in candidates if u and not u.startswith('data:'))
def check(url):
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)/'body'
        start = time.perf_counter()
        r = subprocess.run(['curl.exe','--noproxy','*','-L','-sS','--max-time','60','-o',str(out),'-w','%{http_code}',url],capture_output=True,text=True)
        body = out.read_bytes() if out.exists() else b''
        result = dict(url=url,status=r.stdout,bytes=len(body),seconds=round(time.perf_counter()-start,3),curlExit=r.returncode)
        if r.returncode: result['error'] = r.stderr.strip()
        if '/models/' in url:
            local = ROOT/'public/models'/url.rsplit('/',1)[1]
            result['sha256MatchesLocal'] = local.exists() and hashlib.sha256(body).digest() == hashlib.sha256(local.read_bytes()).digest()
        if '/work/' in url and body.startswith(b'<!DOCTYPE'):
            result['hasViewer'] = b'data-model-url=' in body
            result['hasCancel'] = b'data-cancel' in body
        return result, body
if __name__ == '__main__':
    import sys
    label = sys.argv[1] if len(sys.argv)>1 else 'before'
    pages = ['/', '/work/', '/about/', '/contact/'] + ['/work/'+p.parent.name+'/' for p in (ROOT/'dist/work').glob('*/index.html')]
    results=[]; assets=set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for result, body in pool.map(check,[ORIGIN+p for p in pages]):
            results.append(result);parser=Assets();parser.feed(body.decode('utf-8',errors='replace'));assets.update(parser.urls)
        for result, body in pool.map(check,sorted(assets)):
            results.append(result)
        for result, body in pool.map(check,[ORIGIN+'/models/itb.glb',ORIGIN+'/models/shekua.glb','https://www.yuxiangworks.com/']): results.append(result)
    report=dict(at=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),environment='Anonymous curl GET, no cookies, explicit proxy bypass. Windows ProxyEnable=0 observed; VPN/tunnel/routing and physical device NOT verified. Not certified mainland direct. One request per URL; six concurrent, 60s timeout. HTTP audit is not browser UX.',results=results)
    target=ROOT/'docs/evaluation/2026-09-30';target.mkdir(parents=True,exist_ok=True)
    (target/f'public-{label}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(requests=len(results),failures=[r for r in results if r['curlExit'] or r['status']!='200'],models=[r for r in results if '/models/' in r['url']]),ensure_ascii=False,indent=2))
