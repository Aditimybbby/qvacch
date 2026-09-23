import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.PORT = '3299';
const { server } = await import('../src/server.js');
const base = 'http://127.0.0.1:3299';
before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(3299, '127.0.0.1', resolve);
  });
});
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });

test('serves workspace with local-only content policy', async () => {
  const res = await fetch(base);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.match(await res.text(), /Recall Desk/);
});
test('rejects cross-origin posts and incorrect Host headers', async () => {
  const foreign = await fetch(base + '/api/load', { method: 'POST', headers: { Origin: 'https://example.org', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(foreign.status, 403);
  // fetch normalizes Host; use the raw HTTP client to exercise this check.
  const reboundStatus = await new Promise((resolve, reject) => {
    http.get(base, { headers: { Host: 'example.org:3299' } }, response => {
      response.resume();
      resolve(response.statusCode);
    }).on('error', reject);
  });
  assert.equal(reboundStatus, 403);
});
test('invalid requests do not start model loading', async () => {
  const badJson = await fetch(base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(badJson.status, 400);
  const missing = await fetch(base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(missing.status, 400);
  const tooLarge = await fetch(base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'x'.repeat(6001) }) });
  assert.equal(tooLarge.status, 400);
  const wrongType = await fetch(base + '/api/generate', { method: 'POST', body: '{}' });
  assert.equal(wrongType.status, 415);
  const state = await (await fetch(base + '/api/status')).json();
  assert.equal(state.phase, 'idle');
});
