import {chromium} from 'playwright'
import {writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:true})
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}})
 await page.goto('https://abfpay.com/en/personal/cards',{waitUntil:'domcontentloaded'})
 await page.waitForTimeout(3500)
 const frames=[]
 for(const y of [0,700,1400,2100,2800,3500]) {
  await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(1100)
  await page.screenshot({path:`artifacts/laptop-motion/reference-${y}.png`})
  frames.push({y,sticky:await page.locator('body *').evaluateAll(es=>es.filter(e=>['sticky','fixed'].includes(getComputedStyle(e).position)).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,90),top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height})).slice(0,25))})
 }
 await writeFile('artifacts/laptop-motion/reference.json',JSON.stringify(frames,null,2))
} finally {await browser.close()}
