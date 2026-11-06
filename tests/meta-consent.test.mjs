import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { parseConsent, consentSignals, CONSENT_VERSION, CONSENT_MAX_AGE } from '../src/lib/consent.ts'

const source = await readFile('public/gtm-init.js', 'utf8')
function bootstrap(raw = null, { search = '', blockedStorage = false, storageMode = 'writable', metaEnabled = true } = {}) {
 const scripts = [], window = {}
 const writes=[],removals=[]
 const context = {
  window, URLSearchParams, location: { search },
  localStorage: {
   getItem() { if (blockedStorage) throw new Error('Storage blocked'); return raw },
   setItem(key,value) { writes.push([key,value]);if(storageMode==='read-only')throw new Error('Read only') },
   removeItem(key) { removals.push(key);if(storageMode==='remove-fails')throw new Error('Cannot remove') }
  },
  document: {
   currentScript: { nonce: 'test-nonce', getAttribute: name => name==='data-meta-enabled'?String(metaEnabled):null }, createElement: () => ({}),
   head: { appendChild(script) { scripts.push(script) } }
  }
 }
 runInNewContext(source, context)
 return { window, scripts, context, writes, removals }
}

test('disabling Meta keeps a revoked stub so standard GTM Meta tags cannot bypass the switch', () => {
 const raw=JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),analytics:true,marketing:true})
 const {window,scripts,context}=bootstrap(raw,{metaEnabled:false})
 assert.equal(typeof window.fbq,'function')
 assert.equal(window._fbq,window.fbq)
 assert.equal(typeof window.__ilyakavSetMetaConsent,'function')
 assert.deepEqual(scripts,[])
 runInNewContext(`(function(f){if(f.fbq)return;throw new Error('Disabled Meta was allowed to load')})(window);
  window.fbq('init','1076328401949671');window.fbq('track','PageView');`,context)
 window.__ilyakavSetMetaConsent(true)
 assert.deepEqual([...window.fbq.queue].map(args=>Array.from(args)),[
  ['consent','revoke'],['set','autoConfig',false,'1076328401949671'],['init','1076328401949671'],['track','PageView']
 ])
 const direct=[]
 window.fbq.callMethod=(...args)=>direct.push(args)
 window.__ilyakavSetMetaConsent(true)
 assert.deepEqual(direct,[['consent','revoke']],'even an externally loaded Meta library is not granted by this bridge')
 const update=window.dataLayer.find(item=>item[0]==='consent'&&item[1]==='update')
 assert.equal(update[2].analytics_storage,'granted')
 assert.equal(window.dataLayer.at(-1).event,'gtm.js')
})

// Model Meta's actual queue rule: revoke stops queue draining, but a direct
// consent command bypasses that lock and grant resumes queued init/events.
function finishMetaLoad({window,scripts}) {
 let locked=false
 const received=[],executed=[]
 function drain() {
  while(window.fbq.queue.length&&!locked)window.fbq.callMethod(...window.fbq.queue.shift())
 }
 window.fbq.callMethod=function(...args) {
  received.push(args)
  if(args[0]==='consent') {
   locked=args[1]==='revoke'
   if(!locked)drain()
  } else if(locked)window.fbq.queue.push(args)
  else executed.push(args)
 }
 drain()
 scripts[0].onload()
 return {received,executed,get locked(){return locked}}
}

test('early bootstrap agrees with runtime validation and restores consent before GTM', () => {
 const now = Date.now()
 const valid = { version: CONSENT_VERSION, chosenAt: new Date(now - 1000).toISOString(), analytics: true, marketing: true }
 const cases = [null, '{bad', 'null', ...[
  valid, {...valid,analytics:false}, {...valid,marketing:false}, {...valid,analytics:false,marketing:false},
  {...valid,version:CONSENT_VERSION-1}, {...valid,marketing:'true'}, {...valid,analytics:1},
  {...valid,chosenAt:'invalid'}, {...valid,chosenAt:new Date(now+60000).toISOString()},
  {...valid,chosenAt:new Date(now-CONSENT_MAX_AGE-1000).toISOString()}
 ].map(value=>JSON.stringify(value))]
 for (const raw of cases) {
  const {window,scripts} = bootstrap(raw)
  const expected = parseConsent(raw) ?? {analytics:false,marketing:false}
  const commands = window.dataLayer.filter(item=>item[0]==='consent')
  assert.equal(commands[0][1],'default')
  assert.ok(Object.values(commands[0][2]).every(value=>value==='denied'))
  assert.deepEqual({...commands.at(-1)[2]},consentSignals(expected))
  assert.equal(window.dataLayer.at(-1).event,'gtm.js')
  const meta = window.fbq.queue.map(args=>Array.from(args))
  assert.deepEqual([...meta],[['consent','revoke']],'grant must never be trapped behind queued revoke')
  assert.equal(scripts.length,1)
  assert.equal(scripts[0].src,'https://connect.facebook.net/en_US/fbevents.js')
  assert.equal(scripts[0].nonce,'test-nonce')
  assert.equal(scripts[0].async,true)
  const loaded=finishMetaLoad({window,scripts})
  assert.equal(loaded.locked,!expected.marketing)
  assert.deepEqual(loaded.received.at(-1),['consent',expected.marketing?'grant':'revoke'])
 }
})

