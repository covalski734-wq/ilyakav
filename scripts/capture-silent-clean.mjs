import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
await mkdir('public/media/cases/silent', { recursive: true })
// [name, width, height, selector to scroll to (null = top), offset above it]
const only = process.argv.slice(2)
const shots = [
 ['desktop', 1440, 960, null, 0],
 ['services', 1440, 960, '#services', 20],
 ['projects', 1440, 960, 'text=See the Difference', 120],
 ['mobile', 390, 844, null, 0],
 ['contact', 390, 1100, 'text=Ready for a spotless space? >> visible=true', 90],
]
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
 await page.goto('https://silentclean.ca/', { waitUntil: 'load', timeout: 90000 })
 await page.evaluate(() => document.fonts.ready)
 await page.waitForTimeout(2500)
 for (const [name, width, height, selector, offset] of shots.filter(([name]) => !only.length || only.includes(name))) {
  await page.setViewportSize({ width, height }); await page.waitForTimeout(400)
  // Scroll through once so lazy images and entrance animations settle.
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } })
  if (selector) await page.locator(selector).first().evaluate((el, offset) => scrollTo(0, el.getBoundingClientRect().top + scrollY - offset), offset)
  else await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(1200)
  const png = await page.screenshot()
  const encoded = await page.evaluate(async source => { const image = new Image(); image.src = 'data:image/png;base64,' + source; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height; canvas.getContext('2d').drawImage(image, 0, 0); return canvas.toDataURL('image/webp', .85).split(',')[1] }, png.toString('base64'))
  await writeFile(`public/media/cases/silent/${name}.webp`, Buffer.from(encoded, 'base64'))
 }
} finally { await browser.close() }
