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
