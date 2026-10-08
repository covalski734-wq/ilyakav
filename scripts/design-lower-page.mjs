import { chromium } from 'playwright'
const browser = await chromium.launch({headless:true})
try {
  for (const width of [390,1440]) {
    const page = await browser.newPage({viewport:{width,height:900},locale:'ru',reducedMotion:'reduce'})
    await page.addInitScript(()=>localStorage.setItem('ilyakav-lang','ru'))
    await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'})
    for (const [name,selector] of [['next-step','[class*="Services__NextStep"]'],['process','[class*="Process__Wrapper"]'],['ownership','#ownership'],['team','#about'],['faq','#faq'],['closing','[class*="FinalCta__Wrapper"]']]) {
      await page.locator(selector).evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-90,behavior:'instant'}))
      await page.waitForTimeout(250)
      await page.screenshot({path:`artifacts/design-review-2026-10-07/updated-${name}-${width}.png`})
    }
    await page.close()
  }
} finally {await browser.close()}
