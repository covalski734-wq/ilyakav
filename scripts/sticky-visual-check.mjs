import {chromium} from 'playwright'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({headless:true}),results=[],failures=[]
try {
 for(const [width,height] of [[360,640],[390,844],[430,932],[844,390],[1021,768],[1440,900]]) {
  for(const lang of ['ru','uk','en']) {
   const page=await browser.newPage({viewport:{width,height},locale:lang})
   await page.addInitScript(l=>localStorage.setItem('ilyakav-lang',l),lang)
   await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'})
   for(const progress of [.02,.95]){
    await page.locator('#responsive-demo').evaluate((e,p)=>scrollTo({top:e.getBoundingClientRect().top+scrollY+parseFloat(getComputedStyle(e,'::after').height)*p,behavior:'instant'}),progress)
    await page.waitForTimeout(100)
    const boxes=await page.locator('#responsive-demo').evaluate(e=>{
     const box=n=>{const b=n.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right}}
     return {stage:box(e.querySelector('[data-stage]')),header:box(document.querySelector('header')),items:[...e.querySelectorAll('[class*="MorphScene__Title"],[class*="MorphScene__Copy-"],[data-frame],[class*="MorphScene__ViewportLabel"]')].map(n=>({name:n.className,...box(n)}))}
    })
    for(const item of boxes.items)if(item.top<boxes.header.bottom-1||item.bottom>boxes.stage.bottom+1||item.left<0||item.right>width+1)failures.push({width,height,lang,progress,item,stage:boxes.stage,header:boxes.header})
    results.push({width,height,lang,progress,...boxes})
    if(lang==='ru'&&progress===.95)await page.screenshot({path:`artifacts/sticky-stability/final-morph-${width}.png`})
   }
   await page.close()
  }
 }
}finally{await browser.close();await writeFile('artifacts/sticky-stability/content-bounds.json',JSON.stringify({results,failures},null,2))}
console.log(JSON.stringify(failures,null,2));assert.equal(failures.length,0)
