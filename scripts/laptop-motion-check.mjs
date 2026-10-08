import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {writeFile,mkdir} from 'node:fs/promises'
const output=process.env.TEST_OUTPUT_DIR??'artifacts/laptop-motion'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true}), results=[]
try {
 for(const [width,height] of [[844,390],[1440,900],[360,740],[390,844],[430,932],[1021,900]]) {
  for(const language of ['ru','uk','en']) {
   const page=await browser.newPage({viewport:{width,height},locale:language}),errors=[]
   page.on('pageerror',e=>errors.push(e.message))
   await page.addInitScript(l=>localStorage.setItem('ilyakav-lang',l),language)
   await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'})
   const top=await page.locator('#capabilities').evaluate(e=>e.getBoundingClientRect().top+scrollY)
   const distance=height*(width<=760||height<=600?1.45:1.85)
   for(const [progress,active] of [[.22,0],[.53,1],[.88,2],[.53,1],[.22,0]]) {
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+distance*progress)
    await page.waitForTimeout(900)
    const frame=await page.evaluate(()=>{
     const stage=document.querySelector('#capabilities [data-stage]').getBoundingClientRect()
     const notes=[...document.querySelectorAll('[data-chapter]')].map(e=>({opacity:+getComputedStyle(e).opacity,hidden:e.getAttribute('aria-hidden'),top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}))
     return {stageTop:stage.top,notes,scrollWidth:document.documentElement.scrollWidth,screenY:new DOMMatrix(getComputedStyle(document.querySelector('[data-strip]')).transform).m42}
    })
    results.push({width,height,language,progress,...frame})
    assert.ok(Math.abs(frame.stageTop)<2,JSON.stringify({width,height,frame}))
    assert.ok(frame.scrollWidth<=width+1)
    assert.ok(frame.notes[active].opacity>.98 && frame.notes[active].hidden==='false')
    assert.ok(frame.notes[active].top>=80&&frame.notes[active].bottom<=height-15,`Caption outside viewport ${width} ${height}: ${JSON.stringify(frame.notes[active])}`)
    assert.ok(frame.notes.filter(n=>n.opacity>.1).length===1)
    if(language==='ru'&&[390,844,1440].includes(width))await page.screenshot({path:`${output}/laptop-${width}-${active}.png`})
   }
   await page.locator('#capabilities a[href="#work"]').click()
   await page.waitForTimeout(1000)
   const work=await page.locator('#work').boundingBox()
   assert.ok(work.y>=0&&work.y<180)
   await page.emulateMedia({reducedMotion:'reduce'})
   await page.waitForTimeout(400)
   assert.equal(await page.locator('#capabilities .pin-spacer').count(),0)
   for(const note of await page.locator('[data-chapter]').all()) {
    assert.equal(await note.evaluate(e=>getComputedStyle(e).opacity),'1')
    assert.notEqual(await note.getAttribute('aria-hidden'),'true')
   }
   assert.equal(errors.length,0,errors.join(';'))
   await page.close()
  }
  console.log('Passed laptop',width,height)
 }
} finally {
 await browser.close()
 await writeFile(`${output}/laptop-results.json`,JSON.stringify(results,null,2))
}
console.log('Motion frames checked:',results.length)
