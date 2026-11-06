import test from 'node:test'
import assert from 'node:assert/strict'
import { manualMetaConfig, repairGtmExport } from '../scripts/repair-gtm-export.mjs'

// Synthetic fixture matching the audited public tags; NOT an importable backup.
const param = (key, value) => ({ type: 'TEMPLATE', key, value })
const html = (id, name, code, triggers) => ({ tagId: id, name, type: 'html', parameter: [param('html', `<script>${code}</script>`)], firingTriggerId: triggers, tagFiringOption: 'ONCE_PER_EVENT' })
function fixture() {
  return { exportFormatVersion: 2, exportTime: 'preserve-original-time', containerVersion: {
    container: { publicId: 'GTM-TKPFHC7B' }, unknownSettings: { retain: true },
    variable: [{ variableId: '4', name: 'Existing Ads ID', type: 'c', parameter: [param('value', '1')] }],
    trigger: [
      { triggerId: '4', name: 'Raw submission', type: 'CUSTOM_EVENT', customEventFilter: [{ type: 'EQUALS', parameter: [param('arg0', '{{_event}}'), param('arg1', 'gtm.formSubmit')] }] },
      { triggerId: '8', name: 'Existing Telegram', type: 'LINK_CLICK' },
      { triggerId: '24', name: 'Existing WhatsApp', type: 'LINK_CLICK' },
      { triggerId: '28', name: 'Existing email', type: 'LINK_CLICK' },
    ],
    tag: [
      { tagId: '20', name: 'Existing GA form', type: 'gaawe', parameter: [param('eventName', 'contact_form_submit'), param('measurementIdOverride', '{{GA ID}}')], firingTriggerId: ['4'] },
      { tagId: '21', name: 'Existing invalid Ads', type: 'googtag', parameter: [param('tagId', '{{Existing Ads ID}}')], firingTriggerId: ['2147479573'] },
      { tagId: '29', name: 'Existing GA email', type: 'gaawe', parameter: [param('eventName', 'email_click')], firingTriggerId: ['28'], tagFiringOption: 'ONCE_PER_LOAD' },
      html('33', 'Existing Pixel', "fbq('init','1076328401949671');fbq('track','PageView');", ['2147479553']),
      html('35', 'Existing Meta form', "fbq('track','Lead');", ['4']),
      html('36', 'Existing All Leads', "fbq('trackCustom','AllLeads');", ['4', '8', '24']),
      { tagId: '99', name: 'Unrelated client tag', type: 'custom', unusual: { preserved: true } },
    ],
  } }
}
test('repair retargets existing form tags, preserves other branches and adds repeatable canonical email events', () => {
  const source = fixture(), before = structuredClone(source)
  const result = repairGtmExport(source), cv = result.output.containerVersion
  assert.deepEqual(source, before, 'Source object is unchanged')
  assert.deepEqual(cv.tag.find(item => item.tagId === '99'), source.containerVersion.tag.find(item => item.tagId === '99'))
  assert.deepEqual(cv.unknownSettings, { retain: true })
  assert.equal(result.output.exportTime, source.exportTime)
  const lead = cv.trigger.find(item => item.name === 'IK - Confirmed contact form').triggerId
  const email = cv.trigger.find(item => item.name === 'IK - Email contact click').triggerId
  for (const id of ['20', '35']) assert.deepEqual(cv.tag.find(item => item.tagId === id).firingTriggerId, [lead])
  assert.deepEqual(cv.tag.find(item => item.tagId === '36').firingTriggerId, [lead, '8', '24', email])
  assert.deepEqual(cv.tag.find(item => item.tagId === '29').firingTriggerId, [email])
  assert.equal(cv.tag.find(item => item.tagId === '29').tagFiringOption, 'ONCE_PER_EVENT')
  assert.equal(cv.tag.find(item => item.tagId === '21').paused, true)
  assert.equal(cv.tag.filter(item => item.name === 'IK - Meta email click').length, 1)
  assert.match(cv.tag.find(item => item.tagId === '33').parameter[0].value, /autoConfig',false,'1076328401949671'\);fbq\('init'/)
  assert.ok(result.changes.length >= 7)
  const again = repairGtmExport(result.output)
  assert.deepEqual(again.output, result.output)
  assert.deepEqual(again.changes, [])
})
test('Meta manual-only mode is inserted before init without duplicating initialization', () => {
  const code = "<script>fbq('init','1076328401949671');fbq('track','PageView');</script>"
  const patched = manualMetaConfig(code)
  assert.ok(patched.indexOf('autoConfig') < patched.indexOf("'init'"))
  assert.equal(manualMetaConfig(patched), patched)
  assert.throws(() => manualMetaConfig(code.replace('</script>', "fbq('set','autoConfig',false,'1076328401949671');</script>")))
})
test('repair refuses changed ownership, wrong containers and ambiguous rules instead of guessing', () => {
  for (const mutate of [
    source => { source.containerVersion.container.publicId = 'GTM-OTHER' },
    source => { source.containerVersion.tag.find(item => item.tagId === '35').parameter[0].value = "<script>fbq('track','Purchase')</script>" },
    source => { source.containerVersion.tag.push(html('100', 'Another Lead', "fbq('track','Lead')", ['4'])) },
    source => { source.containerVersion.tag.find(item => item.tagId === '20').firingTriggerId = ['8'] },
    source => { source.containerVersion.variable.push({ name: 'IK - Action', type: 'c', parameter: [param('value', 'wrong')] }) },
  ]) { const source = fixture(); mutate(source); assert.throws(() => repairGtmExport(source)) }
})
