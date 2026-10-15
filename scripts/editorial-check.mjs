import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const output='artifacts/verification-2026-10-13/editorial'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined})
const results=[]
try {
 for(const lang of ['ru','uk','en']) for(const theme of ['light','dark']) {
  const context=await browser.newContext({locale:lang,reducedMotion:'reduce'})
  await context.addInitScript(({lang,theme})=>{localStorage.setItem('ilyakav-lang',lang);localStorage.setItem('ilyakav-theme',theme)},{lang,theme})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.route('**/api/contact',route=>route.abort())
  for(const width of [390,1440]) for(const path of ['/','/case/silent-clean','/services/web-applications']) {
   await page.setViewportSize({width,height:900})
   const response=await page.goto('http://127.0.0.1:8787'+path,{waitUntil:'networkidle'})
   assert.equal(response.status(),200)
   await page.waitForFunction(lang=>document.documentElement.lang===lang,lang)
   const reject=page.getByRole('button',{name:/^(Отклонить все|Відхилити всі|Reject All)$/})
   if(await reject.count())await reject.click()
   await page.evaluate(()=>document.fonts.ready)
   const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,headings:[...document.querySelectorAll('h1,h2,h3')].filter(e=>e.getClientRects().length).filter(e=>{const r=document.createRange();r.selectNodeContents(e);return [...r.getClientRects()].some(r=>r.left < -1 || r.right>innerWidth+1)}).map(e=>e.textContent)}))
   assert.equal(geometry.overflow,false,`${lang} ${theme} ${width} ${path}`)
   assert.deepEqual(geometry.headings,[],`${lang} ${theme} ${width} ${path}`)
   if(path==='/') {
    assert.equal(await page.locator('[class*="LaptopScene__Stage"]').count(),0)
    assert.equal(await page.locator('#work a[href="/case/tile-expert-solutions"]').count(),0)
    assert.equal(await page.locator('#work a[href="/case/silent-clean"]').count(),1)
    await page.screenshot({path:`${output}/hero-${lang}-${theme}-${width}.png`})
    for(const selector of ['#work','#ownership','#about','[class*="Process__Wrapper"]']) {
     const section=page.locator(selector);await section.scrollIntoViewIfNeeded()
     await page.waitForTimeout(300)
     for(const img of await section.locator('img').all())await img.evaluate(img=>img.decode())
     await section.screenshot({path:`${output}/${selector.includes('Process')?'process':selector.slice(1)}-${lang}-${theme}-${width}.png`})
    }
   } else if(path==='/case/silent-clean') {
    assert.equal(await page.locator('h1').textContent(),'Silent Clean')
    assert.equal(await page.locator('a[href="https://silentclean.ca/"]').count(),1)
    for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(img=>img.decode())}
   } else {
    assert.equal(await page.locator('#capabilities').count(),1)
    assert.equal(await page.locator('#capabilities a[href="/#work"]').count(),1)
    await page.locator('#capabilities').scrollIntoViewIfNeeded()
    await page.screenshot({path:`${output}/app-${lang}-${theme}-${width}.png`})
   }
   results.push({lang,theme,width,path})
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`Editorial: ${lang} ${theme}`)
 }
}finally{await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))}
console.log(`${results.length} editorial checks passed`)
