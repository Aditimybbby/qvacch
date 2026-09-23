import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildHistory } from './prompts.js';
import { modelStatus, loadLocalModel, generate, shutdown } from './engine.js';

const port = Number(process.env.PORT || 3210);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
const origin = `http://127.0.0.1:${port}`;
const publicDir = new URL('../public/', import.meta.url);
const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
async function body(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 40000) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  // Loopback binding plus Host/Origin checks keep this desktop app local.
  if (req.headers.host !== `127.0.0.1:${port}`) return json(res, 403, { error: `Open ${origin}` });
  if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: 'Cross-origin requests are not allowed.' });
  const path = new URL(req.url, origin).pathname;
  try {
    if (req.method === 'GET' && files[path]) {
      const [name, type] = files[path];
      const content = await readFile(new URL(name, publicDir));
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
      return res.end(content);
    }
    if (req.method === 'GET' && path === '/api/status') return json(res, 200, modelStatus());
    if (req.method === 'POST' && path.startsWith('/api/')) {
      if (req.headers['content-type'] !== 'application/json') return json(res, 415, { error: 'JSON required.' });
      if (path === '/api/load') {
        void loadLocalModel().catch(() => {});
        return json(res, 202, modelStatus());
      }
      if (path === '/api/generate') {
        const history = buildHistory(await body(req));
        if (modelStatus().busy) return json(res, 409, { error: 'Another session is generating. Please wait.' });
        res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'X-Accel-Buffering': 'no' });
        res.flushHeaders();
        const send = data => { if (!res.destroyed) res.write(JSON.stringify(data) + '\n'); };
        const started = Date.now();
        try {
          let count = 0;
          for await (const token of generate(history)) {
            count += token.length;
            send({ type: 'token', text: token });
            // Drain a disconnected run before accepting another inference request.
          }
          if (!count) throw new Error('The model returned no text. Try again with shorter notes.');
          send({ type: 'done', seconds: (Date.now() - started) / 1000 });
        } catch (error) { send({ type: 'error', message: error.message }); }
        return res.end();
      }
    }
    json(res, 404, { error: 'Not found.' });
  } catch (error) {
    if (!res.headersSent) json(res, 400, { error: error.message });
    else res.end();
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, '127.0.0.1', () => console.log(`Recall Desk → ${origin}\nFirst model load needs internet; notes stay on this machine.`));
  async function stop() {
    server.close();
    const timeout = setTimeout(() => process.exit(0), 5000);
    timeout.unref();
    await shutdown().catch(console.error);
    process.exit(0);
  }
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
