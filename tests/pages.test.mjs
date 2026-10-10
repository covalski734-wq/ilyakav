import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from '../functions/api/contact.ts'

test('Pages contact route handles methods, validation, secrets and Telegram delivery', async t => {
  const url = 'https://example.pages.dev/api/contact'
  const payload = { name: 'Test', contact: '@test_user', type: 'site', brief: 'Pages submission' }
  const post = body => new Request(url, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: new URL(url).origin },
    body: JSON.stringify(body),
  })
  assert.equal((await onRequest({ request: new Request(url), env: {} })).status, 405)
  assert.equal((await onRequest({ request: post({}), env: {} })).status, 422)
  assert.equal((await onRequest({ request: post(payload), env: {} })).status, 503)
  const env = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' }
  const mock = t.mock.method(globalThis, 'fetch', async (target, options) => {
    assert.equal(target, 'https://api.telegram.org/bottest-token/sendMessage')
    const message = JSON.parse(options.body)
    assert.equal(message.chat_id, 'test-chat')
    assert.match(message.text, /Pages submission/)
    return Response.json({ ok: true })
  })
  const response = await onRequest({ request: post(payload), env })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(mock.mock.callCount(), 1)
  mock.mock.mockImplementation(async () => Response.json({ ok: false }))
  assert.equal((await onRequest({ request: post(payload), env })).status, 502)
})
