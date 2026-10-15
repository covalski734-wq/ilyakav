import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
await mkdir('public/media/cases/silent', { recursive: true })
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
 await page.goto('https://silentclean.ca/', { waitUntil: 'networkidle' })
 await page.evaluate(() => document.fonts.ready)
 await page.waitForTimeout(1500)
 for (const [name,width,height] of [['desktop',1440,960],['mobile',390,844]]) {
  await page.setViewportSize({width,height}); await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(600)
  const png=await page.screenshot()
  const encoded=await page.evaluate(async source=>{const image=new Image();image.src='data:image/png;base64,'+source;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/webp',.85).split(',')[1]},png.toString('base64'))
  await writeFile(`public/media/cases/silent/${name}.webp`,Buffer.from(encoded,'base64'))
 }
} finally {await browser.close()}
