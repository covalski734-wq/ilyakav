import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:true}),results=[]
try {
 for(const [width,height] of [[390,844],[1440,900],[1920,1080]]) {
  const page=await browser.newPage({viewport:{width,height}})
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'})
  const top=await page.locator('#responsive-demo').evaluate(e=>e.getBoundingClientRect().top+scrollY)
  const distance=height*(width<760?.65:.9)
  for(const progress of [.3,.8,1.1]) {
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+distance*progress)
   await page.waitForTimeout(800)
   const measured=await page.evaluate(()=>{
    const scene=document.querySelector('#responsive-demo'),stage=scene.querySelector('[data-stage]').getBoundingClientRect(),next=scene.querySelector('[class*="Process__Wrapper"]').getBoundingClientRect()
    return {top:stage.top,bottom:stage.bottom,nextTop:next.top,background:getComputedStyle(scene).backgroundColor,gradient:getComputedStyle(scene.querySelector('[data-stage]')).backgroundImage}
   })
   if(progress<1){assert.ok(Math.abs(measured.top)<2);assert.ok(measured.nextTop<height,'Following section should already be visible beneath the pinned stage')}
   assert.ok(Math.abs(measured.nextTop-measured.bottom)<2,'Next section must directly touch the stage during and after pinning')
   assert.equal(measured.background,'rgba(0, 0, 0, 0)')
   assert.equal(measured.gradient,'none')
   results.push({width,height,progress,...measured})
   if(progress>.5)await page.screenshot({path:`artifacts/flow-polish/pinned-${width}-${progress}.png`})
  }
  await page.close()
 }
}finally{await browser.close();await writeFile('artifacts/flow-polish/pinned-boundaries.json',JSON.stringify(results,null,2))}
console.log('Pinned boundaries passed:',results.length)
