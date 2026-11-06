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
 const {initConsent,saveConsent,trackEvent,trackPage,getConsent,CONSENT_KEY}=await import('../src/lib/consent.ts')
 const scripts=[]
 const meta=[]
 const windowListeners=new Map(), documentListeners=new Map(), timers=new Map()
 let stored=null,timerId=0
 const previous={}
 for(const key of ['window','document','location','localStorage','history'])previous[key]=Object.getOwnPropertyDescriptor(globalThis,key)
 const mock={
  window:{
   addEventListener(name,handler){windowListeners.set(name,handler)},
   setTimeout(callback,delay){const id=++timerId;timers.set(id,{callback,delay});return id},
   clearTimeout(id){timers.delete(id)},
   __ilyakavSetMetaConsent(granted){meta.push(['consent',granted?'grant':'revoke'])},
   fbq(){throw new Error('Runtime must use the load-aware consent bridge')}
  },
  document:{cookie:'',hidden:false,querySelector(){return null},createElement(){return {}},head:{append(script){scripts.push(script)}},addEventListener(name,handler){documentListeners.set(name,handler)}},
  location:{hostname:'ilyakav.com',origin:'https://ilyakav.com',pathname:'/contact/',protocol:'https:',search:'',hash:''},
  localStorage:{getItem(key){return key===CONSENT_KEY?stored:null},setItem(key,value){if(key===CONSENT_KEY)stored=value},removeItem(key){if(key===CONSENT_KEY)stored=null}},
  history:{replaceState(){}}
 }
 try {
  for(const [key,value] of Object.entries(mock))Object.defineProperty(globalThis,key,{value,configurable:true})
  initConsent()
  assert.equal(scripts.length,1)
  assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-TKPFHC7B')
  const events=()=>window.dataLayer.filter(item=>['page_view','cta_click','generate_lead'].includes(item.event))
  trackPage('/contact/'); trackPage('/contact')
  assert.equal(events().length,1)
  assert.equal(events()[0].consent_analytics,false)
  for(const choice of [null,{analytics:false,marketing:false},{analytics:true,marketing:false},{analytics:false,marketing:true},{analytics:true,marketing:true},{analytics:false,marketing:false}]) {
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
   assert.deepEqual(meta.at(-1),['consent',choice?.marketing?'grant':'revoke'])
  }
  saveConsent({analytics:true,marketing:true})
  getConsent().chosenAt = new Date(Date.now()-CONSENT_MAX_AGE-1000).toISOString()
  trackEvent('cta_click','email')
  assert.equal(events().at(-1).consent_marketing,false)
  assert.deepEqual(meta.at(-1),['consent','revoke'],'expired consent is revoked before the next event')
  assert.equal(scripts.length,1)
  const countBeforeStorage=events().length
  const inOtherTab=(value,key=CONSENT_KEY)=>{
   stored=value===null?null:JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),...value})
   windowListeners.get('storage')({key})
  }
  inOtherTab({analytics:false,marketing:true})
  assert.equal(getConsent().analytics,false)
  assert.deepEqual(meta.at(-1),['consent','grant'])
  inOtherTab({analytics:false,marketing:false},'unrelated-storage-key')
  assert.equal(getConsent().marketing,true,'unrelated storage changes do not change consent')
  inOtherTab({analytics:false,marketing:false})
  assert.deepEqual(meta.at(-1),['consent','revoke'])
  inOtherTab({analytics:true,marketing:true})
  stored='{broken'
  windowListeners.get('storage')({key:CONSENT_KEY})
  assert.equal(getConsent(),null,'invalid cross-tab preferences revert to denied')
  inOtherTab({analytics:true,marketing:true})
  inOtherTab(null,null)
  assert.equal(getConsent(),null,'clearing storage in another tab revokes consent')
  assert.deepEqual(meta.at(-1),['consent','revoke'])
  assert.equal(events().length,countBeforeStorage,'cross-tab changes do not replay events')
  saveConsent({analytics:true,marketing:true})
  assert.equal(timers.size,1)
  assert.ok([...timers.values()].every(timer=>timer.delay<=2**31-1))
  const originalNow=Date.now
  try {
   Date.now=()=>Date.parse(getConsent().chosenAt)+CONSENT_MAX_AGE
   const pending=[...timers.entries()][0]
   timers.delete(pending[0])
   pending[1].callback()
  } finally {Date.now=originalNow}
  assert.equal(getConsent(),null,'idle visible tab revokes expired consent without waiting for a click')
  assert.deepEqual(meta.at(-1),['consent','revoke'])
  assert.equal(timers.size,0)
  saveConsent({analytics:true,marketing:true})
  getConsent().chosenAt=new Date(Date.now()-CONSENT_MAX_AGE-1).toISOString()
  documentListeners.get('visibilitychange')()
  assert.equal(getConsent(),null,'resume rechecks expiry even when a browser suspended the timer')
  let resetUrl=''
  mock.location.replace=url=>{resetUrl=url}
  mock.localStorage.setItem=()=>{throw new Error('Storage unavailable')}
  assert.equal(saveConsent({analytics:true,marketing:true}),false)
  assert.equal(getConsent().marketing,true,'choice applies to this page when stale storage can be removed')
  assert.equal(stored,null)
  assert.equal(resetUrl,'','ordinary storage failure does not interrupt the page')
  assert.deepEqual(meta.at(-1),['consent','grant'])
  stored=JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),analytics:true,marketing:true})
  mock.localStorage.removeItem=()=>{throw new Error('Storage read-only')}
  mock.location.search='?utm_source=campaign&gclid=example'
  mock.location.hash='#form'
  assert.equal(saveConsent({analytics:false,marketing:false}),false)
  assert.equal(getConsent().marketing,false,'a failed save still applies the explicit withdrawal in memory')
  assert.equal(resetUrl,'','read-only storage does not interrupt the page or discard campaign parameters')
  assert.equal(mock.location.search,'?utm_source=campaign&gclid=example')
  assert.deepEqual(meta.at(-1),['consent','revoke'])
  trackEvent('cta_click','telegram')
  assert.equal(events().at(-1).consent_marketing,false)
  windowListeners.get('storage')({key:CONSENT_KEY})
  assert.equal(getConsent(),null,'an undeletable old grant cannot be restored from read-only storage')
  assert.deepEqual(meta.at(-1),['consent','revoke'])
  let recoveredUrl=''
  mock.localStorage.setItem=(key,value)=>{if(key===CONSENT_KEY)stored=value}
  mock.location.search='?utm_source=campaign&consent-reset=1&gclid=example'
  mock.history.replaceState=(_state,_title,url)=>{recoveredUrl=url}
  assert.equal(saveConsent({analytics:false,marketing:false}),true)
  assert.equal(recoveredUrl,'/contact/?utm_source=campaign&gclid=example#form')
 } finally {
  for(const key of Object.keys(mock)) {
   if(previous[key])Object.defineProperty(globalThis,key,previous[key])
   else delete globalThis[key]
  }
 }
})

