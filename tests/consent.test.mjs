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


test('events flow before consent, after acceptance and after withdrawal without replay', async () => {
 const {initConsent,saveConsent,trackEvent,trackPage}=await import('../src/lib/consent.ts')
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
  assert.equal(scripts.length,1)
  assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-TKPFHC7B')
  const events=()=>window.dataLayer.filter(item=>['page_view','cta_click','generate_lead'].includes(item.event))
  trackPage('/contact'); trackPage('/contact')
  assert.equal(events().length,1)
  assert.equal(events()[0].consent_analytics,false)
  for(const choice of [null,{analytics:false,marketing:false},{analytics:true,marketing:false},{analytics:true,marketing:true},{analytics:false,marketing:false}]) {
   const count=events().length
   if(choice)saveConsent(choice)
   assert.equal(events().length,count,'consent changes must not replay page views')
   for(const action of ['email','telegram','whatsapp','contact'])trackEvent('cta_click',action)
   trackEvent('generate_lead','contact_form')
   assert.equal(events().length,count+5)
   for(const event of events().slice(count)) {
    assert.equal(event.consent_analytics,choice?.analytics??false)
    assert.equal(event.consent_marketing,choice?.marketing??false)
    assert.equal(event.page_location,'https://ilyakav.com/contact')
    assert.equal(event.page_referrer,'')
    assert.equal('link_url' in event,false)
   }
   const updates=window.dataLayer.filter(item=>item[0]==='consent'&&item[1]==='update')
   assert.equal(updates.at(-1)[2].analytics_storage,choice?.analytics?'granted':'denied')
  }
  assert.equal(scripts.length,1)
 } finally {
  for(const key of Object.keys(mock)) {
   if(previous[key])Object.defineProperty(globalThis,key,previous[key])
   else delete globalThis[key]
  }
 }
})
