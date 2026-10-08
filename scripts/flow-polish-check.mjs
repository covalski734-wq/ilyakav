import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const output='artifacts/flow-polish',results=[]
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true})
try {
 for(const [width,height] of [[390,844],[1440,900],[1920,1080]]) {
  for(const theme of ['light','dark']) {
   const page=await browser.newPage({viewport:{width,height},locale:'en'}), errors=[]
   page.on('pageerror',e=>errors.push(e.message))
   await page.addInitScript(theme=>{localStorage.setItem('ilyakav-theme',theme);localStorage.setItem('ilyakav-lang','en')},theme)
   await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'})
   const top=await page.locator('#capabilities').evaluate(e=>e.getBoundingClientRect().top+scrollY)
   const distance=height*(width<760?1.45:1.85),positions=[]
   for(const progress of [.2,.24,.28,.32,.6,.64,.68,.72]) {
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+distance*progress)
    await page.waitForTimeout(650)
    positions.push(await page.locator('[data-strip]').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m42))
   }
   for(let i=1;i<positions.length;i++)assert.ok(positions[i]<positions[i-1]-5,'Interface must keep moving between caption changes')
   const deltas=[1,2,3,5,6,7].map(i=>positions[i-1]-positions[i])
   assert.ok(Math.max(...deltas)/Math.min(...deltas)<1.08,'Scroll should have a constant pace')
   await page.locator('#services').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-100,behavior:'instant'}))
   await page.waitForTimeout(400)
   if(width>760) {
    const preview=page.locator('[class*="Services__Preview"]').filter({has:page.locator('[data-service-preview]')}).first()
    const beforeHeight=(await preview.boundingBox()).height
    await page.locator('#services button').nth(2).hover()
    await page.waitForTimeout(100)
    const fading=await page.locator('[data-service-preview="redesign"]').evaluate(e=>+getComputedStyle(e).opacity)
    assert.ok(fading>0&&fading<1,`Expected transition, got ${fading}`)
    await page.waitForTimeout(420)
    assert.ok(Math.abs((await preview.boundingBox()).height-beforeHeight)<1,'Preview height must remain stable')
    for(const index of [3,4,1])await page.locator('#services button').nth(index).hover()
    await page.mouse.move(width-10,100)
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-service-preview="landing"]')).opacity==='1')
    assert.equal(await page.locator('[data-service-preview="landing"]').evaluate(e=>+getComputedStyle(e).opacity),1)
    assert.equal(await page.locator('[data-service-preview][aria-hidden="true"] a:not([tabindex="-1"])').count(),0)
   } else {
    await page.locator('#services button').nth(2).click()
    await page.waitForTimeout(500)
    assert.equal(await page.locator('#services button').nth(2).getAttribute('aria-expanded'),'true')
   }
   await page.screenshot({path:`${output}/services-${width}-${theme}.png`})
   for(const [name,selector] of [['boundary','[class*="Services__NextStep"]'],['morph','#responsive-demo'],['team','#about']]) {
    await page.locator(selector).evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-110,behavior:'instant'}))
    await page.waitForTimeout(650)
    await page.screenshot({path:`${output}/${name}-${width}-${theme}.png`})
   }
   const spacing=await page.evaluate(()=>{
    const demoElement=document.querySelector('#responsive-demo')
    const services=document.querySelector('#services').getBoundingClientRect(),cta=document.querySelector('[class*="Services__NextStep"]').getBoundingClientRect(),demo=(demoElement.parentElement.classList.contains('pin-spacer')?demoElement.parentElement:demoElement).getBoundingClientRect()
    const stage=getComputedStyle(document.querySelector('#responsive-demo [data-stage]'))
    return {servicesBottomPadding:services.bottom-cta.bottom,sectionGap:demo.top-services.bottom,servicesBackground:getComputedStyle(document.querySelector('#services')).backgroundColor,demoBackground:stage.backgroundColor,demoImage:stage.backgroundImage,scrollWidth:document.documentElement.scrollWidth}
   })
   assert.ok(spacing.servicesBottomPadding<=57&&spacing.sectionGap<=17)
   assert.ok(spacing.scrollWidth<=width+1)
   assert.notEqual(spacing.demoBackground,spacing.servicesBackground)
   assert.equal(spacing.demoImage,'none')
   await page.emulateMedia({reducedMotion:'reduce'})
   await page.waitForTimeout(200)
   if(width>760){await page.locator('#services button').nth(4).hover();assert.equal(await page.locator('[data-service-preview="desktop"]').evaluate(e=>+getComputedStyle(e).opacity),1)}
   assert.equal(errors.length,0,errors.join(';'))
   results.push({width,height,theme,positions,spacing})
   await page.close()
  }
  console.log('Passed flow',width)
 }
} finally {await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))}
