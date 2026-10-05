// Run only against a disposable database: this exercises real writes.
const assert = require('node:assert/strict');
const base = process.env.CALLSHIELD_TEST_API;
if (!base) throw new Error('Set CALLSHIELD_TEST_API to a disposable API, e.g. http://127.0.0.1:3000/v1');
const number = '+1999' + Date.now().toString().slice(-10);
async function request(path, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  assert.ok(response.ok, `${method} ${path}: ${response.status} ${await response.clone().text()}`);
  return response.json();
}
(async () => {
  assert.equal((await request('/health')).status, 'ok');
  const path = '/numbers/' + encodeURIComponent(number);
  const initial = await request(path);
  assert.equal(initial.blocked, false);
  assert.equal(initial.trusted, false);
  // The first write must work even though lookup did not create a record.
  await request('/blocklist', { e164: number, reason: 'Smoke test' });
  let result = await request(path);
  assert.equal(result.blocked, true);
  assert.equal(result.trusted, false);
  await request('/whitelist', { e164: number, note: 'Smoke test' });
  result = await request(path);
  assert.equal(result.blocked, false);
  assert.equal(result.trusted, true);
  await request('/blocklist', { e164: number, reason: 'Repeat block' });
  await request('/blocklist', { e164: number, reason: 'Repeat block' });
  result = await request(path);
  assert.equal(result.blocked, true);
  assert.equal(result.trusted, false);
  await request('/numbers/' + encodeURIComponent(number) + '/reports', { category: 'OTHER', severity: 'LOW', description: 'Smoke test' });
  assert.equal((await request(path)).reports, 1);
  await request('/blocklist/' + encodeURIComponent(number), undefined, 'DELETE');
  // Also cover allow as the first write for a second unknown caller.
  const second = number.slice(0, -1) + ((Number(number.at(-1)) + 1) % 10);
  await request('/whitelist', { e164: second, note: 'First action allow' });
  assert.equal((await request('/numbers/' + encodeURIComponent(second))).trusted, true);
  await request('/whitelist/' + encodeURIComponent(second), undefined, 'DELETE');
  console.log('PASS: health, unknown callers, block/allow reversals, repeated writes, reports');
})().catch(error => { console.error(error); process.exitCode = 1; });
