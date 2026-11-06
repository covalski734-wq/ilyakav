import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { build } from 'vite'
import { chromium } from 'playwright'

// Compile each environment independently; never replace the shared dist preview.
// Real GTM is exercised only in the Meta-disabled variant. All collection traffic
// is intercepted, so these assertions prove browser dispatch, not server ingestion.
const origin = 'https://ilyakav.com'
const variants = [
  { name: 'gtm-disabled', id: '', meta: 'true' },
  { name: 'meta-disabled', id: 'GTM-TKPFHC7B', meta: 'false' },
]
const previous = { VITE_GTM_ID: process.env.VITE_GTM_ID, VITE_META_ENABLED: process.env.VITE_META_ENABLED }
try {
  for (const variant of variants) {
    process.env.VITE_GTM_ID = variant.id
    process.env.VITE_META_ENABLED = variant.meta
    variant.outDir = resolve('artifacts/config-check', variant.name)
    await build({ logLevel: 'warn', build: { outDir: variant.outDir, emptyOutDir: true } })
  }
} finally {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const reports = []
try {
  for (const variant of variants) {
    const disabled = variant.name === 'gtm-disabled'
    const context = await browser.newContext({ userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36` })
    await context.addInitScript(({ disabled }) => {
      if (location.origin !== 'https://ilyakav.com') return
      localStorage.setItem('ilyakav-lang', 'en')
      if (disabled && !localStorage.getItem('ilyakav-consent')) localStorage.setItem('ilyakav-consent', JSON.stringify({ version: 2, chosenAt: new Date().toISOString(), analytics: true, marketing: false }))
    }, { disabled })
    const vendors = [], measurements = [], errors = [], metaRequests = []
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url())
      if (url.origin === origin) {
        assert.equal(request.method(), 'GET')
        const path = ['/', '/contact', '/contact/', '/cookies', '/cookies/'].includes(url.pathname) ? '/index.html' : decodeURIComponent(url.pathname)
        const file = resolve(variant.outDir, '.' + path)
        assert.ok(file.startsWith(variant.outDir + sep), 'Only serve this variant output')
        try { return route.fulfill({ status: 200, contentType: mime[extname(file)] || 'application/octet-stream', body: await readFile(file) }) }
        catch (error) { if (error.code === 'ENOENT') return route.fulfill({ status: 404 }); throw error }
      }
      if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' })
      vendors.push({ host: url.hostname, path: url.pathname, type: request.resourceType() })
      if (/facebook\.(?:com|net)$/.test(url.hostname)) {
        metaRequests.push(url.origin + url.pathname)
        return route.fulfill({ status: 204 })
      }
      const googleScript = url.hostname === 'www.googletagmanager.com' && ['/gtm.js', '/gtag/js', '/gtag/destination'].includes(url.pathname)
      if (googleScript) return route.continue()
      // Everything else is intercepted, including Ads, Analytics and unexpected
      // vendor pixels. No conversion request leaves this isolated browser.
      const fields = new URLSearchParams(url.search)
      for (const [key, value] of new URLSearchParams(request.postData() || '')) fields.set(key, value)
      measurements.push({ host: url.hostname, event: fields.get('en') || fields.get('ev') })
      return route.fulfill({ status: 204 })
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    const waitFor = async (condition, message) => {
      const deadline = Date.now() + 15000
      while (!condition() && Date.now() < deadline) await page.waitForTimeout(100)
      assert.ok(condition(), message)
    }
    const clickContacts = async () => {
      await page.evaluate(() => document.addEventListener('click', event => {
        if (event.target.closest('a[href^="https://t.me/"], a[href^="https://wa.me/"]')) event.preventDefault()
      }, { once: false }))
      for (const href of ['https://t.me/ilyakav', 'https://wa.me/48572197330']) await page.locator(`main a[href="${href}"]`).first().click()
    }
    await page.goto(origin + '/contact/', { waitUntil: 'networkidle' })
    await page.locator('main').waitFor()
    if (disabled) {
      assert.equal(await page.locator('script[src="/gtm-init.js"]').count(), 0)
      assert.equal(await page.locator('[data-cookie-banner]').count(), 0, 'Saved choice restores even when GTM is disabled')
      await page.evaluate(() => window.dispatchEvent(new Event('cookie-settings')))
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      assert.equal(await dialog.locator('#consent-analytics').isChecked(), true)
      assert.equal(await dialog.locator('#consent-marketing').isChecked(), false)
      await dialog.getByRole('button', { name: 'Accept All', exact: true }).click()
      const choice = await page.evaluate(() => JSON.parse(localStorage.getItem('ilyakav-consent')))
      assert.equal(choice.analytics, true)
      assert.equal(choice.marketing, true)
      await page.reload({ waitUntil: 'networkidle' })
      await page.locator('main').waitFor()
      assert.equal(await page.locator('[data-cookie-banner]').count(), 0)
      await clickContacts()
      const tracking = await page.evaluate(() => (window.dataLayer || []).filter(item => ['gtm.js', 'page_view', 'cta_click', 'generate_lead'].includes(item.event)))
      assert.deepEqual(tracking, [])
      assert.deepEqual(vendors, [], 'Disabled GTM must not load any vendor')
    } else {
      assert.equal(await page.locator('script[src="/gtm-init.js"]').getAttribute('data-meta-enabled'), 'false')
      await page.waitForFunction(() => !!window.google_tag_manager?.['GTM-TKPFHC7B'])
      await clickContacts()
      await waitFor(() => measurements.some(item => item.event === 'telegram_click') && measurements.some(item => item.event === 'whatsapp_click'), 'Google contact events dispatch while consent is denied')
      assert.deepEqual(metaRequests, [], 'Disabled Meta must not load before consent')
      await page.locator('[data-cookie-banner]').getByRole('button', { name: 'Accept All', exact: true }).click()
      const prior = measurements.length
      await clickContacts()
      await waitFor(() => measurements.slice(prior).some(item => item.event === 'telegram_click') && measurements.slice(prior).some(item => item.event === 'whatsapp_click'), 'Google contact events dispatch after consent')
      const actions = await page.evaluate(() => window.dataLayer.filter(item => item.event === 'cta_click').map(item => ({ action: item.action, marketing: item.consent_marketing })))
      assert.deepEqual(actions, [{ action: 'telegram', marketing: false }, { action: 'whatsapp', marketing: false }, { action: 'telegram', marketing: true }, { action: 'whatsapp', marketing: true }])
      assert.equal(await page.evaluate(() => !!window.fbq?.callMethod), false, 'Meta remains an unloaded stub after acceptance')
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForFunction(() => !!window.google_tag_manager?.['GTM-TKPFHC7B'])
      assert.equal(await page.evaluate(() => !!window.fbq?.callMethod), false, 'Saved marketing consent cannot enable a disabled provider')
      assert.deepEqual(metaRequests, [], 'Disabled Meta must make no library or pixel requests')
      assert.deepEqual((await context.cookies(origin)).filter(cookie => /^_fb[pc]$/.test(cookie.name)), [])
    }
    assert.deepEqual(errors, [])
    reports.push({ variant: variant.name, passed: true, vendors, measurements, metaRequests, errors })
    await context.close()
  }
  await mkdir('artifacts/config-check', { recursive: true })
  await writeFile('artifacts/config-check/result.json', JSON.stringify(reports, null, 2))
  console.log('Compiled config variants passed: disabled GTM preserves consent UI without tracking; disabled Meta leaves Google clicks active and makes no Meta requests.')
} finally { await browser.close() }
