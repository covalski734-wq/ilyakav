import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../worker/index.ts'
import { MAX_BODY_BYTES } from '../shared/contact.ts'
import { PUBLIC_PATHS } from '../shared/routes.ts'

const valid = { name: ' Test ', contact: ' test@example.com ', type: 'site', brief: ' A test brief ' }
const env = { ASSETS: { fetch: async request => new Response(new URL(request.url).pathname, { status: new URL(request.url).pathname === '/missing' ? 404 : 200 }) } }
const req = (body, options = {}) => new Request('https://ilyakav.com/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body), ...options })
test('API rejects methods, origins, unsupported bodies and invalid fields before checking secrets', async () => {
  const get = await worker.fetch(new Request('https://ilyakav.com/api/contact'), env)
  assert.equal(get.status, 405); assert.equal(get.headers.get('allow'), 'POST'); assert.match(get.headers.get('content-type'), /application\/json/)
  for (const body of ['', 'null', '[]', '{']) assert.equal((await worker.fetch(req(body), env)).status, 400)
  for (const body of [{}, { ...valid, name: '   ' }, { ...valid, contact: 'bad' }, { ...valid, brief: '\n\t' }, { ...valid, name: 'a'.repeat(121) }, { ...valid, type: 'unknown' }]) assert.equal((await worker.fetch(req(body), env)).status, 422)
  assert.equal((await worker.fetch(req(valid, { headers: { 'content-type': 'text/plain' } }), env)).status, 415)
  assert.equal((await worker.fetch(req(valid, { headers: { 'content-type': 'application/json', origin: 'https://other.example' } }), env)).status, 403)
  assert.equal((await worker.fetch(req(valid), env)).status, 503)
  assert.equal((await worker.fetch(req({ ...valid, contact: '@valid_name' }), env)).status, 503)
})
test('body size is enforced with and without Content-Length', async () => {
  const huge = 'x'.repeat(MAX_BODY_BYTES + 1)
  assert.equal((await worker.fetch(req(huge), env)).status, 413)
  assert.equal((await worker.fetch(req('{}', { headers: { 'content-type': 'application/json', 'content-length': String(MAX_BODY_BYTES + 1) } }), env)).status, 413)
})
test('Telegram success must be confirmed; drafts are trimmed; no real message is sent', async t => {
  const configured = { ...env, TELEGRAM_BOT_TOKEN: 'test-only', TELEGRAM_CHAT_ID: 'test-only' }
  let sent
  const mock = t.mock.method(globalThis, 'fetch', async (_url, options) => { sent = JSON.parse(options.body); return Response.json({ ok: true }) })
  assert.deepEqual(await (await worker.fetch(req(valid), configured)).json(), { ok: true })
  assert.match(sent.text, /Имя: Test\nСвязь: test@example.com\nТип: site\n\nA test brief$/)
  assert.equal(sent.parse_mode, undefined)
  for (const result of [{ ok: false }, {}, null]) {
    mock.mock.mockImplementation(async () => Response.json(result))
    assert.equal((await worker.fetch(req(valid), configured)).status, 502)
  }
  mock.mock.mockImplementation(async () => { throw new Error('offline') })
  assert.equal((await worker.fetch(req(valid), configured)).status, 502)
  const calls = mock.mock.callCount()
  assert.deepEqual(await (await worker.fetch(req({ ...valid, company: 'bot' }), configured)).json(), { ok: true })
  assert.equal(mock.mock.callCount(), calls)
})
test('public routes, canonical redirects, API 404 and real HTML 404', async () => {
  for (const path of PUBLIC_PATHS) {
    const response = await worker.fetch(new Request('https://ilyakav.com' + path), env)
    assert.equal(response.status, 200)
    assert.equal(await response.text(), path === '/' ? '/index.html' : `${path}/index.html`)
    if (path !== '/') {
      const slash = await worker.fetch(new Request('https://ilyakav.com' + path + '/?x=1'), env)
      assert.equal(slash.status, 308); assert.equal(slash.headers.get('location'), 'https://ilyakav.com' + path + '?x=1')
    }
  }
  for (const url of ['http://ilyakav.com/about?x=1', 'https://www.ilyakav.com/about?x=1']) assert.equal((await worker.fetch(new Request(url), env)).headers.get('location'), 'https://ilyakav.com/about?x=1')
  assert.equal((await worker.fetch(new Request('https://ilyakav.com/about/index.html'), env)).headers.get('location'), 'https://ilyakav.com/about')
  assert.equal((await worker.fetch(new Request('https://ilyakav.com/api/missing'), env)).status, 404)
  const missing = await worker.fetch(new Request('https://ilyakav.com/missing'), env)
  assert.equal(missing.status, 404); assert.equal(missing.headers.get('x-robots-tag'), 'noindex'); assert.equal(await missing.text(), '/404.html')
})
