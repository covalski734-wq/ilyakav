import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8787'
const output = 'artifacts/verification-2026-10-13/handoff'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
const results = []
try {
  for (const lang of ['ru', 'uk', 'en']) {
    const copy = JSON.parse(await readFile(`src/i18n/locales/${lang}.json`, 'utf8'))
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ locale: lang, reducedMotion: 'reduce' })
      await context.addInitScript(({ lang, theme }) => {
        localStorage.setItem('ilyakav-lang', lang)
        localStorage.setItem('ilyakav-theme', theme)
      }, { lang, theme })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      let outcome = 'error', sends = 0
      await page.route('**/api/contact', route => {
        sends++
        return route.fulfill({ status: outcome === 'error' ? 502 : 200, contentType: 'application/json', body: JSON.stringify({ ok: outcome === 'success' }) })
      })
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const path of ['/about', '/contact', '/']) {
          await page.goto(base + path, { waitUntil: 'networkidle' })
          await page.waitForFunction(({ lang, theme }) => document.documentElement.lang === lang && document.documentElement.dataset.theme === theme, { lang, theme })
          // Dismiss consent through its real UI for unobstructed screenshots.
          const reject = page.getByRole('button', { name: /^(Отклонить все|Відхилити всі|Reject All)$/ })
          if (await reject.count()) await reject.click()
          await page.evaluate(() => document.fonts.ready)
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${lang} ${theme} ${width} ${path}: overflow`)
          if (path === '/about') {
            assert.equal(await page.locator('h1').textContent(), copy.aboutPage.hero.title)
            const portrait = page.locator('img[src*="ilya-portrait"]')
            await portrait.scrollIntoViewIfNeeded()
            await portrait.evaluate(image => image.decode())
            assert.equal(await portrait.getAttribute('alt'), copy.aboutPage.positioning.portraitAlt)
            assert.ok(await portrait.evaluate(image => Math.abs(image.clientWidth / image.clientHeight - 0.75) < 0.01), 'Portrait is not stretched or cropped')
            await page.screenshot({ path: `${output}/experience-${lang}-${theme}-${width}.png` })
            assert.equal(await page.locator('main a[href^="/case/"]').count(), 3)
            for (const image of await page.locator('main a[href^="/case/"] img').all()) {
              await image.scrollIntoViewIfNeeded(); await image.evaluate(element => element.decode())
            }
            await page.getByText(copy.aboutPage.projectsTitle, { exact: true }).scrollIntoViewIfNeeded()
            await page.screenshot({ path: `${output}/projects-${lang}-${theme}-${width}.png` })
            await page.locator('main a[href="/#work"]').first().click()
            await page.waitForURL('**/#work')
            await page.waitForFunction(lang => document.documentElement.lang === lang, lang)
          } else if (path === '/contact') {
            await page.locator('[name="name"]').fill('Test')
            await page.locator('[name="contact"]').fill('test@example.com')
            await page.locator('[name="brief"]').fill('Local browser verification')
            outcome = 'error'
            await page.locator('[type="submit"]').click()
            await page.locator('form div[role="alert"]').waitFor()
            assert.equal(await page.locator('form [role="status"]').count(), 0)
            outcome = 'unconfirmed'
            await page.locator('[type="submit"]').click()
            await page.locator('form div[role="alert"]').waitFor()
            assert.equal(await page.locator('form [role="status"]').count(), 0)
            outcome = 'success'
            await page.locator('[type="submit"]').click()
            const status = page.locator('form [role="status"]')
            await status.waitFor()
            assert.ok((await status.textContent()).includes(copy.contact.form.sentTitle))
            assert.equal(await page.locator('[name="name"]').inputValue(), '')
            await status.scrollIntoViewIfNeeded()
            await page.screenshot({ path: `${output}/success-${lang}-${theme}-${width}.png` })
          } else {
            for (const key of ['price', 'time', 'existing', 'ownership']) {
              const button = page.getByRole('button', { name: copy.faq.items[key].q, exact: true })
              await button.click()
              assert.equal(await button.getAttribute('aria-expanded'), 'true')
              const id = await button.getAttribute('aria-controls')
              assert.ok((await page.locator(`[id="${id}"]`).textContent()).includes(copy.faq.items[key].a))
              await button.click()
              assert.equal(await button.getAttribute('aria-expanded'), 'false')
            }
            await page.getByText(copy.finalCta.title, { exact: true }).scrollIntoViewIfNeeded()
            await page.screenshot({ path: `${output}/cta-${lang}-${theme}-${width}.png` })
          }
          results.push({ lang, theme, width, path })
        }
      }
      assert.equal(sends, 6)
      assert.deepEqual(errors, [])
      await context.close()
      console.log(`Handoff checked: ${lang} ${theme}`)
    }
  }
} finally {
  await browser.close()
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
}
console.log(`${results.length} page/language/theme/viewport checks passed; all form requests intercepted.`)
