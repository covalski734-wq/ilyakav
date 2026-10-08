import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
await mkdir('artifacts/flow-polish',{recursive:true})
const browser=await chromium.launch({headless:true})
try {
 const page=await browser.newPage({viewport:{width:1440,height:900},locale:'en',reducedMotion:'reduce'})
 await page.goto('https://ilyakav.com/',{waitUntil:'networkidle',timeout:30000})
 const colors=await page.locator('section,[class*="MorphScene__Stage"],[class*="LaptopScene__Stage"]').evaluateAll(es=>es.map(e=>({name:e.id||e.className,background:getComputedStyle(e).backgroundColor,image:getComputedStyle(e).backgroundImage})))
 await writeFile('artifacts/flow-polish/original-palette.json',JSON.stringify(colors,null,2))
 for(const [name,selector] of [['services','#services'],['morph','[class*="MorphScene__Stage"]']]) {
  await page.locator(selector).evaluate(e=>e.scrollIntoView())
  await page.waitForTimeout(500)
  await page.screenshot({path:`artifacts/flow-polish/original-${name}.png`})
 }
 console.log(JSON.stringify(colors,null,2))
} finally {await browser.close()}
