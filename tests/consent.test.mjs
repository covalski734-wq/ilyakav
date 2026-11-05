import test from 'node:test'
import assert from 'node:assert/strict'
import {parseConsent,consentSignals,CONSENT_MAX_AGE,CONSENT_VERSION} from '../src/lib/consent.ts'
test('consent accepts only current, well-formed, unexpired choices',()=>{
 const now=Date.now(),choice={version:CONSENT_VERSION,chosenAt:new Date(now).toISOString(),analytics:true,marketing:false}
 const parse=(value,time=now)=>parseConsent(JSON.stringify(value),time)
 assert.deepEqual(parse(choice),choice)
 assert.equal(parse(choice,now+CONSENT_MAX_AGE),null)
 assert.equal(parse({...choice,version:0}),null)
 assert.equal(parse({...choice,analytics:'true'}),null)
 assert.equal(parse({...choice,chosenAt:new Date(now+1).toISOString()}),null)
 assert.equal(parse({...choice,chosenAt:'not a date'}),null)
 assert.equal(parseConsent('{broken'),null);assert.equal(parseConsent(null),null)
})
test('all four v2 signals map independently to analytics and marketing',()=>{
 for(const analytics of [false,true])for(const marketing of [false,true]){
  const state=consentSignals({analytics,marketing})
  assert.equal(state.analytics_storage,analytics?'granted':'denied')
  for(const field of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(state[field],marketing?'granted':'denied')
  assert.equal(Object.keys(state).length,4)
 }
})


test('existing container and email events respect analytics consent', async () => {
 const {initConsent,saveConsent,trackEvent}=await import('../src/lib/consent.ts')
 const scripts=[]
 const previous={}
 for(const key of ['window','document','location','localStorage'])previous[key]=Object.getOwnPropertyDescriptor(globalThis,key)
 const mock={
  window:{addEventListener(){}},
  document:{cookie:'',querySelector(){return null},createElement(){return {}},head:{append(script){scripts.push(script)}},addEventListener(){}},
  location:{hostname:'ilyakav.com',origin:'https://ilyakav.com',pathname:'/contact',protocol:'https:',search:''},
  localStorage:{getItem(){return null},setItem(){}}
 }
 try {
  for(const [key,value] of Object.entries(mock))Object.defineProperty(globalThis,key,{value,configurable:true})
  initConsent()
  trackEvent('cta_click','email')
  assert.equal(scripts.length,0)
  assert.equal(window.dataLayer.filter(item=>item.event==='cta_click').length,0)
  saveConsent({analytics:true,marketing:false})
  assert.equal(scripts.length,1)
  assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-TKPFHC7B')
  trackEvent('cta_click','email')
  assert.deepEqual(window.dataLayer.filter(item=>item.event==='cta_click'),[{
   event:'cta_click',action:'email',page_path:'/contact',page_location:'https://ilyakav.com/contact',page_referrer:''
  }])
 } finally {
  for(const key of Object.keys(mock)) {
   if(previous[key])Object.defineProperty(globalThis,key,previous[key])
   else delete globalThis[key]
  }
 }
})
