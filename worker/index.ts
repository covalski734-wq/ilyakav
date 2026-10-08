import { validateContact, MAX_BODY_BYTES } from '../shared/contact.ts'
import { isPublicPath, normalizePath } from '../shared/routes.ts'

export type Env = {
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}
const json = (body: unknown, status: number, extra: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
})
async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' })
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'forbidden' }, 403)
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({ error: 'unsupported_media_type' }, 415)
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return json({ error: 'body_too_large' }, 413)
  let payload: Record<string, unknown>
  try {
    const reader = request.body?.getReader()
    if (!reader) return json({ error: 'invalid_body' }, 400)
    const chunks: Uint8Array[] = []
    let length = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_BODY_BYTES) { await reader.cancel(); return json({ error: 'body_too_large' }, 413) }
      chunks.push(value)
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'invalid_body' }, 400)
    payload = parsed as Record<string, unknown>
  } catch { return json({ error: 'invalid_body' }, 400) }
  if (typeof payload.company === 'string' && payload.company.trim()) return json({ ok: true }, 200)
  const { data, errors, valid } = validateContact(payload)
  if (!valid) return json({ error: 'validation_failed', fields: errors }, 422)
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ error: 'unconfigured' }, 503)
  const text = ['Новая заявка с сайта', '', `Имя: ${data.name}`, `Связь: ${data.contact}`, `Тип: ${data.type}`, '', data.brief].join('\n')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    })
    if (!response.ok) return json({ error: 'upstream_failed' }, 502)
    const result: unknown = await response.json()
    if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) return json({ error: 'upstream_failed' }, 502)
    return json({ ok: true }, 200)
  } catch { return json({ error: 'upstream_failed' }, 502) }
  finally { clearTimeout(timeout) }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Production canonical host and scheme. Local Wrangler stays on HTTP.
    if (url.hostname === 'www.ilyakav.com' || (url.hostname === 'ilyakav.com' && url.protocol === 'http:')) {
      url.hostname = 'ilyakav.com'; url.protocol = 'https:'
      return Response.redirect(url.toString(), 308)
    }
    if (url.pathname === '/api/contact') return handleContact(request, env)
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404)
    if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' })
    const path = normalizePath(url.pathname)
    // Do not expose duplicate index.html versions of public pages.
    const indexPath = path.replace(/\/index\.html$/, '') || '/'
    if ((path !== url.pathname && isPublicPath(path)) || (path.endsWith('/index.html') && isPublicPath(indexPath))) {
      url.pathname = path.endsWith('/index.html') ? indexPath : path
      return Response.redirect(url.toString(), 308)
    }
    if (isPublicPath(path)) {
      url.pathname = path === '/' ? '/index.html' : `${path}/index.html`
      return env.ASSETS.fetch(new Request(url, request))
    }
    const asset = await env.ASSETS.fetch(request)
    if (asset.status !== 404 && path !== '/404.html') return asset
    url.pathname = '/404.html'
    const page = await env.ASSETS.fetch(new Request(url, request))
    const headers = new Headers(page.headers)
    headers.set('x-robots-tag', 'noindex')
    return new Response(request.method === 'HEAD' ? null : page.body, { status: 404, headers })
  },
}
