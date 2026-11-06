import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Run against the built local Worker/Pages preview. Real GTM/Meta libraries are
// exercised, but all measurement endpoints are intercepted: no fake conversions.
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8787'
// Render local assets under the real origin in this isolated browser only.
// Pixel traffic permissions can reject localhost, so localhost is not a faithful test.
const siteOrigin = 'https://ilyakav.com'
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const reports = []
const releasePendingLoads = []
try {
  for (const mode of ['normal', 'delayed', 'blocked']) {
    const blockMeta = mode === 'blocked', delayMeta = mode === 'delayed'
    let releaseMeta
    const metaGate = new Promise(resolve => { releaseMeta = resolve })
    releasePendingLoads.push(releaseMeta)
    if (!delayMeta) releaseMeta()
    // Test the ordinary browser path; Meta deliberately filters HeadlessChrome as bot traffic.
    const context = await browser.newContext({
      userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`,
    })
    await context.addInitScript(() => {
      if (location.origin !== 'https://ilyakav.com') return
      localStorage.setItem('ilyakav-lang', 'en')
      window.__cspViolations = []
      document.addEventListener('securitypolicyviolation', event => {
        window.__cspViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI })
      })
    })
    const measurements = [], errors = [], metaRequests = [], warnings = [], fallbackTransports = []
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin === siteOrigin) {
        assert.equal(request.method(), 'GET', 'No real contact submissions in this check')
        const localPath = request.isNavigationRequest() && process.env.TEST_DOCUMENT_PATH || url.pathname
        const local = await context.request.get(base + localPath + url.search)
        return route.fulfill({ response: local })
      }
      if (/facebook/.test(url.hostname)) metaRequests.push(url.origin + url.pathname)
      if (url.origin === new URL(base).origin) return route.continue()
      if (blockMeta && url.hostname === 'connect.facebook.net') return route.abort('blockedbyclient')
      if (delayMeta && url.hostname === 'connect.facebook.net' && url.pathname === '/en_US/fbevents.js') await metaGate
      // Deterministic reproduction of the observed connection-to-image fallback.
      // This synthetic probe never reaches a real collector or changes GTM tags.
      if (url.hostname === 'ad.doubleclick.net' && url.searchParams.get('site_transport_probe') === '1') {
        fallbackTransports.push(request.resourceType())
        if (request.resourceType() !== 'image') return route.abort('blockedbyclient')
        return route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') })
      }
      const meta = /(^|\.)facebook\.com$/.test(url.hostname) && url.pathname.startsWith('/tr')
      const google = /google-analytics\.com$|doubleclick\.net$|googlesyndication\.com$|googleadservices\.com$/.test(url.hostname)
        || (url.hostname === 'www.google.com' && /pagead|collect/.test(url.pathname))
      if (meta || google) {
        const fields = new URLSearchParams(url.search)
        for (const [key, value] of new URLSearchParams(request.postData() ?? '')) fields.set(key, value)
        measurements.push({ provider: meta ? 'meta' : 'google', event: fields.get(meta ? 'ev' : 'en'), host: url.hostname })
        return route.fulfill({ status: 204 })
      }
      return route.continue()
    })
    const page = await context.newPage()
    const diagnostics = async () => ({ mode, measurements, errors, metaRequests, warnings, state: await page.evaluate(() => ({
      violations: window.__cspViolations,
      inline: [...document.querySelectorAll('script:not([src])')].map(script => script.textContent),
      fbq: window.fbq?.getState?.(),
      metaQueue: window.fbq?.queue?.map(item => Array.from(item)),
      consent: window.dataLayer.filter(item => item[0] === 'consent'),
    })) })
    const waitForMeasurement = async (condition, message) => {
      const deadline = Date.now() + 15000
      while (!condition() && Date.now() < deadline) await page.waitForTimeout(100)
      if (!condition()) console.log(message, JSON.stringify(await diagnostics()))
      assert.ok(condition(), message)
    }
    const waitForMetaReady = async () => {
      try {
        // callMethod only means the library loaded. Pixel configuration is async too.
        await page.waitForFunction(() => {
          const state = window.fbq?.getState?.()
          return Array.isArray(state?.pixels) && state.pixels.length > 0
        }, null, { timeout: 15000 })
      } catch (error) {
        console.log('Meta initialization did not finish:', JSON.stringify(await diagnostics()))
        throw error
      }
    }
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'warning' || message.type() === 'error') warnings.push(message.text()) })
    const response = await page.goto(siteOrigin + '/contact/', { waitUntil: delayMeta ? 'domcontentloaded' : 'networkidle' })
    assert.ok(response.ok())
    assert.match(response.headers()['content-security-policy'], /'nonce-[^']+' 'strict-dynamic'/)
    await page.locator('[data-cookie-banner] button').first().waitFor()
    await page.waitForFunction(() => !!window.google_tag_manager?.['GTM-TKPFHC7B'])
    if (!blockMeta && !delayMeta) await page.waitForFunction(() => !!window.fbq?.callMethod)
    if (mode === 'normal') {
      const imageLoaded = await page.evaluate(async () => {
        const url = 'https://ad.doubleclick.net/ccm/s/collect?site_transport_probe=1'
        try { await fetch(url, { method: 'POST', body: '' }) } catch { /* Expected mocked client block. */ }
        return new Promise(resolve => {
          const pixel = new Image()
          const timeout = setTimeout(() => resolve(false), 5000)
          pixel.onload = () => { clearTimeout(timeout); resolve(true) }
          pixel.onerror = () => { clearTimeout(timeout); resolve(false) }
          pixel.src = url
        })
      })
      assert.ok(imageLoaded, 'CSP must allow the Google image fallback after a client-blocked connection')
      assert.deepEqual(fallbackTransports, ['fetch', 'image'])
    }
    await page.evaluate(() => document.addEventListener('click', event => {
      if (event.target.closest('a[href^="https://t.me/"], a[href^="https://wa.me/"]')) event.preventDefault()
    }))
    const clickContacts = async () => {
      for (const href of ['https://t.me/ilyakav', 'https://wa.me/48572197330'])
        await page.locator(`main a[href="${href}"]`).first().click()
      await page.waitForTimeout(700)
    }
    await clickContacts()
    assert.equal(measurements.filter(item => item.provider === 'meta').length, 0, 'Meta must not send before marketing consent')
    assert.deepEqual((await context.cookies(siteOrigin)).filter(cookie => /^_fb[pc]$/.test(cookie.name)), [], 'No Meta cookies before marketing consent')
    await page.locator('[data-cookie-banner]').getByRole('button', { name: 'Accept All', exact: true }).click()
    if (delayMeta) {
      assert.equal(await page.evaluate(() => !!window.fbq?.callMethod), false, 'Consent accepted before delayed library becomes ready')
      releaseMeta()
    }
    if (!blockMeta) await waitForMetaReady()
    await clickContacts()
    if (!blockMeta) {
      await waitForMeasurement(() => measurements.some(item => item.provider === 'meta' && item.event === 'PageView'), 'Meta PageView after consent')
      await waitForMeasurement(() => measurements.some(item => item.provider === 'meta' && /telegram/i.test(item.event ?? '')), 'Meta Telegram event')
      await waitForMeasurement(() => measurements.some(item => item.provider === 'meta' && /whatsapp/i.test(item.event ?? '')), 'Meta WhatsApp event')
    }
    const earlierEvents = await page.evaluate(() => window.dataLayer.filter(item => item.event === 'cta_click')
      .map(item => ({ action: item.action, path: item.page_path, marketing: item.consent_marketing })))
    const initialViolations = await page.evaluate(() => window.__cspViolations)
    assert.deepEqual(initialViolations, [], 'No CSP violations during initial deny/grant interactions')
    const pageViewsBeforeReload = measurements.filter(item => item.provider === 'meta' && item.event === 'PageView').length
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.dataLayer.some(item => item.event === 'page_view'))
    const restored = await page.evaluate(() => {
      const start = window.dataLayer.findIndex(item => item.event === 'gtm.js')
      return window.dataLayer.slice(0, start).some(item => item[0] === 'consent' && item[1] === 'update' && item[2].ad_storage === 'granted')
    })
    assert.ok(restored, 'Returning consent must be restored before GTM starts')
    if (!blockMeta) {
      await waitForMetaReady()
      await waitForMeasurement(() => measurements.filter(item => item.provider === 'meta' && item.event === 'PageView').length > pageViewsBeforeReload, 'Returning Meta PageView')
      assert.equal(measurements.filter(item => item.provider === 'meta' && item.event === 'PageView').length, pageViewsBeforeReload + 1)
    }
    await page.evaluate(() => document.addEventListener('click', event => {
      if (event.target.closest('a[href^="https://t.me/"], a[href^="https://wa.me/"]')) event.preventDefault()
    }))
    await page.evaluate(() => window.dispatchEvent(new Event('cookie-settings')))
    await page.getByRole('dialog').getByRole('button', { name: 'Reject All', exact: true }).click()
    const countBeforeWithdrawalClicks = measurements.filter(item => item.provider === 'meta').length
    await clickContacts()
    assert.equal(measurements.filter(item => item.provider === 'meta').length, countBeforeWithdrawalClicks, 'Meta must stop after withdrawal')
    assert.deepEqual((await context.cookies(siteOrigin)).filter(cookie => /^_fb[pc]$/.test(cookie.name)), [], 'No Meta cookies after withdrawal')
    const state = await page.evaluate(() => ({
      violations: window.__cspViolations,
      events: window.dataLayer.filter(item => item.event === 'cta_click').map(item => ({ action: item.action, path: item.page_path, marketing: item.consent_marketing })),
      consent: window.dataLayer.filter(item => item[0] === 'consent').map(item => ({ command: item[1], signals: item[2] })),
    }))
    state.events = [...earlierEvents, ...state.events]
    assert.equal(state.events.length, 6)
    assert.ok(state.events.every(item => item.path === '/contact'))
    assert.deepEqual(state.events.map(item => item.marketing), [false, false, true, true, false, false])
    await waitForMeasurement(() => measurements.some(item => item.provider === 'google' && item.event === 'telegram_click'), 'Google Telegram event')
    await waitForMeasurement(() => measurements.some(item => item.provider === 'google' && item.event === 'whatsapp_click'), 'Google WhatsApp event')
    assert.deepEqual(state.violations, [])
    assert.deepEqual(errors, [])
    reports.push({ mode, blockMeta, measurements, fallbackTransports, initialViolations, ...state })
    await context.close()
  }
  await mkdir('artifacts/analytics-check', { recursive: true })
  await writeFile('artifacts/analytics-check/result.json', JSON.stringify(reports, null, 2))
  console.log('Site compatibility passed: unchanged GTM, Google/Meta loading and consent, delayed/blocked Meta, and mocked Google image fallback. Tag configuration remains owned by the marketer.')
} finally {
  for (const release of releasePendingLoads) release()
  await browser.close()
}
