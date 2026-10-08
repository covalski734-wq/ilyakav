import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const output=process.env.STICKY_OUTPUT_DIR??'artifacts/sticky-stability',results=[]
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:8787'
const viewports=process.env.STICKY_VIEWPORTS?JSON.parse(process.env.STICKY_VIEWPORTS):[[360,740],[390,844],[430,932],[844,390],[1021,900],[1100,900],[1280,900],[1440,900],[1920,1080]]
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true})
const inspect=async(page,id)=>page.locator(id).evaluate(track=>{
 const rect=track.getBoundingClientRect(),run=parseFloat(getComputedStyle(track,'::after').height)||0
 const sticky=track.querySelector('[data-sticky-scene]').getBoundingClientRect()
 const expected=Math.min(Math.max(rect.top,0),rect.top+run)
 return {y:scrollY,top:sticky.top,expected,error:Math.abs(sticky.top-expected),run,overflow:document.documentElement.scrollWidth-innerWidth,spacers:document.querySelectorAll('.pin-spacer').length}
})
const settled=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
try {
 for(const [width,height] of viewports) {
  for(const lang of ['ru','uk','en']) {
   const page=await browser.newPage({viewport:{width,height},locale:lang}),errors=[]
   page.on('pageerror',e=>errors.push(e.message))
   await page.addInitScript(lang=>localStorage.setItem('ilyakav-lang',lang),lang)
   await page.goto(base+'/',{waitUntil:'networkidle'})
   for(const id of ['#capabilities','#responsive-demo']) {
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await settled(page)
    const geometry=await page.locator(id).evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,run:parseFloat(getComputedStyle(e,'::after').height)}))
    const steps=[-100,-40,-8,0,8,40,100,geometry.run*.5,geometry.run-40,geometry.run-8,geometry.run,geometry.run+8,geometry.run+40,geometry.run+100]
    let maxError=0
    for(const offset of [...steps,...steps.toReversed()]) {
     await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+offset);await settled(page)
     const state=await inspect(page,id)
     maxError=Math.max(maxError,state.error)
     assert.ok(state.error<2,JSON.stringify({width,height,lang,id,offset,...state}))
     assert.ok(state.overflow<=1)
     assert.equal(state.spacers,0)
     if(lang==='ru'&&[390,1440].includes(width)&&[8,geometry.run*.5,geometry.run+8].includes(offset))await page.screenshot({path:`${output}/${id.slice(1)}-${width}-${Math.round(offset)}.png`})
    }
    // Wheel-driven fast entry/backtracking, without waiting for a JS pin to settle.
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top-100)
    for(const delta of [280,700,-440,-500,120]){await page.mouse.wheel(0,delta);await page.waitForTimeout(45);const state=await inspect(page,id);assert.ok(state.error<2);maxError=Math.max(maxError,state.error)}
    results.push({width,height,lang,id,maxError,checks:33})
   }
   assert.deepEqual(errors,[])
   await page.close()
  }
  console.log('Sticky boundaries passed',width,height)
 }
 // Start midway through the scene while fonts/images are still arriving.
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}})
  await page.route(/\.(woff2|webp|jpg)(\?.*)?$/,async route=>{await new Promise(r=>setTimeout(r,1300));await route.continue()})
  await page.goto(base+'/#responsive-demo',{waitUntil:'domcontentloaded'})
  await page.waitForSelector('#responsive-demo [data-sticky-scene]')
  await page.locator('#responsive-demo').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY+100,behavior:'instant'}))
  for(let i=0;i<30;i++){await page.waitForTimeout(70);const s=await inspect(page,'#responsive-demo');assert.ok(s.error<2,JSON.stringify(s))}
  for(const nextWidth of [width===390?1440:390,width]){
   await page.setViewportSize({width:nextWidth,height:844});await page.waitForTimeout(350)
   const s=await inspect(page,'#responsive-demo');assert.ok(s.error<2,JSON.stringify(s));assert.ok(s.overflow<=1)
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200)
  assert.equal(await page.locator('#responsive-demo [data-sticky-scene]').evaluate(e=>getComputedStyle(e).position),'relative')
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(200)
  assert.ok((await inspect(page,'#responsive-demo')).error<2)
  results.push({coldLoadWidth:width,lateAssets:true,resize:true,reducedMotion:true})
  await page.close()
 }
} finally {await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))}
console.log('Stable scene/language/viewport combinations:',results.length)