test('runtime restoration fails closed when a saved grant cannot be replaced or removed', async () => {
 const previous={}
 for(const key of ['window','document','location','localStorage'])previous[key]=Object.getOwnPropertyDescriptor(globalThis,key)
 try {
  for(const mode of ['read-only','remove-fails','writable'])for(const granted of [false,true]) {
   const raw=JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),analytics:granted,marketing:granted})
   const writes=[],removals=[]
   const mock={
    window:{addEventListener(){},setTimeout(){return 1},clearTimeout(){}},
    document:{cookie:'',querySelector(){return {}},addEventListener(){}},
    location:{search:'',hostname:'ilyakav.com',pathname:'/contact/',protocol:'https:'},
    localStorage:{
     getItem(){return raw},
     setItem(key,value){writes.push([key,value]);if(mode==='read-only')throw new Error('Read only')},
     removeItem(key){removals.push(key);if(mode==='remove-fails')throw new Error('Cannot remove')}
    }
   }
   for(const [key,value] of Object.entries(mock))Object.defineProperty(globalThis,key,{value,configurable:true})
   const {initConsent,getConsent}=await import(`../src/lib/consent.ts?storage=${mode}-${granted}`)
   initConsent()
   assert.equal(getConsent()?.marketing??false,granted&&mode==='writable')
   const update=window.dataLayer.filter(item=>item[0]==='consent'&&item[1]==='update').at(-1)
   assert.equal(update[2].ad_storage,granted&&mode==='writable'?'granted':'denied')
   assert.deepEqual(writes,granted?[['ilyakav-consent-storage-probe','1']]:[])
   assert.deepEqual(removals,granted&&mode!=='read-only'?['ilyakav-consent-storage-probe']:[])
  }
 } finally {
  for(const [key,descriptor] of Object.entries(previous)) {
   if(descriptor)Object.defineProperty(globalThis,key,descriptor)
   else delete globalThis[key]
  }
 }
})

test('cookie cleanup follows partial consent and preserves necessary preferences', async () => {
 const {clearOptionalCookies}=await import('../src/lib/consent.ts')
 const previous={document:Object.getOwnPropertyDescriptor(globalThis,'document'),location:Object.getOwnPropertyDescriptor(globalThis,'location')}
 const removals=[]
 try {
  Object.defineProperty(globalThis,'document',{configurable:true,value:{
   get cookie(){return '_ga=one; _ga_TEST=two; _gid=three; _gat=four; _fbp=five; _fbc=six; _gcl_aw=seven; necessary=keep; ilyakav-lang=en'},
   set cookie(value){removals.push(value)}
  }})
  Object.defineProperty(globalThis,'location',{configurable:true,value:{hostname:'www.ilyakav.com',pathname:'/contact/',protocol:'https:'}})
  clearOptionalCookies({analytics:true,marketing:false})
  assert.deepEqual([...new Set(removals.map(value=>value.split('=')[0]))].sort(),['_fbc','_fbp','_gcl_aw'])
  assert.ok(removals.every(value=>value.includes('Max-Age=0')&&value.includes('Secure')))
  removals.length=0
  clearOptionalCookies({analytics:false,marketing:true})
  assert.deepEqual([...new Set(removals.map(value=>value.split('=')[0]))].sort(),['_ga','_ga_TEST','_gat','_gid'])
 } finally {
  for(const [key,descriptor] of Object.entries(previous)) {
   if(descriptor)Object.defineProperty(globalThis,key,descriptor)
   else delete globalThis[key]
  }
 }
})
