import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const container = 'GTM-TKPFHC7B'
const parameter = (resource, key) => resource.parameter?.find(item => item.key === key)?.value
const metaCall = (resource, method, event) => resource.type === 'html'
  && new RegExp(`\\bfbq\\s*\\(\\s*['"]${method}['"]\\s*,\\s*['"]${event}['"]`).test(parameter(resource, 'html') || '')
const eventName = resource => parameter(resource, 'eventName')
const isCustomEvent = trigger => /^(?:CUSTOM_EVENT|customEvent)$/.test(trigger.type)
const eventEquals = (trigger, event) => isCustomEvent(trigger) && trigger.customEventFilter?.some(condition =>
  /^(?:EQUALS|equals)$/.test(condition.type) && parameter(condition, 'arg0') === '{{_event}}' && parameter(condition, 'arg1') === event)
const isRawSubmit = trigger => /^(?:FORM_SUBMISSION|formSubmission)$/.test(trigger.type) || eventEquals(trigger, 'gtm.formSubmit')
const nextId = resources => String(Math.max(0, ...resources.map(item => Number(item.tagId ?? item.triggerId ?? item.variableId)).filter(Number.isSafeInteger)) + 1)
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }

// Meta's official GTM template uses autoConfig=false before init for manual-only
// measurement: https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel
export function manualMetaConfig(html) {
  const init = /\bfbq\s*\(\s*['"]init['"]\s*,\s*['"]1076328401949671['"]/g
  const matches = [...html.matchAll(init)]
  requireValue(matches.length === 1, 'Expected one initialization of the audited Meta Pixel.')
  const setting = /\bfbq\s*\(\s*['"]set['"]\s*,\s*['"]autoConfig['"]\s*,\s*(?:false|['"]false['"])\s*,\s*['"]1076328401949671['"]/.exec(html)
  if (setting) {
    requireValue(setting.index < matches[0].index, 'Meta autoConfig must be disabled before init, not after it.')
    return html
  }
  requireValue(!/['"]autoConfig['"]/.test(html), 'Existing Meta autoConfig setting needs manual review.')
  return html.slice(0, matches[0].index) + "fbq('set','autoConfig',false,'1076328401949671');" + html.slice(matches[0].index)
}

/** Repairs an ACTUAL downloaded export, never a guessed replacement container. */
export function repairGtmExport(input) {
  const output = structuredClone(input)
  const cv = output.containerVersion
  requireValue(String(output.exportFormatVersion) === '2' && cv?.container?.publicId === container,
    `Expected a format-2 export of ${container}; the original file has not been changed.`)
  requireValue(Array.isArray(cv.tag) && Array.isArray(cv.trigger), 'Export must include tags and triggers.')
  cv.variable ??= []
  const changes = []
  const tag = id => {
    const matches = cv.tag.filter(item => String(item.tagId) === id)
    requireValue(matches.length === 1, `Expected exactly one audited tag ID ${id}. Export may have changed; review it first.`)
    return matches[0]
  }
  const gaLead = tag('20'), metaLead = tag('35'), allLeads = tag('36'), gaEmail = tag('29'), ads = tag('21'), pixel = tag('33')
  requireValue(gaLead.type === 'gaawe' && eventName(gaLead) === 'contact_form_submit', 'Tag 20 is no longer the audited GA form event.')
  requireValue(metaCall(metaLead, 'track', 'Lead'), 'Tag 35 is no longer the audited Meta Lead event.')
  requireValue(metaCall(allLeads, 'trackCustom', 'AllLeads'), 'Tag 36 is no longer the audited Meta AllLeads event.')
  requireValue(gaEmail.type === 'gaawe' && eventName(gaEmail) === 'email_click', 'Tag 29 is no longer the audited GA email event.')
  requireValue(ads.type === 'googtag', 'Tag 21 is no longer the audited Google tag.')
  requireValue(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]1076328401949671['"]/.test(parameter(pixel, 'html') || ''), 'Audited Meta Pixel initialization not found in tag 33.')
  requireValue(cv.tag.filter(item => metaCall(item, 'track', 'Lead')).length === 1, 'Multiple Meta Lead tags: cannot safely retarget without reviewing duplicate ownership.')
  requireValue(cv.tag.filter(item => item.type === 'gaawe' && eventName(item) === 'contact_form_submit').length === 1, 'Multiple GA form events: cannot safely retarget without review.')
  requireValue(cv.tag.filter(item => item.type === 'gaawe' && eventName(item) === 'email_click').length === 1, 'Multiple GA email events: cannot safely retarget without review.')
  const pixelHtml = pixel.parameter.find(item => item.key === 'html')
  const manualHtml = manualMetaConfig(pixelHtml.value)
  if (manualHtml !== pixelHtml.value) {
    pixelHtml.value = manualHtml
    delete pixel.fingerprint
    changes.push('Disabled Meta automatic button/form metadata collection before init; explicit Pixel events remain active.')
  }

  // Match the source export's enum spelling (downloaded exports normally use caps).
  const caps = cv.tag.some(item => item.tagFiringOption === 'ONCE_PER_EVENT' || item.tagFiringOption === 'ONCE_PER_LOAD')
    || cv.tag.some(item => item.parameter?.some(entry => entry.type === 'TEMPLATE'))
  const kind = (upper, lower) => caps ? upper : lower
  const param = (key, value, type = kind('TEMPLATE', 'template')) => ({ type, key, value })
  const equals = (left, right) => ({ type: kind('EQUALS', 'equals'), parameter: [param('arg0', left), param('arg1', right)] })
  const scope = Object.fromEntries(['accountId', 'containerId'].filter(key => metaLead[key] !== undefined).map(key => [key, metaLead[key]]))
  const actionName = 'IK - Action'
  const existingAction = cv.variable.filter(item => item.name === actionName)
  requireValue(existingAction.length <= 1 && existingAction.every(item => item.type === 'v' && parameter(item, 'name') === 'action' && String(parameter(item, 'dataLayerVersion')) === '2'), `Variable name collision: ${actionName}.`)
  if (!existingAction.length) {
    cv.variable.push({ ...scope, variableId: nextId(cv.variable), name: actionName, type: 'v',
      parameter: [param('name', 'action'), param('dataLayerVersion', '2', kind('INTEGER', 'integer'))] })
    changes.push('Added action data-layer variable (version 2).')
  }
  function ensureTrigger(name, event, action) {
    const matches = cv.trigger.filter(item => item.name === name)
    requireValue(matches.length <= 1, `Multiple triggers named ${name}.`)
    if (matches.length) {
      requireValue(eventEquals(matches[0], event) && matches[0].filter?.some(condition => parameter(condition, 'arg0') === `{{${actionName}}}` && parameter(condition, 'arg1') === action), `Trigger name collision: ${name}.`)
      return String(matches[0].triggerId)
    }
    const triggerId = nextId(cv.trigger)
    cv.trigger.push({ ...scope, triggerId, name, type: kind('CUSTOM_EVENT', 'customEvent'),
      customEventFilter: [equals('{{_event}}', event)], filter: [equals(`{{${actionName}}}`, action)] })
    changes.push(`Added ${name}: ${event}, action=${action}.`)
    return triggerId
  }
  const confirmed = ensureTrigger('IK - Confirmed contact form', 'generate_lead', 'contact_form')
  const email = ensureTrigger('IK - Email contact click', 'cta_click', 'email')
  const rawFormIds = new Set(cv.trigger.filter(isRawSubmit).map(item => String(item.triggerId)))
  for (const resource of [gaLead, metaLead]) {
    requireValue(resource.firingTriggerId?.length > 0 && resource.firingTriggerId.every(id => rawFormIds.has(String(id)) || String(id) === confirmed), `Tag ${resource.tagId} has unexpected triggers; cannot safely replace them.`)
    if (resource.firingTriggerId.length !== 1 || String(resource.firingTriggerId[0]) !== confirmed) {
      resource.firingTriggerId = [confirmed]
      delete resource.fingerprint
      changes.push(`Retargeted tag ${resource.tagId} (${resource.name}) to confirmed API success only.`)
    }
  }
  requireValue(allLeads.firingTriggerId?.some(id => rawFormIds.has(String(id)) || String(id) === confirmed), 'AllLeads no longer has the audited form branch; review first.')
  const allTriggers = [...new Set(allLeads.firingTriggerId.map(id => rawFormIds.has(String(id)) ? confirmed : String(id)).concat(email))]
  if (JSON.stringify(allTriggers) !== JSON.stringify(allLeads.firingTriggerId)) {
    allLeads.firingTriggerId = allTriggers
    delete allLeads.fingerprint
    changes.push('Retargeted only the AllLeads form branch to confirmed success; retained contact triggers and added email.')
  }
  if (JSON.stringify(gaEmail.firingTriggerId) !== JSON.stringify([email]) || gaEmail.tagFiringOption !== kind('ONCE_PER_EVENT', 'oncePerEvent')) {
    gaEmail.firingTriggerId = [email]
    gaEmail.tagFiringOption = kind('ONCE_PER_EVENT', 'oncePerEvent')
    delete gaEmail.fingerprint
    changes.push('GA email uses cta_click/action=email once per event (repeat clicks included).')
  }
  const metaEmails = cv.tag.filter(item => metaCall(item, 'trackCustom', 'EmailClick'))
  requireValue(metaEmails.length <= 1 && metaEmails.every(item => item.name === 'IK - Meta email click' && JSON.stringify(item.firingTriggerId) === JSON.stringify([email])), 'Existing Meta EmailClick ownership is ambiguous; review before importing.')
  if (!metaEmails.length) {
    cv.tag.push({ ...scope, tagId: nextId(cv.tag), name: 'IK - Meta email click', type: 'html',
      parameter: [param('html', "<script>fbq('trackCustom', 'EmailClick');</script>"), param('supportDocumentWrite', 'false', kind('BOOLEAN', 'boolean'))],
      firingTriggerId: [email], tagFiringOption: kind('ONCE_PER_EVENT', 'oncePerEvent'),
      notes: 'Canonical site cta_click action=email. Consent is owned by the site Meta bridge; no second Pixel init.' })
    changes.push('Added Meta EmailClick; existing AllLeads handles the same canonical email trigger.')
  }
  let adsId = parameter(ads, 'tagId')
  const reference = typeof adsId === 'string' && adsId.match(/^\{\{(.+)\}\}$/)
  if (reference) {
    const variables = cv.variable.filter(item => item.name === reference[1] && item.type === 'c')
    requireValue(variables.length === 1, 'Cannot resolve the audited Google tag ID constant safely.')
    adsId = parameter(variables[0], 'value')
  }
  if (adsId === '1' && !ads.paused) {
    ads.paused = true
    delete ads.fingerprint
    changes.push('Paused invalid Google tag ID "1" (tag 21); no advertising ID invented.')
  } else requireValue(adsId === '1' || /^(?:AW|G|GT|DC)-[A-Z0-9]+$/.test(adsId || ''), 'Tag 21 has a different invalid ID; review rather than guessing.')
  return { output, changes }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [source, destination] = process.argv.slice(2)
  if (!source || !destination || resolve(source) === resolve(destination)) {
    console.error('Usage: node scripts/repair-gtm-export.mjs ACTUAL-EXPORT.json NEW-REPAIRED-EXPORT.json\nThe source must be an export of GTM-TKPFHC7B. This command never publishes or overwrites the source.')
    process.exitCode = 1
  } else {
    try {
      const result = repairGtmExport(JSON.parse(await readFile(source, 'utf8')))
      await writeFile(destination, JSON.stringify(result.output, null, 2) + '\n', { flag: 'wx' })
      console.log(JSON.stringify({ output: destination, changes: result.changes, published: false,
        next: 'Import into a new GTM workspace using Merge / Overwrite conflicting tags and variables; inspect the preview diff and run marketing-audit before publishing.' }, null, 2))
    } catch (error) { console.error(error.message); process.exitCode = 1 }
  }
}
