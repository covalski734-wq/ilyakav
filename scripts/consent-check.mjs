import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { CONSENT_VERSION, CONSENT_MAX_AGE } from '../src/lib/consent.ts'

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8787'
const origin = new URL(base).origin
const configured = process.env.EXPECT_GTM !== 'false'
const metaConfigured = configured && process.env.EXPECT_META !== 'false'
const output = process.env.CONSENT_OUTPUT_DIR ?? `artifacts/consent/${configured ? 'configured' : 'disabled'}`
const key = 'ilyakav-consent'
const labels = {
  en: { accept: 'Accept All', reject: 'Reject All', customize: 'Customize', save: 'Save preferences', settings: 'Cookie Settings' },
  ru: { accept: 'Принять все', reject: 'Отклонить все', customize: 'Настроить', save: 'Сохранить выбор', settings: 'Настройки cookies' },
  uk: { accept: 'Прийняти всі', reject: 'Відхилити всі', customize: 'Налаштувати', save: 'Зберегти вибір', settings: 'Налаштування cookies' },
}
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL ?? 'chrome' })
const results = []

async function setup({ viewport = { width: 1440, height: 900 }, lang = 'en', theme = 'light', stored, path = '/cookies' } = {}) {
  const context = await browser.newContext({ viewport, locale: lang, reducedMotion: 'reduce' })
  await context.addInitScript(({ origin, lang, theme, key, stored }) => {
    if (location.origin !== origin) return
    window.__consentUiDocument = crypto.randomUUID()
    localStorage.setItem('ilyakav-lang', lang)
    localStorage.setItem('ilyakav-theme', theme)
    if (stored !== undefined && !localStorage.getItem('consent-ui-seeded')) {
      localStorage.setItem(key, typeof stored === 'string' ? stored : JSON.stringify(stored))
      localStorage.setItem('consent-ui-seeded', '1')
    }
  }, { origin, lang, theme, key, stored })
  const requests = [], errors = [], submissions = []
  let apiReply = { status: 500, body: { error: 'Mock delivery failure' } }
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
  // Every external request is intercepted at context level, including new tabs.
  // The suite never sends analytics, Pixel measurements or contact submissions.
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin === origin) {
      if (url.pathname === '/api/contact') {
        submissions.push(request.postDataJSON())
        return route.fulfill({ status: apiReply.status, contentType: 'application/json', body: JSON.stringify(apiReply.body) })
      }
      // Local Pages can inherit Worker html_handling:none. Exercise its actual
      // middleware document while retaining the public pathname for the router.
      if (process.env.TEST_STATIC_DOCUMENTS === 'true' && request.isNavigationRequest()) {
        const documentPath = url.pathname.replace(/\/$/, '') + '/index.html'
        const response = await context.request.get(base + documentPath + url.search)
        assert.ok(response.ok(), `Pages document ${documentPath}: ${response.status()}`)
        return route.fulfill({ response })
      }
      return route.continue()
    }
    requests.push(request.url())
    if (url.hostname === 'www.googletagmanager.com') {
      return route.fulfill({ contentType: 'application/javascript', body: 'window.__mockGtmLoaded = true;' })
    }
    if (url.hostname === 'connect.facebook.net') {
      return route.fulfill({ contentType: 'application/javascript', body: `
        window.__mockMetaLoaded = true;
        window.__mockMetaCalls = [];
        window.fbq.callMethod = function () { window.__mockMetaCalls.push(Array.from(arguments)); };
        window.fbq.queue.splice(0).forEach(function (args) { window.fbq.callMethod.apply(window.fbq, args); });
      ` })
    }
    return route.fulfill({ status: 200, body: '' })
  })
  const page = await context.newPage()
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.locator('footer').getByRole('button', { name: labels[lang].settings, exact: true }).waitFor()
  await page.waitForFunction(() => window.dataLayer?.some(entry => entry.event === 'consent_updated'))
  return { context, page, requests, errors, submissions, reply: value => { apiReply = value } }
}
const records = page => page.evaluate(() => window.dataLayer.map(entry => entry.event ? entry : Array.from(entry)))
const events = async (page, name) => (await records(page)).filter(entry => entry.event === name)
const documentId = page => page.evaluate(() => window.__consentUiDocument)
const settings = (page, lang = 'en') => page.locator('footer').getByRole('button', { name: labels[lang].settings, exact: true }).click()
async function expectSignals(page, analytics, marketing) {
  await page.waitForFunction(({ analytics, marketing }) => {
    const signals = window.dataLayer.filter(entry => entry[0] === 'consent' && entry[1] === 'update').at(-1)?.[2]
    return signals?.analytics_storage === (analytics ? 'granted' : 'denied') &&
      ['ad_storage', 'ad_user_data', 'ad_personalization'].every(field => signals[field] === (marketing ? 'granted' : 'denied'))
  }, { analytics, marketing })
  if (metaConfigured) await page.waitForFunction(marketing =>
    window.__mockMetaCalls?.filter(entry => entry[0] === 'consent').at(-1)?.[1] === (marketing ? 'grant' : 'revoke'), marketing)
}
async function clickContact(page, selector) {
  await page.locator(selector).first().evaluate(link => {
    link.addEventListener('click', event => event.preventDefault(), { once: true })
    link.click()
  })
}
async function submit(page) {
  await page.locator('[name=name]').fill('Private Test')
  await page.locator('[name=contact]').fill('private-test@example.com')
  await page.locator('[name=brief]').fill('Confidential test brief')
  const response = page.waitForResponse(response => new URL(response.url()).pathname === '/api/contact')
  await page.locator('button[type=submit]').click()
  await response
  await page.locator('form[aria-busy=false]').waitFor()
}

