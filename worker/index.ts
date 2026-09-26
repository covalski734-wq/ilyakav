/**
 * Sends the contact form to Telegram.
 *
 * The form used to hand the visitor a `mailto:` link, which silently fails on
 * plenty of phones and leaves no trace when it does. This posts the brief to a
 * Telegram chat instead; the site keeps nothing.
 *
 * Two secrets are required — without them the endpoint answers `unconfigured`
 * and the form falls back to showing the direct contacts:
 *
 *   npx wrangler secret put TELEGRAM_BOT_TOKEN
 *   npx wrangler secret put TELEGRAM_CHAT_ID
 */

type Env = {
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

/** Generous enough for a real brief, small enough to keep junk out. */
const LIMITS = {
  name: 120,
  contact: 200,
  type: 40,
  brief: 3500,
} as const

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

const field = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  // Reject cross-origin browser submissions.
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: 'forbidden' }, 403)
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ error: 'unconfigured' }, 503)
  }

  let payload: Record<string, unknown>
  try {
    const parsed: unknown = await request.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json({ error: 'invalid_body' }, 400)
    }
    payload = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  // Hidden input no human ever fills in.
  if (field(payload.company, 80)) return json({ ok: true }, 200)

  const name = field(payload.name, LIMITS.name)
  const contact = field(payload.contact, LIMITS.contact)
  const type = field(payload.type, LIMITS.type)
  const brief = field(payload.brief, LIMITS.brief)

  if (!name || !contact || !brief) return json({ error: 'missing_fields' }, 422)

  const text = [
    'Новая заявка с сайта',
    '',
    `Имя: ${name}`,
    `Связь: ${contact}`,
    `Тип: ${type || '—'}`,
    '',
    brief,
  ].join('\n')

  try {
    // No parse_mode, so visitor text is never interpreted as markup.
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
      },
    )

    if (!response.ok) return json({ error: 'upstream_failed' }, 502)
    const result: unknown = await response.json()
    if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
      return json({ error: 'upstream_failed' }, 502)
    }
  } catch {
    return json({ error: 'upstream_failed' }, 502)
  }

  return json({ ok: true }, 200)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/contact') return handleContact(request, env)

    // Everything else is the built site.
    return env.ASSETS.fetch(request)
  },
}