test('reset URL and blocked storage retain denied signals', () => {
 const raw=JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),analytics:true,marketing:true})
 for(const options of [{search:'?consent-reset=1'},{blockedStorage:true}]) {
  const {window}=bootstrap(raw,options)
  const updates=window.dataLayer.filter(item=>item[0]==='consent'&&item[1]==='update')
  assert.ok(Object.values(updates.at(-1)[2]).every(value=>value==='denied'))
  assert.deepEqual([...window.fbq.queue].map(args=>Array.from(args)),[['consent','revoke']])
 }
})

test('early restore cannot resurrect grants from read-only storage', () => {
 for(const storageMode of ['read-only','remove-fails','writable'])for(const granted of [false,true]) {
  const raw=JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),analytics:granted,marketing:granted})
  const result=bootstrap(raw,{storageMode})
  const update=result.window.dataLayer.filter(item=>item[0]==='consent'&&item[1]==='update').at(-1)
  const expected=granted&&storageMode==='writable'
  assert.ok(Object.values(update[2]).every(value=>value===(expected?'granted':'denied')))
  assert.equal(finishMetaLoad(result).locked,!expected)
  assert.deepEqual(result.writes,granted?[['ilyakav-consent-storage-probe','1']]:[])
  assert.deepEqual(result.removals,granted&&storageMode!=='read-only'?['ilyakav-consent-storage-probe']:[])
 }
})

test('standard GTM bootstrap reuses the loader and queues init/events after Meta consent', () => {
 const {window,scripts,context}=bootstrap()
 // Same early return used by Meta's standard GTM snippet.
 runInNewContext(`(function(f){if(f.fbq)return;throw new Error('Missing fbq bootstrap')})(window);
  window.fbq('init','1076328401949671');window.fbq('track','PageView');`,context)
 assert.equal(scripts.length,1,'GTM does not need to load the library a second time')
 assert.deepEqual([...window.fbq.queue].map(args=>Array.from(args)),[
  ['consent','revoke'],['set','autoConfig',false,'1076328401949671'],['init','1076328401949671'],['track','PageView']
 ])
 // Changes while the library is delayed must update the latest choice, not
 // enqueue a grant which Meta would strand behind the initial revoke.
 window.__ilyakavSetMetaConsent(true)
 window.fbq('trackCustom','TelegramClick')
 const loaded=finishMetaLoad({window,scripts})
 assert.equal(loaded.locked,false)
 assert.deepEqual(loaded.executed,[['set','autoConfig',false,'1076328401949671'],['init','1076328401949671'],['track','PageView'],['trackCustom','TelegramClick']])
 window.__ilyakavSetMetaConsent(false)
 assert.equal(loaded.locked,true)
 assert.deepEqual(loaded.received.at(-1),['consent','revoke'])
})

test('latest denial during library load wins over an earlier grant or saved consent', () => {
 const raw=JSON.stringify({version:CONSENT_VERSION,chosenAt:new Date().toISOString(),analytics:true,marketing:true})
 const result=bootstrap(raw)
 result.window.fbq('init','1076328401949671')
 result.window.fbq('track','PageView')
 result.window.__ilyakavSetMetaConsent(true)
 result.window.__ilyakavSetMetaConsent(false)
 const loaded=finishMetaLoad(result)
 assert.equal(loaded.locked,true)
 assert.deepEqual(loaded.executed,[])
 assert.deepEqual(loaded.received.at(-1),['consent','revoke'])
 result.window.__ilyakavSetMetaConsent(true)
 assert.equal(loaded.locked,false)
 assert.deepEqual(loaded.executed,[['set','autoConfig',false,'1076328401949671'],['init','1076328401949671'],['track','PageView']])
})

test('Meta automatic-event policy precedes every init before and after the library loads', () => {
 const result=bootstrap()
 result.window.fbq('init',12345)
 result.window.fbq('track','PageView')
 result.window.__ilyakavSetMetaConsent(true)
 const loaded=finishMetaLoad(result)
 result.window.fbq('init','67890')
 result.window.fbq('trackCustom','TelegramClick')
 assert.deepEqual(loaded.executed,[
  ['set','autoConfig',false,'12345'],['init',12345],['track','PageView'],
  ['set','autoConfig',false,'67890'],['init','67890'],['trackCustom','TelegramClick']
 ])
 assert.equal(loaded.executed.filter(args=>args[0]==='track').length,1,'policy does not duplicate tracking events')
})
