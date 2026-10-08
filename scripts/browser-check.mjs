import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { PUBLIC_PATHS } from '../shared/routes.ts'
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8787'
const output = process.env.TEST_OUTPUT_DIR ?? 'artifacts/verification-2026-10-07'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = [], failures = []
const widths = [360,390,430,1000,1020,1021,1050,1100,1280,1366,1440,1920]
const record = (condition, message) => { if (!condition) failures.push(message) }
try {
  await Promise.all(['ru','uk','en'].map(async language => {
    const context = await browser.newContext({ locale: language, reducedMotion: 'reduce' })
    await context.addInitScript(lang => localStorage.setItem('ilyakav-lang', lang), language)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration|react error|did not match|styled/i.test(message.text())) errors.push(message.text()) })
    const paths = language === 'ru' ? [...PUBLIC_PATHS, '/random-page-that-does-not-exist'] : ['/', '/about', '/privacy', '/contact']
    for (const path of paths) {
      for (const width of widths) {
        if (![ '/', '/about', '/privacy', '/contact'].includes(path) && [1000,1020,1050].includes(width)) continue
        await page.setViewportSize({ width, height: width < 760 ? 844 : 900 })
        const requested = []
        const requestListener = request => { if (request.resourceType() === 'script') requested.push(request.url()) }
        page.on('request', requestListener)
        const response = await page.goto(base + path, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForFunction(lang => document.documentElement.lang === lang, language)
        await page.waitForTimeout(70)
        page.off('request', requestListener)
        const geometry = await page.evaluate(() => {
          const h1 = document.querySelector('h1')
          const range = document.createRange(); range.selectNodeContents(h1)
          const headingRects = [...range.getClientRects()].map(r => ({ left: r.left, right: r.right }))
          const header = [...document.querySelectorAll('header a, header button')].filter(e => e.getClientRects().length).map(e => ({ text: e.textContent, left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right, width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height }))
          const position = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('understands'))
          let positioning = null
          if (position) { range.selectNodeContents(position); positioning = { textRight: Math.max(...[...range.getClientRects()].map(r => r.right)), columnRight: position.parentElement.getBoundingClientRect().right } }
          return { scrollWidth: document.documentElement.scrollWidth, width: innerWidth, headingRects, header, positioning,
            firstFieldY: document.querySelector('[name="name"]')?.getBoundingClientRect().top,
            canonical: document.querySelector('link[rel="canonical"]')?.href,
            h1: h1.textContent,
          }
        })
        const label = `${language} ${path} ${width}`
        record(response.status() === (path.includes('does-not-exist') ? 404 : 200), `${label}: status ${response.status()}`)
        record(geometry.scrollWidth <= width + 1, `${label}: document overflow`)
        record(geometry.headingRects.every(r => r.left >= -1 && r.right <= width + 1), `${label}: h1 clipped`)
        record(geometry.header.every(r => r.left >= -1 && r.right <= width + 1), `${label}: header clipped`)
        if (geometry.positioning) record(geometry.positioning.textRight <= geometry.positioning.columnRight + 1, `${label}: positioning overflow`)
        if (path !== '/') record(!requested.some(url => url.includes('/HomePage-')), `${label}: loaded home code`)
        results.push({ language, path, width, status: response.status(), ...geometry, scripts: requested.map(url => url.split('/').pop()) })
        if ((width === 390 || width === 1440) && ['/', '/about', '/privacy', '/contact'].includes(path)) {
          const slug = path === '/' ? 'home' : path.slice(1)
          await page.screenshot({ path: `${output}/${slug}-${language}-${width}.png` })
          if (path === '/about') {
            await page.locator('h2').first().scrollIntoViewIfNeeded()
            await page.waitForTimeout(500)
            await page.screenshot({ path: `${output}/about-position-${language}-${width}.png` })
          }
          if (path === '/') {
            await page.locator('#work').scrollIntoViewIfNeeded()
            await page.waitForFunction(() => [...document.querySelectorAll('#work img')].every(image => image.complete && image.naturalWidth > 0))
            await page.waitForTimeout(500)
            await page.screenshot({ path: `${output}/work-${language}-${width}.png` })
          }
        }
      }
      console.log(`Checked ${language} ${path}`)
    }
    record(errors.length === 0, `${language} browser errors: ${errors.join('; ')}`)
    await context.close()
  }))

  // Real HTTP routing and SEO assets, without sending a valid lead.
  for (const [path, status, type] of [['/robots.txt',200,'text/plain'],['/sitemap.xml',200,'xml'],['/api/contact',405,'application/json'],['/random-page-that-does-not-exist',404,'text/html']]) {
    const response = await fetch(base + path)
    record(response.status === status && response.headers.get('content-type').includes(type), `HTTP ${path}: ${response.status} ${response.headers.get('content-type')}`)
  }
  const invalid = await fetch(base + '/api/contact', { method:'POST',headers:{'content-type':'application/json'},body:'{}' })
  record(invalid.status === 422, 'Invalid POST should return 422')
  for (const path of PUBLIC_PATHS.filter(path => path !== '/')) {
    const response = await fetch(base + path + '/', {redirect:'manual'})
    record(response.status === 308 && response.headers.get('location') === base + path, `Slash redirect ${path}`)
  }

  // Full-motion hydration, preferences, menu keyboard control and form outcomes.
  const context = await browser.newContext({ viewport:{width:390,height:844},locale:'en-US' })
  const page = await context.newPage(), errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => { localStorage.setItem('ilyakav-lang','en');localStorage.setItem('ilyakav-theme','dark') })
  await page.goto(base + '/contact?type=landing#project-form', {waitUntil:'networkidle'})
  await page.waitForFunction(() => document.documentElement.lang === 'en' && document.documentElement.dataset.theme === 'dark')
  assert.equal(await page.locator('select').inputValue(), 'landing')
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://ilyakav.com/contact')
  record((await page.locator('[name="name"]').boundingBox()).y > 80, 'Anchor field hidden behind sticky header')
  let sends = 0, mode = 'error', payload
  await page.route('**/api/contact', async route => {
    sends++; payload = route.request().postDataJSON()
    await route.fulfill({ status: mode === 'error' ? 502 : 200, contentType:'application/json',body:JSON.stringify(mode === 'success' ? {ok:true} : {ok:false}) })
  })
  await page.locator('[name="name"]').fill('   ')
  await page.locator('[name="contact"]').fill('invalid')
  await page.locator('[name="brief"]').fill('  ')
  await page.locator('button[type="submit"]').click()
  assert.equal(sends, 0); assert.equal(await page.locator('[aria-invalid="true"]').count(), 3)
  await page.locator('[name="name"]').fill(' Test ')
  await page.locator('[name="contact"]').fill(' test@example.com ')
  await page.locator('[name="brief"]').fill(' Test brief ')
  await page.locator('button[type="submit"]').click()
  await page.locator('form div[role="alert"]').waitFor()
  assert.equal(await page.locator('[name="name"]').inputValue(), ' Test ')
  assert.equal(payload.name, 'Test'); assert.equal(payload.type, 'landing')
  mode = 'unconfirmed'
  await page.locator('button[type="submit"]').click()
  await page.locator('form div[role="alert"]').waitFor()
  assert.equal(await page.locator('form [role="status"]').count(), 0)
  mode = 'success'
  await page.locator('button[type="submit"]').click()
  await page.locator('form [role="status"]').waitFor()
  assert.equal(await page.locator('[name="name"]').inputValue(), '')
  const burger = page.locator('[data-menu-toggle]')
  await burger.click(); await page.waitForTimeout(400)
  assert.equal(await page.locator('main').getAttribute('inert'), '')
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Escape')
  assert.equal(await page.locator('main').getAttribute('inert'), null)
  assert.equal(await burger.getAttribute('aria-expanded'), 'false')
  assert.equal(await burger.evaluate(element => element === document.activeElement), true)
  record(errors.length === 0, `Full-motion errors: ${errors.join('; ')}`)
  await context.close()

  const preferences = await browser.newContext({viewport:{width:1440,height:900},locale:'en-US',reducedMotion:'reduce'})
  const preferencePage = await preferences.newPage()
  await preferencePage.goto(base + '/about', {waitUntil:'networkidle'})
  await preferencePage.locator('header [data-lang] button').filter({hasText:'UA'}).click()
  await preferencePage.locator('header button[aria-pressed][aria-label]').click()
  await preferencePage.reload({waitUntil:'networkidle'})
  await preferencePage.waitForFunction(() => document.documentElement.lang === 'uk' && document.documentElement.dataset.theme === 'dark')
  assert.equal(await preferencePage.locator('header a[href="/about"]').getAttribute('aria-current'), 'page')
  await preferencePage.keyboard.press('Tab')
  assert.equal(await preferencePage.locator('a[href="#main-content"]').evaluate(element => element === document.activeElement), true)
  await preferencePage.keyboard.press('Enter')
  assert.equal(await preferencePage.locator('main').evaluate(element => element === document.activeElement), true)
  await preferences.close()
} finally {
  await browser.close()
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ results, failures }, null, 2))
}
console.log(`${results.length} responsive route/language/viewport combinations; ${failures.length} failures`)
assert.deepEqual(failures, [])
