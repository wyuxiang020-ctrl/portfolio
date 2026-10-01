// Local-only fault injection: serves the production preview but fails model downloads.
import http from 'node:http';
const recover = process.argv.includes('--recover');
const failed = new Set();
http.createServer(async (req,res) => {
  if (req.url.startsWith('/models/') && (!recover || !failed.has(req.url))) { failed.add(req.url);res.writeHead(503);res.end('Model unavailable (local test)');return; }
  try {
    const response = await fetch(`http://127.0.0.1:4322${req.url}`);
    res.writeHead(response.status, { 'content-type': response.headers.get('content-type') || 'application/octet-stream' });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(502);res.end('Preview server unavailable'); }
}).listen(4324,'127.0.0.1',() => console.log('Model failure test at http://127.0.0.1:4324'));
