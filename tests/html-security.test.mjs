import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { applyHtmlSecurity, HTML_BASE_CSP } from '../shared/htmlSecurity.ts'
import { onRequest } from '../functions/_middleware.ts'

test('HTML gets a fresh matching nonce while existing non-script CSP and headers survive', async t => {
  const assigned = []
  const original = Object.getOwnPropertyDescriptor(globalThis, 'HTMLRewriter')
  t.after(() => { if (original) Object.defineProperty(globalThis, 'HTMLRewriter', original); else delete globalThis.HTMLRewriter })
  globalThis.HTMLRewriter = class {
    on(selector, handler) {
      assert.equal(selector, 'script')
      this.handler = handler
      return this
    }
    transform(response) {
      this.handler.element({ setAttribute(name, value) { assigned.push({ name, value }) } })
      return response
    }
  }
  const make = () => new Response('<script src="/app.js"></script>', { headers: {
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy': "default-src 'self'; script-src 'sha256-old'; script-src-elem 'none'; img-src https://www.facebook.com; frame-ancestors 'none'",
    'cache-control': 'public, max-age=3600',
    etag: 'stale-hash',
    'last-modified': 'yesterday',
    'x-content-type-options': 'nosniff',
  } })
  const first = applyHtmlSecurity(make())
  const second = applyHtmlSecurity(make())
  assert.equal(assigned.length, 2)
  assert.notEqual(assigned[0].value, assigned[1].value)
  assert.equal(Buffer.from(assigned[0].value, 'base64').length, 24)
  const csp = first.headers.get('content-security-policy')
  assert.ok(csp.includes(`'nonce-${assigned[0].value}' 'strict-dynamic'`))
  assert.match(csp, /img-src https:\/\/www.facebook.com/)
  assert.match(csp, /frame-ancestors 'none'/)
  assert.match(csp, /script-src-attr 'none'/)
  assert.doesNotMatch(csp, /sha256-old|script-src-elem|'unsafe-inline'|'unsafe-eval'/)
  assert.equal(first.headers.get('cache-control'), 'no-store, no-transform')
  assert.equal(first.headers.get('etag'), null)
  assert.equal(first.headers.get('last-modified'), null)
  assert.equal(first.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(first.headers.get('x-frame-options'), 'DENY')
  assert.equal(first.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
  assert.notEqual(first.headers.get('content-security-policy'), second.headers.get('content-security-policy'))
})

test('static and dynamic baseline CSP allow required measurement and preview resources', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8')
  const line = headers.split(/\r?\n/).find(line => line.trim().startsWith('Content-Security-Policy:'))
  assert.equal(line.trim().slice('Content-Security-Policy: '.length), HTML_BASE_CSP)
  assert.ok(line.length <= 2000, 'Cloudflare limits each header rule line to 2000 characters')
  const directives = Object.fromEntries(HTML_BASE_CSP.split('; ').map(value => {
    const [name, ...sources] = value.split(' ')
    return [name, sources]
  }))
  for (const origin of ['https://www.googleadservices.com', 'https://googleads.g.doubleclick.net', 'https://ad.doubleclick.net', 'https://pagead2.googlesyndication.com', 'https://www.google.com', 'https://www.facebook.com']) {
    assert.ok(directives['img-src'].includes(origin), `image beacon: ${origin}`)
    assert.ok(directives['connect-src'].includes(origin), `connection: ${origin}`)
  }
  assert.ok(directives['frame-src'].includes('https://www.googletagmanager.com'))
  // The real Meta library uses an iframe/form transport for larger event payloads.
  assert.ok(directives['frame-src'].includes('https://www.facebook.com'))
  assert.ok(directives['form-action'].includes('https://www.facebook.com/tr/'))
  assert.ok(directives['style-src'].includes('https://tagmanager.google.com'))
  assert.ok(!directives['script-src'].includes("'unsafe-inline'"))
  assert.ok(!directives['script-src'].includes("'unsafe-eval'"))
})

test('Pages middleware leaves API and fingerprinted asset responses untouched', async () => {
  for (const contentType of ['application/json', 'text/javascript', 'image/webp']) {
    const response = new Response('test', { headers: { 'content-type': contentType, 'cache-control': 'public, max-age=31556952, immutable' } })
    assert.equal(await onRequest({ next: async () => response }), response)
    assert.equal(response.headers.get('cache-control'), 'public, max-age=31556952, immutable')
  }
})

test('HTML revalidation never attaches a fresh CSP nonce to a cached document', () => {
  const response = applyHtmlSecurity(new Response(null, { status: 304, headers: {
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy': "script-src 'nonce-old'",
    etag: 'same-document',
  } }))
  assert.equal(response.status, 304)
  assert.equal(response.body, null)
  assert.equal(response.headers.get('content-security-policy'), null)
  assert.equal(response.headers.get('cache-control'), 'no-store, no-transform')
  assert.equal(response.headers.get('etag'), 'same-document')
})
