import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { ADMIN_RATE_LIMITS, server } from '../dist/index.js'

after(async () => {
  await server.close()
})

test('configures rate limits on every brain-submission admin route', async () => {
  const routes = [
    { method: 'DELETE', url: '/api/brain-submissions/all', max: ADMIN_RATE_LIMITS.destructive.max },
    { method: 'GET', url: '/brain-submissions', max: ADMIN_RATE_LIMITS.read.max },
    { method: 'GET', url: '/api/brain-submissions/1/files', max: ADMIN_RATE_LIMITS.read.max },
    {
      method: 'GET',
      url: '/api/brain-submissions/1/files/1/download',
      max: ADMIN_RATE_LIMITS.download.max,
    },
    { method: 'GET', url: '/api/brain-submissions/1/zip', max: ADMIN_RATE_LIMITS.archive.max },
    { method: 'POST', url: '/api/brain-submissions/zip-form', max: ADMIN_RATE_LIMITS.archive.max },
  ]

  for (const [index, route] of routes.entries()) {
    const response = await server.inject({
      method: route.method,
      url: route.url,
      headers: { 'x-forwarded-for': `203.0.113.${index + 1}` },
    })

    assert.equal(response.statusCode, 401)
    assert.equal(response.headers['x-ratelimit-limit'], String(route.max))
  }
})

test('preserves authenticated dashboard access below the limit', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/api/brain-submissions?token=test-token',
    headers: { 'x-forwarded-for': '203.0.113.20' },
  })

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), { submissions: [] })
  assert.equal(response.headers['x-ratelimit-limit'], String(ADMIN_RATE_LIMITS.read.max))
})

test('tracks rate limits independently for forwarded clients', async () => {
  const requestFrom = (ip) => ({
    method: 'DELETE',
    url: '/api/brain-submissions/all',
    headers: { 'x-forwarded-for': ip },
  })
  const firstClient = '203.0.113.30'
  const secondClient = '203.0.113.31'

  for (let attempt = 0; attempt < ADMIN_RATE_LIMITS.destructive.max; attempt += 1) {
    const response = await server.inject(requestFrom(firstClient))
    assert.equal(response.statusCode, 401)
  }

  const secondClientResponse = await server.inject(requestFrom(secondClient))
  assert.equal(secondClientResponse.statusCode, 401)

  const firstClientLimitedResponse = await server.inject(requestFrom(firstClient))
  assert.equal(firstClientLimitedResponse.statusCode, 429)
})

test('rate-limits repeated unauthorized dashboard requests', async () => {
  const request = {
    method: 'GET',
    url: '/api/brain-submissions',
    headers: { 'x-forwarded-for': '203.0.113.40' },
  }

  for (let attempt = 0; attempt < ADMIN_RATE_LIMITS.read.max; attempt += 1) {
    const response = await server.inject(request)
    assert.equal(response.statusCode, 401)
    assert.equal(response.headers['x-ratelimit-limit'], String(ADMIN_RATE_LIMITS.read.max))
  }

  const limitedResponse = await server.inject(request)

  assert.equal(limitedResponse.statusCode, 429)
  assert.ok(limitedResponse.headers['retry-after'])
})
