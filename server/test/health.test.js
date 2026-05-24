import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import app from '../src/index.js';

test('health endpoint responds with ok', async () => {
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, resolve);
  });

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, 'ok');
    assert.equal(typeof payload.timestamp, 'string');
    assert.ok(payload.timestamp.length > 0);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});