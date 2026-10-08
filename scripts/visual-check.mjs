import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:8787'
const output = process.env.TEST_OUTPUT_DIR ?? 'artifacts/verification-2026-10-07'
await mkdir(output, {recursive:true})
const browser = await chromium.launch({headless:true})
const contrast = [], layout = [], bundles = []
try {
  for (const theme of ['light','dark']) {
    const context = await browser.newContext({viewport:{width:1440,height:900},locale:'en',reducedMotion:'reduce'})
    await context.addInitScript(mode => {localStorage.setItem('ilyakav-theme',mode);localStorage.setItem('ilyakav-lang','en')},theme)
    const page = await context.newPage()
    await page.goto(base, {waitUntil:'networkidle'})
    const measurements = await page.evaluate(() => {
      const rgba = value => {const c=value.match(/[\d.]+/g)?.map(Number) ?? [0,0,0,0];return [c[0],c[1],c[2],c[3]??1]}
      const blend = (front,back) => front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3]))
      const luminance = color => color.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)
      const selectors = {language:'header [data-lang] button[aria-pressed="false"]',process:'[class*="Process__StepIndex"]',email:'[class*="FinalCta__SoftLink"]',footer:'[class*="Footer__DirectLabel"]'}
      return Object.entries(selectors).map(([name,selector])=>{
        const element=document.querySelector(selector), chain=[]
        for(let node=element;node;node=node.parentElement)chain.unshift(node)
        let background=[255,255,255]
        for(const node of chain)background=blend(rgba(getComputedStyle(node).backgroundColor),background)
        const style=getComputedStyle(element),color=rgba(style.color);color[3]*=Number(style.opacity)
        const foreground=blend(color,background), l1=luminance(foreground), l2=luminance(background)
        return {name,foreground,background,ratio:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}
      })
    })
    for (const measurement of measurements) {contrast.push({theme,...measurement});assert.ok(measurement.ratio>=4.5, `${theme} ${measurement.name}: ${measurement.ratio}`)}
    await page.locator('#work').evaluate(element=>element.scrollIntoView({block:'start'}))
    await page.waitForFunction(()=>[...document.querySelectorAll('#work img')].every(image=>image.complete&&image.naturalWidth>0))
    await page.waitForTimeout(500)
    await page.screenshot({path:`${output}/portfolio-${theme}-1440.png`})
    await context.close()
  }
  for (const width of [360,390,430,1021,1100,1280,1366,1440,1920]) {
    const context=await browser.newContext({viewport:{width,height:width<760?844:900},locale:'en'})
    const page=await context.newPage(), errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto(base,{waitUntil:'networkidle'});await page.waitForTimeout(300)
    const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,workY:document.querySelector('#work').getBoundingClientRect().top+scrollY,servicesY:document.querySelector('#services').getBoundingClientRect().top+scrollY,demos:[...document.querySelectorAll('[class*="LaptopScene__Stage"], [class*="MorphScene__Stage"]')].map(element=>element.getBoundingClientRect().top+scrollY)}))
    layout.push(measurements)
    assert.ok(measurements.scrollWidth<=width+1)
    assert.ok(measurements.demos[0]<measurements.workY&&measurements.workY<measurements.servicesY&&measurements.servicesY<measurements.demos[1])
    assert.equal(await page.locator('#capabilities [data-sticky-scene]').evaluate(e=>getComputedStyle(e).position),'sticky')
    assert.equal(await page.locator('.pin-spacer').count(),0,'Scenes must not inject JS pin spacers')
    if(width===390||width===1440){
      for(const scene of ['LaptopScene','MorphScene']){
        await page.locator(`[class*="${scene}__Stage"]`).evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+scrollY+innerHeight*.6,behavior:'instant'}))
        await page.waitForTimeout(1000)
        await page.screenshot({path:`${output}/${scene}-${width}.png`})
      }
    }
    await page.goto(base+'/contact',{waitUntil:'networkidle'});await page.waitForTimeout(300)
    measurements.contactFieldY=await page.locator('[name="name"]').evaluate(element=>element.getBoundingClientRect().top+scrollY)
    if(width===390||width===1440)await page.screenshot({path:`${output}/contact-motion-${width}.png`})
    assert.equal(errors.length,0,errors.join(';'))
    await context.close()
  }
  for(const path of ['/','/contact','/privacy','/services/business-websites','/case/maryna-cleaning']) {
    const context=await browser.newContext(), page=await context.newPage(), scripts=new Set()
    page.on('request',request=>{if(request.resourceType()==='script')scripts.add(new URL(request.url()).pathname)})
    await page.goto(base+path,{waitUntil:'networkidle'})
    let raw=0,gzip=0
    for(const script of scripts){const bytes=await readFile('dist'+script);raw+=bytes.length;gzip+=gzipSync(bytes).length}
    bundles.push({path,raw,gzip,scripts:[...scripts]})
    if(path!=='/')assert.ok(![...scripts].some(script=>script.includes('HomePage-')))
    await context.close()
  }
} finally { await browser.close();await writeFile(`${output}/visual-results.json`,JSON.stringify({contrast,layout,bundles},null,2)) }
console.log(JSON.stringify({contrast:contrast.map(({theme,name,ratio})=>({theme,name,ratio:Number(ratio.toFixed(2))})),layout,bundles},null,2))
