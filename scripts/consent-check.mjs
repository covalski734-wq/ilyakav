import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const base=process.env.TEST_BASE_URL??'http://localhost:5187'
const configured=process.env.EXPECT_GTM!=='false'
const output=`artifacts/consent/${configured?'configured':'disabled'}`
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[]
const key='ilyakav-consent'
const optional=/googletagmanager|google-analytics|doubleclick|facebook\.net|facebook\.com\/tr/
async function setup(viewport={width:1440,height:900},lang='en',theme='light',stored){
 const context=await browser.newContext({viewport,locale:lang,reducedMotion:'reduce'})
 await context.addInitScript(({lang,theme,key,stored})=>{localStorage.setItem('ilyakav-lang',lang);localStorage.setItem('ilyakav-theme',theme);if(stored)localStorage.setItem(key,JSON.stringify(stored))},{lang,theme,key,stored})
 const page=await context.newPage(),requests=[],errors=[]
 page.on('request',r=>{if(optional.test(r.url()))requests.push(r.url())})
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({contentType:'application/javascript',body:'window.__mockGtmLoaded = true;'}))
 await page.goto(base+'/cookies',{waitUntil:'networkidle'})
 await page.getByRole('button',{name:lang==='en'?'Accept All':lang==='ru'?'Принять все':'Прийняти всі',exact:true}).waitFor()
 return {context,page,requests,errors}
}
const records=page=>page.evaluate(()=>window.dataLayer.map(x=>x.event?x:Array.from(x)))
const settings=page=>page.locator('footer').getByRole('button',{name:'Cookie Settings',exact:true}).click()
try {
 for(const [name,analytics,marketing] of [['reject',false,false],['accept',true,true],['analytics',true,false],['marketing',false,true]]){
  const {context,page,requests,errors}=await setup()
  assert.equal(requests.length,0)
  assert.deepEqual((await context.cookies()).filter(c=>/^(_ga|_gcl|_fb)/.test(c.name)),[])
  const initial=await records(page)
  assert.deepEqual(initial[0],['consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}])
  if(name==='reject'||name==='accept')await page.getByRole('button',{name:name==='reject'?'Reject All':'Accept All',exact:true}).click()
  else {
   await page.getByRole('button',{name:'Customize',exact:true}).click()
   await page.locator(`#consent-${name}`).check()
   await page.getByRole('button',{name:'Save preferences',exact:true}).click()
  }
  await page.waitForTimeout(200)
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)
  assert.equal(saved.analytics,analytics);assert.equal(saved.marketing,marketing);assert.equal(saved.version,1);assert.ok(Date.parse(saved.chosenAt))
  assert.equal(await page.locator('[data-cookie-banner]').count(),0)
  assert.equal(requests.length,configured&&(analytics||marketing)?1:0)
  let log=await records(page)
  assert.equal(log.filter(x=>x.event==='page_view').length,configured&&analytics?1:0)
  const signals=log.filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2]
  assert.equal(signals.analytics_storage,analytics?'granted':'denied');for(const field of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(signals[field],marketing?'granted':'denied')
  if(configured&&(analytics||marketing))assert.ok(log.findIndex(x=>x[0]==='consent'&&x[1]==='update'&&Object.values(x[2]).includes('granted'))<log.findIndex(x=>x.event==='gtm.js'))
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-cookie-banner]').count(),0)
  log=await records(page);assert.equal(log.filter(x=>x.event==='page_view').length,configured&&analytics?1:0)
  await settings(page)
  assert.equal(await page.locator('#consent-analytics').isChecked(),analytics)
  assert.equal(await page.locator('#consent-marketing').isChecked(),marketing)
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0)
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Cookie Settings')
  // Cookies from a previous session: withdrawal must clean both root and parent domain.
  await context.addCookies([{name:'_ga_test',value:'test',url:base},{name:'_fbp',value:'test',url:base}])
  await settings(page)
  await page.getByRole('button',{name:'Reject All',exact:true}).click()
  await page.waitForTimeout(600)
  assert.equal((await context.cookies()).filter(c=>/^(_ga|_fbp)/.test(c.name)).length,0)
  assert.deepEqual(errors,[])
  results.push({name,analytics,marketing,passed:true});await context.close()
 }
 // Upgrades, malformed/expired/future consent must fail closed.
 for(const stored of [{version:0,chosenAt:new Date().toISOString(),analytics:true,marketing:true},{version:1,chosenAt:'2020-01-01',analytics:true,marketing:true},{version:1,chosenAt:'2999-01-01',analytics:true,marketing:true},{version:1,chosenAt:new Date().toISOString(),analytics:'true',marketing:true}]){
  const s=await setup(undefined,'en','light',stored);assert.equal(s.requests.length,0);results.push({invalid:stored,passed:true});await s.context.close()
 }
 // Visual sizes/themes/languages; keyboard focus remains in the native modal.
 for(const [width,height,lang,theme] of [[360,640,'ru','light'],[390,844,'uk','dark'],[844,390,'en','light'],[1440,900,'en','light'],[1440,900,'ru','dark']]){
  const s=await setup({width,height},lang,theme),{page}=s
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:`${output}/banner-${width}-${lang}-${theme}.png`})
  await page.locator('[data-cookie-banner] button').nth(2).click()
  for(let i=0;i<15;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>!!document.activeElement.closest('dialog')))}
  await page.screenshot({path:`${output}/settings-${width}-${lang}-${theme}.png`})
  const b=await page.locator('dialog').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1)
  results.push({width,height,lang,theme,passed:true});await s.context.close()
 }
 // Events are not replayed; query/form PII never enters dataLayer. Real delivery is mocked.
 {
  const {context,page}=await setup()
  await page.getByRole('button',{name:'Reject All',exact:true}).click()
  await page.goto(base+'/contact?email=private-test@example.com',{waitUntil:'networkidle'})
  await page.route('**/api/contact',route=>route.fulfill({contentType:'application/json',body:'{"ok":true}'}))
  const fill=async()=>{await page.locator('[name=name]').fill('Private Test');await page.locator('[name=contact]').fill('private-test@example.com');await page.locator('[name=brief]').fill('Confidential test brief');await page.locator('button[type=submit]').click();await page.locator('form[aria-busy=false]').waitFor()}
  await fill();assert.equal((await records(page)).filter(x=>x.event==='generate_lead').length,0)
  await settings(page);await page.locator('#consent-analytics').check();await page.getByRole('button',{name:'Save preferences',exact:true}).click()
  await fill()
  await page.locator('header a[href="/contact"]').first().evaluate(link=>{link.addEventListener('click',e=>e.preventDefault(),{once:true});link.click()})
  const log=await records(page)
  assert.equal(log.filter(x=>x.event==='cta_click').length,configured?1:0)
  assert.equal(log.filter(x=>x.event==='generate_lead').length,configured?1:0)
  assert.equal(log.filter(x=>x.event==='page_view').length,configured?1:0)
  assert.ok(!JSON.stringify(log).includes('private-test'));assert.ok(!JSON.stringify(log).includes('Confidential'))
  await page.route('**/api/contact',route=>route.fulfill({status:500,contentType:'application/json',body:'{"error":"test"}'}))
  await fill();assert.equal((await records(page)).filter(x=>x.event==='generate_lead').length,configured?1:0)
  // A second tab withdrawing consent stops this tab too.
  const other=await context.newPage();await other.goto(base+'/cookies',{waitUntil:'networkidle'})
  await other.locator('footer').getByRole('button',{name:'Cookie Settings',exact:true}).click();await other.getByRole('button',{name:'Reject All',exact:true}).click()
  await page.waitForTimeout(600);assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).analytics,key),false)
  if(configured)assert.equal((await records(page)).filter(x=>x.event==='page_view').length,0)
  results.push({eventsAndCrossTab:true,passed:true});await context.close()
 }
 // Storage failures keep this page usable and show an explicit persistence notice.
 {
  const {context,page}=await setup()
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')}})
  await page.getByRole('button',{name:'Reject All',exact:true}).click()
  await page.getByRole('status').filter({hasText:'could not save'}).waitFor()
  results.push({blockedStorage:true,passed:true});await context.close()
 }
 // Image previews stay in the same page and restore keyboard focus.
 {
  const {context,page}=await setup({width:390,height:844})
  await page.getByRole('button',{name:'Reject All',exact:true}).click()
  await page.goto(base+'/case/maryna-cleaning',{waitUntil:'networkidle'})
  const link=page.locator('[data-lightbox]').first();await link.focus();await page.keyboard.press('Enter')
  await page.locator('dialog[open] img').waitFor();assert.equal(context.pages().length,1)
  assert.ok(page.url().includes('/case/maryna-cleaning'))
  await page.screenshot({path:`${output}/lightbox-390.png`})
  await page.getByRole('button',{name:'Zoom / fit',exact:true}).click()
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0)
  assert.ok(await link.evaluate(e=>document.activeElement===e))
  results.push({lightbox:true,passed:true});await context.close()
 }
}finally{await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))}
console.log('Consent scenarios passed:',results.length)
