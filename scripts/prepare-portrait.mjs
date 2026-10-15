import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

// Preserve the supplied original in the repository; only these derivatives are served.
const source = await readFile(new URL('../photo_2026-09-05_12-16-01.jpg', import.meta.url))
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage()
  await mkdir(new URL('../public/media/', import.meta.url), { recursive: true })
  for (const width of [480, 768]) {
    const data = await page.evaluate(async ({ source, width }) => {
      const image = new Image()
      image.src = `data:image/jpeg;base64,${source}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = Math.round(width * image.naturalHeight / image.naturalWidth)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/webp', 0.82).split(',')[1]
    }, { source: source.toString('base64'), width })
    await writeFile(new URL(`../public/media/ilya-portrait-${width}.webp`, import.meta.url), Buffer.from(data, 'base64'))
  }
} finally {
  await browser.close()
}
