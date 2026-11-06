import assert from 'node:assert/strict'
import { manualMetaConfig } from './repair-gtm-export.mjs'

// TEST ONLY: model the proposed import in an isolated browser using the actual
// public GTM runtime. This is neither a publishable export nor proof of import.
// It refuses an unexpected public resource instead of patching arbitrary code.
export function repairedRuntimeFixture(source) {
  const marker = '"resource":'
  const start = source.indexOf('{', source.indexOf(marker) + marker.length)
  assert.ok(source.includes(marker) && start > 0)
  let end = start, depth = 0, quote = false, escaped = false
  for (; end < source.length; end++) {
    const character = source[end]
    if (quote) { if (escaped) escaped = false; else if (character === '\\') escaped = true; else if (character === '"') quote = false }
    else if (character === '"') quote = true
    else if (character === '{') depth++
    else if (character === '}' && --depth === 0) { end++; break }
  }
  const resource = JSON.parse(source.slice(start, end))
  assert.equal(resource.version, '6', 'Public container changed; review fixture against the new published config.')
  const index = id => { const found = resource.tags.findIndex(item => item.tag_id === id); assert.ok(found >= 0); return found }
  const googleLead = index(20), metaLead = index(35), allLeads = index(36), email = index(29), pixel = index(33), ads = index(21)
  assert.equal(resource.tags[googleLead].vtp_eventName, 'contact_form_submit')
  assert.equal(resource.tags[email].vtp_eventName, 'email_click')
  assert.match(resource.tags[metaLead].vtp_html, /fbq\("track","Lead"\)/)
  resource.tags[pixel].vtp_html = manualMetaConfig(resource.tags[pixel].vtp_html)
  resource.tags[ads] = { function: '__paused', vtp_originalTagType: 'googtag', tag_id: 21 }
  delete resource.tags[email].once_per_load
  resource.tags[email].once_per_event = true
  const eventMacro = resource.macros.findIndex(item => item.function === '__e')
  const actionMacro = resource.macros.push({ function: '__v', vtp_name: 'action', vtp_dataLayerVersion: 2 }) - 1
  const condition = (macro, value) => resource.predicates.push({ function: '_eq', arg0: ['macro', macro], arg1: value }) - 1
  const confirmed = [condition(eventMacro, 'generate_lead'), condition(actionMacro, 'contact_form')]
  const emailClick = [condition(eventMacro, 'cta_click'), condition(actionMacro, 'email')]
  const formRules = resource.rules.filter(rule => rule.some(part => part[0] === 'add' && part.includes(googleLead) && part.includes(metaLead)))
  assert.equal(formRules.length, 1)
  const form = formRules[0]
  assert.ok(form.find(part => part[0] === 'if').slice(1).some(i => resource.predicates[i].arg1 === 'gtm.formSubmit'))
  form[form.findIndex(part => part[0] === 'if')] = ['if', ...confirmed]
  const emailRules = resource.rules.filter(rule => rule.some(part => part[0] === 'add' && part.slice(1).includes(email)))
  assert.equal(emailRules.length, 1)
  const mail = emailRules[0]
  mail[mail.findIndex(part => part[0] === 'if')] = ['if', ...emailClick]
  const newEmail = resource.tags.push({ function: '__html', metadata: ['map'], once_per_event: true,
    vtp_html: '<script type="text/gtmscript">fbq("trackCustom","EmailClick");</script>',
    vtp_supportDocumentWrite: false, vtp_enableIframeMode: false, vtp_enableEditJsMacroBehavior: false, tag_id: 100 }) - 1
  mail[mail.findIndex(part => part[0] === 'add')] = ['add', email, allLeads, newEmail]
  return source.slice(0, start) + JSON.stringify(resource) + source.slice(end)
}
