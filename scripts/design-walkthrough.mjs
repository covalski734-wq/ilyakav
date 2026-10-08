import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const output = 'artifacts/design-review-2026-10-07'
const browser = await chromium.launch({headless:true})
const results = []
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport:{width,height:width===390?844:900}, locale:'ru' })
    await context.addInitScript(()=>localStorage.setItem('ilyakav-lang','ru'))
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'})
    for (const [name, selector] of [['hero','#top'],['tasks','#range'],['demo','#capabilities'],['work','#work'],['services','#services']]) {
      await page.locator(selector).evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-90,behavior:'instant'}))
      await page.waitForTimeout(1000)
      await page.screenshot({path:`${output}/updated-${name}-${width}.png`})
    }
    const tasks = await page.locator('#range a').evaluateAll(links=>links.map(a=>({label:a.textContent,href:a.getAttribute('href')})))
    for (const link of tasks) assert.equal((await page.request.get('http://127.0.0.1:8787'+link.href)).status(),200)
    await page.goto('http://127.0.0.1:8787/#work',{waitUntil:'networkidle'})
    await page.waitForTimeout(1200)
    const anchor = await page.locator('#work').boundingBox()
    assert.ok(anchor.y>=-1 && anchor.y<180,`Work anchor: ${anchor.y}`)
    results.push({width,tasks,workAnchorY:anchor.y})
    await context.close()
  }
  for (const [name,url,width] of [['dennis','https://dennissnellenberg.com/',1440],['sakori','https://sakori.pl/en/',390],['prox','https://proxdigital.pl/',390]]) {
    const page = await browser.newPage({viewport:{width,height:900},locale:'en'})
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000})
      await page.waitForTimeout(7000)
      await page.screenshot({path:`${output}/${name}-settled-${width}.png`})
      results.push({name,width,title:await page.title()})
    } catch (error) { results.push({name,error:error.message}) }
    await page.close()
  }
} finally {
  await browser.close()
  await writeFile(`${output}/walkthrough.json`,JSON.stringify(results,null,2))
}
console.log(JSON.stringify(results,null,2))