try {
  for (const [name, analytics, marketing] of [['reject', false, false], ['accept', true, true], ['analytics', true, false], ['marketing', false, true]]) {
    const { context, page, requests, errors } = await setup()
    const firstDocument = await documentId(page)
    await page.locator('[data-cookie-banner]').waitFor()
    assert.equal(requests.filter(url => url.includes('googletagmanager.com/gtm.js')).length, configured ? 1 : 0)
    assert.equal(requests.filter(url => url.includes('connect.facebook.net/en_US/fbevents.js')).length, metaConfigured ? 1 : 0)
    assert.deepEqual((await context.cookies()).filter(cookie => /^(_ga|_gcl|_fb)/.test(cookie.name)), [])
    const initial = await records(page)
    assert.deepEqual(initial.find(entry => entry[0] === 'consent' && entry[1] === 'default'), ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }])
    assert.equal((await events(page, 'page_view')).length, configured ? 1 : 0)
    if (name === 'reject' || name === 'accept') await page.getByRole('button', { name: labels.en[name], exact: true }).click()
    else {
      await page.getByRole('button', { name: labels.en.customize, exact: true }).click()
      await page.locator(`#consent-${name}`).check()
      await page.getByRole('button', { name: labels.en.save, exact: true }).click()
    }
    await expectSignals(page, analytics, marketing)
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    assert.equal(saved.analytics, analytics)
    assert.equal(saved.marketing, marketing)
    assert.equal(saved.version, CONSENT_VERSION)
    assert.ok(Date.parse(saved.chosenAt))
    assert.equal(await documentId(page), firstDocument, 'Consent changes must not reload the page')
    assert.equal(await page.locator('[data-cookie-banner]').count(), 0)
    assert.equal((await events(page, 'page_view')).length, configured ? 1 : 0, 'Consent updates must not replay page views')
    await page.reload({ waitUntil: 'networkidle' })
    await expectSignals(page, analytics, marketing)
    assert.equal(await page.locator('[data-cookie-banner]').count(), 0)
    assert.equal((await events(page, 'page_view')).length, configured ? 1 : 0)
    const reloadedDocument = await documentId(page)
    await settings(page)
    assert.equal(await page.locator('#consent-analytics').isChecked(), analytics)
    assert.equal(await page.locator('#consent-marketing').isChecked(), marketing)
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('dialog[open]').count(), 0)
    assert.equal(await page.evaluate(() => document.activeElement.textContent), labels.en.settings)
    await context.addCookies([{ name: '_ga_test', value: 'test', url: base }, { name: '_fbp', value: 'test', url: base }])
    await settings(page)
    await page.getByRole('button', { name: labels.en.reject, exact: true }).click()
    await expectSignals(page, false, false)
    assert.equal((await context.cookies()).filter(cookie => /^(_ga|_fbp)/.test(cookie.name)).length, 0)
    assert.equal(await documentId(page), reloadedDocument)
    assert.deepEqual(errors, [])
    results.push({ name, analytics, marketing, passed: true })
    await context.close()
  }

  const valid = { version: CONSENT_VERSION, chosenAt: new Date().toISOString(), analytics: true, marketing: true }
  for (const [name, stored] of [
    ['malformed', '{broken'],
    ['previous-version', { ...valid, version: CONSENT_VERSION - 1 }],
    ['expired', { ...valid, chosenAt: new Date(Date.now() - CONSENT_MAX_AGE - 1000).toISOString() }],
    ['future', { ...valid, chosenAt: '2999-01-01' }],
    ['invalid-boolean', { ...valid, analytics: 'true' }],
  ]) {
    const state = await setup({ stored })
    await state.page.locator('[data-cookie-banner]').waitFor()
    await expectSignals(state.page, false, false)
    assert.equal((await events(state.page, 'page_view')).length, configured ? 1 : 0)
    assert.deepEqual(state.errors, [])
    results.push({ invalid: name, passed: true })
    await state.context.close()
  }

  for (const [width, height, lang, theme] of [[360, 640, 'ru', 'light'], [390, 844, 'uk', 'dark'], [844, 390, 'en', 'light'], [1440, 900, 'en', 'light'], [1440, 900, 'ru', 'dark']]) {
    const state = await setup({ viewport: { width, height }, lang, theme }), { page } = state
    await page.getByRole('button', { name: labels[lang].accept, exact: true }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${output}/banner-${width}-${lang}-${theme}.png` })
    await page.getByRole('button', { name: labels[lang].customize, exact: true }).click()
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      assert.ok(await page.evaluate(() => !!document.activeElement.closest('dialog')))
    }
    await page.screenshot({ path: `${output}/settings-${width}-${lang}-${theme}.png` })
    const bounds = await page.locator('dialog').boundingBox()
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= height + 1)
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('dialog[open]').count(), 0)
    assert.deepEqual(state.errors, [])
    results.push({ width, height, lang, theme, passed: true })
    await state.context.close()
  }

  {
    const state = await setup({ path: '/contact?email=private-test@example.com' })
    const { context, page } = state
    await page.getByRole('button', { name: labels.en.reject, exact: true }).click()
    await submit(page)
    assert.equal((await events(page, 'generate_lead')).length, 0, 'A server error is not a delivered lead')
    state.reply({ status: 200, body: { ok: false } })
    await submit(page)
    assert.equal((await events(page, 'generate_lead')).length, 0, 'An unconfirmed delivery is not a lead')
    state.reply({ status: 200, body: { ok: true } })
    await submit(page)
    assert.equal((await events(page, 'generate_lead')).length, configured ? 1 : 0, 'Confirmed delivery is measured with denied consent')
    for (const selector of ['a[href^="https://t.me/"]', 'a[href^="https://wa.me/"]', 'a[href^="mailto:"]', 'header a[href="/contact"]']) await clickContact(page, selector)
    const deniedClicks = await events(page, 'cta_click')
    assert.equal(deniedClicks.length, configured ? 4 : 0)
    assert.ok(deniedClicks.every(event => !event.consent_analytics && !event.consent_marketing))
    await settings(page)
    await page.getByRole('button', { name: labels.en.accept, exact: true }).click()
    await submit(page)
    assert.equal((await events(page, 'generate_lead')).length, configured ? 2 : 0)
    assert.equal((await events(page, 'page_view')).length, configured ? 1 : 0)
    const log = JSON.stringify(await records(page))
    assert.ok(!log.includes('private-test') && !log.includes('Confidential') && !log.includes('Private Test'), 'Form/query contents must not enter dataLayer')
    const firstDocument = await documentId(page)
    const other = await context.newPage()
    await other.goto(base + '/cookies', { waitUntil: 'networkidle' })
    await settings(other)
    await other.getByRole('button', { name: labels.en.reject, exact: true }).click()
    await expectSignals(page, false, false)
    assert.equal(await documentId(page), firstDocument, 'Cross-tab withdrawal must not reload')
    assert.equal((await events(page, 'page_view')).length, configured ? 1 : 0)
    await clickContact(page, 'a[href^="https://t.me/"]')
    const finalClicks = await events(page, 'cta_click')
    assert.equal(finalClicks.length, configured ? 5 : 0)
    if (configured) assert.equal(finalClicks.at(-1).consent_marketing, false)
    assert.equal(state.submissions.length, 4, 'Every contact request was intercepted')
    assert.deepEqual(state.errors, [])
    results.push({ name: 'events-form-outcomes-privacy-cross-tab', passed: true })
    await context.close()
  }

  {
    const state = await setup(), { page } = state
    await page.getByRole('button', { name: labels.en.accept, exact: true }).click()
    const firstDocument = await documentId(page)
    await page.evaluate(key => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('Mock quota failure', 'QuotaExceededError')
        return original.call(this, name, value)
      }
    }, key)
    await settings(page)
    await page.getByRole('button', { name: labels.en.reject, exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'could not save' }).waitFor()
    await expectSignals(page, false, false)
    assert.equal(await documentId(page), firstDocument, 'Removable stale consent must not force a reload on storage failure')
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null)
    assert.equal((await events(page, 'page_view')).length, configured ? 1 : 0)
    assert.deepEqual(state.errors, [])
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('[data-cookie-banner]').waitFor()
    await expectSignals(page, false, false)
    results.push({ name: 'storage-failure-keeps-choice-in-memory', passed: true })
    await state.context.close()
  }
} finally {
  await browser.close()
  await writeFile(`${output}/results.json`, JSON.stringify({ configured, metaConfigured, results }, null, 2))
}
console.log(JSON.stringify({ configured, metaConfigured, passed: results.length, output }, null, 2))
