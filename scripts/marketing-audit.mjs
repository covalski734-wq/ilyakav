import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { repairedRuntimeFixture } from './marketing-gtm-fixture.mjs'

// Audit the published tag configuration against the LOCAL site. Collector
// requests and all contact submissions are intercepted; no conversions/messages.
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8787'
const origin = 'https://ilyakav.com'
const specimen = { name: 'Audit Specimen', contact: 'marketing-audit@example.com', brief: 'PRIVATE_AUDIT_BRIEF_6F2E' }
const contactHash = createHash('sha256').update(specimen.contact).digest('hex')
const fixture = process.env.GTM_REPAIR_FIXTURE === 'true'
const output = process.env.MARKETING_AUDIT_OUTPUT ?? `artifacts/marketing-audit/${fixture ? 'repaired-fixture' : 'result'}.json`
const measurements = [], formRequests = [], checks = [], errors = []
let phase = 'landing-denied', formResult = { status: 500, body: { error: 'mocked_failure' } }
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const context = await browser.newContext({
  userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`,
})
const check = (name, pass, detail = '') => checks.push({ name, pass, detail })
await context.addInitScript(() => {
  if (location.origin !== 'https://ilyakav.com') return
  localStorage.setItem('ilyakav-lang', 'en')
  window.__auditCsp = []
  document.addEventListener('securitypolicyviolation', event => window.__auditCsp.push({ directive: event.effectiveDirective, blocked: event.blockedURI }))
})
await context.route('**/*', async route => {
  const request = route.request(), url = new URL(request.url())
  if (fixture && url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtm.js' && url.searchParams.get('id') === 'GTM-TKPFHC7B') {
    const response = await route.fetch()
    return route.fulfill({ response, body: repairedRuntimeFixture(await response.text()) })
  }
  if (url.origin === origin) {
    if (url.pathname === '/api/contact') {
      assert.equal(request.method(), 'POST')
      formRequests.push({ phase, status: formResult.status })
      return route.fulfill({ status: formResult.status, contentType: 'application/json', body: JSON.stringify(formResult.body) })
    }
    assert.equal(request.method(), 'GET')
    const localPath = process.env.TEST_DOCUMENT_PATH && request.isNavigationRequest() ? process.env.TEST_DOCUMENT_PATH : url.pathname
    return route.fulfill({ response: await context.request.get(base + localPath + url.search) })
  }
  const meta = /(^|\.)facebook\.com$/.test(url.hostname) && url.pathname.startsWith('/tr')
  const google = /google-analytics\.com$|doubleclick\.net$|googlesyndication\.com$|googleadservices\.com$/.test(url.hostname)
    || url.hostname === 'www.google.com' && /pagead|collect/.test(url.pathname)
  if (meta || google) {
    const bodies = (request.postData() || '').split('\n')
    for (const body of bodies) {
      const fields = new URLSearchParams(url.search)
      for (const [key, value] of new URLSearchParams(body)) fields.set(key, value)
      const raw = [...fields.values()].join(' ')
      const pageUrl = fields.get(meta ? 'dl' : 'dl')
      let page
      try { const parsed = new URL(pageUrl); page = { path: parsed.pathname, queryKeys: [...parsed.searchParams.keys()] } } catch { /* no page parameter */ }
      measurements.push({ phase, provider: meta ? 'meta' : 'google', event: fields.get(meta ? 'ev' : 'en'), host: url.hostname,
        id: fields.get(meta ? 'id' : 'tid'), page, consent: fields.get('gcs'), consentDetails: fields.get('gcd'),
        pageId: fields.get('_p'), sequence: fields.get('_s'), nonPersonalized: fields.get('npa'),
        hasFbc: fields.has('fbc'), hasFbp: fields.has('fbp'), hasUserData: [...fields.keys()].some(key => /^(?:ud(?:\[|$)|em$|user_data)/.test(key)),
        containsFormText: raw.includes(specimen.brief), containsEmail: raw.includes(specimen.contact), containsEmailHash: raw.includes(contactHash),
      })
    }
    return route.fulfill({ status: 204 })
  }
  return route.continue()
})
const page = await context.newPage()
page.on('pageerror', error => errors.push(error.message))
const pause = () => page.waitForTimeout(1100)
const counts = () => measurements.reduce((result, event) => { const key = event.provider + ':' + event.event; result[key] = (result[key] || 0) + 1; return result }, {})
const click = async selector => {
  await page.locator(selector).first().click()
  await pause()
}
const events = () => page.evaluate(() => window.dataLayer.filter(item => ['page_view', 'cta_click', 'generate_lead', 'gtm.formSubmit'].includes(item.event))
  .map(item => ({ event: item.event, action: item.action, page_path: item.page_path, analytics: item.consent_analytics, marketing: item.consent_marketing })))
try {
  // Unknown URL fields must not silently become custom analytics parameters.
  await page.goto(origin + '/contact/?utm_source=facebook&utm_medium=paid_social&utm_campaign=audit&fbclid=AUDIT_FB_CLICK&email=url-audit%40example.com', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!window.google_tag_manager?.['GTM-TKPFHC7B'])
  await page.evaluate(() => document.addEventListener('click', event => {
    if (event.target.closest('a[href^="https://t.me/"],a[href^="https://wa.me/"],a[href^="mailto:"]')) event.preventDefault()
  }))
  await pause()
  check('Meta sends no measurement before marketing consent', !measurements.some(item => item.provider === 'meta'))
  const initialPageviews = measurements.filter(item => item.id === 'G-ZWJKT1GYSL' && item.event === 'page_view')
  check('One initial Google page_view', initialPageviews.length === 1, String(initialPageviews.length))
  check('Google landing measurement retains campaign parameters', initialPageviews.some(item => ['utm_source', 'utm_medium', 'utm_campaign'].every(key => item.page?.queryKeys.includes(key))))
  phase = 'accept'
  await page.locator('[data-cookie-banner]').getByRole('button', { name: 'Accept All', exact: true }).click()
  await page.waitForFunction(() => (window.fbq?.getState?.().pixels?.length || 0) > 0)
  await pause()
  check('One Meta PageView after consent', measurements.filter(item => item.provider === 'meta' && item.event === 'PageView').length === 1)
  check('Meta preserves the consented advertising click identifier', measurements.some(item => item.provider === 'meta' && item.event === 'PageView' && item.hasFbc))
  for (const [action, selector] of [['telegram', 'main a[href="https://t.me/ilyakav"]'], ['whatsapp', 'main a[href="https://wa.me/48572197330"]'], ['email', 'main a[href^="mailto:"]']]) {
    phase = action + '-first'
    await click(selector)
    phase = action + '-second'
    await click(selector)
  }
  const contactEvents = await events()
  for (const action of ['telegram', 'whatsapp', 'email']) {
    check(`App records both ${action} clicks`, contactEvents.filter(item => item.event === 'cta_click' && item.action === action).length === 2)
  }
  check('Meta records both Telegram clicks exactly once', measurements.filter(item => item.provider === 'meta' && item.event === 'TelegramClick').length === 2)
  check('Meta records both WhatsApp clicks exactly once', measurements.filter(item => item.provider === 'meta' && item.event === 'WhatsAppClick').length === 2)
  const fill = async () => {
    await page.locator('[name="name"]').fill(specimen.name)
    await page.locator('[name="contact"]').fill(specimen.contact)
    await page.locator('[name="brief"]').fill(specimen.brief)
  }
  phase = 'form-invalid'
  await click('button[type="submit"]')
  check('Invalid form does not reach API', formRequests.length === 0)
  check('Invalid form has no Meta Lead', !measurements.some(item => item.provider === 'meta' && item.phase === phase && item.event === 'Lead'))
  phase = 'form-failed'
  await fill()
  await click('button[type="submit"]')
  check('Failed form has no app lead', !(await events()).some(item => item.event === 'generate_lead'))
  check('Failed form has no Meta Lead', !measurements.some(item => item.provider === 'meta' && item.phase === phase && item.event === 'Lead'))
  phase = 'email-failure-fallback'
  await click('form a[href^="mailto:"]')
  phase = 'form-unconfirmed'
  formResult = { status: 200, body: { ok: false } }
  await click('button[type="submit"]')
  check('Unconfirmed form has no app lead', !(await events()).some(item => item.event === 'generate_lead'))
  check('Unconfirmed form has no Meta Lead', !measurements.some(item => item.provider === 'meta' && item.phase === phase && item.event === 'Lead'))
  phase = 'form-success'
  formResult = { status: 200, body: { ok: true } }
  await click('button[type="submit"]')
  check('Confirmed form emits one app generate_lead', (await events()).filter(item => item.event === 'generate_lead').length === 1)
  check('Confirmed form emits one Meta Lead', measurements.filter(item => item.provider === 'meta' && item.phase === phase && item.event === 'Lead').length === 1)
  check('Confirmed form emits Google lead', measurements.some(item => item.provider === 'google' && item.phase === phase && ['generate_lead', 'contact_form_submit'].includes(item.event)))
  phase = 'form-honeypot'
  await fill()
  await page.locator('[name="company"]').evaluate(input => { input.value = 'audit-bot' })
  await click('button[type="submit"]')
  check('Honeypot neutral success emits no app lead', (await events()).filter(item => item.event === 'generate_lead').length === 1)
  check('Honeypot neutral success emits no Meta Lead', !measurements.some(item => item.provider === 'meta' && item.phase === phase && item.event === 'Lead'))
  // Google batches some events for several seconds; inspect final counts rather
  // than attributing request-arrival time to the earlier click that created it.
  await page.waitForTimeout(5500)
  for (const action of ['telegram', 'whatsapp', 'email']) {
    const emitted = measurements.filter(item => item.id === 'G-ZWJKT1GYSL' && item.event === action + '_click')
    const expected = action === 'email' ? 3 : 2
    check(`Google records all ${action} clicks`, emitted.length === expected, `${emitted.length}/${expected}`)
  }
  check('Only one Google confirmed form conversion overall', measurements.filter(item => item.id === 'G-ZWJKT1GYSL' && ['generate_lead', 'contact_form_submit'].includes(item.event)).length === 1)
  check('Meta records all three email contact clicks exactly once', measurements.filter(item => item.provider === 'meta' && item.event === 'EmailClick').length === 3)
  check('AllLeads contains only seven contact clicks and one confirmed form', measurements.filter(item => item.provider === 'meta' && item.event === 'AllLeads').length === 8)
  check('Form contents stay out of measurement requests', !measurements.some(item => item.containsFormText || item.containsEmail || item.containsEmailHash))
  const violations = await page.evaluate(() => window.__auditCsp)
  check('No CSP violations', violations.length === 0)
  check('No JavaScript errors', errors.length === 0)
  const state = { configuration: fixture ? 'simulated-repair-not-published' : 'published-gtm', checks, measurements, formRequests, events: await events(), errors, violations, counts: counts() }
  await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true })
  await writeFile(output, JSON.stringify(state, null, 2))
  console.log(JSON.stringify({ passed: checks.filter(item => item.pass).length, failed: checks.filter(item => !item.pass), counts: state.counts, output }, null, 2))
  if (checks.some(item => !item.pass)) process.exitCode = 1
} finally { await browser.close() }
