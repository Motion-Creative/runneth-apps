import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { assertPublicHttpUrl, isPrivateAddress } = require('../skills/tech-stack-scanner/lib/url-safety.cjs');
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('private and reserved addresses are rejected', async () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.10']) {
    assert.equal(isPrivateAddress(address), true, address);
    await assert.rejects(assertPublicHttpUrl(`http://${address}`));
  }
  for (const address of ['::1', 'fd00::1']) {
    assert.equal(isPrivateAddress(address), true, address);
    await assert.rejects(assertPublicHttpUrl(`http://[${address}]`));
  }
});

test('public literal addresses and HTTPS URLs are accepted', async () => {
  assert.equal(isPrivateAddress('1.1.1.1'), false);
  assert.equal((await assertPublicHttpUrl('https://1.1.1.1/path')).href, 'https://1.1.1.1/path');
  assert.equal(isPrivateAddress('2606:4700:4700::1111'), false);
  assert.equal(
    (await assertPublicHttpUrl('https://[2606:4700:4700::1111]/')).hostname,
    '[2606:4700:4700::1111]',
  );
});

test('matched network hosts are not reported as unmatched', () => {
  const capture = {
    inputUrl: 'https://example.com',
    finalUrl: 'https://example.com',
    status: 200,
    scannedAt: '2026-07-22T00:00:00Z',
    requestHosts: ['static.klaviyo.com', 'unknown.vendor.test'],
    requests: [{ url: 'https://static.klaviyo.com/script.js', host: 'static.klaviyo.com' }],
    mainHeaders: {},
    cookies: [],
    windowKeys: [],
    metaGenerator: '',
    html: '',
  };
  const result = spawnSync(
    process.execPath,
    [resolve(PACKAGE_ROOT, 'skills/tech-stack-scanner/lib/detect.mjs'), '/dev/stdin', '--json'],
    { encoding: 'utf8', input: JSON.stringify(capture) },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.detected.some(({ name }) => name === 'Klaviyo'), true);
  assert.deepEqual(payload.unmatchedThirdPartyHosts, ['unknown.vendor.test']);
});
