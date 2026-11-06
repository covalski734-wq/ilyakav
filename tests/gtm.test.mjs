import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { PUBLIC_PATHS } from '../shared/routes.ts'
import { analyticsHeadScripts } from '../vite.config.ts'

test('GTM head configuration supports Meta opt-out and disabled or invalid containers', () => {
 assert.equal(analyticsHeadScripts(''),'')
 assert.equal(analyticsHeadScripts('not-a-container'),'')
 assert.match(analyticsHeadScripts('GTM-TKPFHC7B'),/data-meta-enabled="true"/)
 const googleOnly=analyticsHeadScripts('GTM-TKPFHC7B',false)
 assert.match(googleOnly,/data-meta-enabled="false"/)
 assert.match(googleOnly,/gtm\.js\?id=GTM-TKPFHC7B/)
 assert.ok(!googleOnly.includes('1076328401949671'),'Pixel IDs remain in GTM')
})

test('GTM loads once in the head after consent defaults and before React', async () => {
 for (const path of PUBLIC_PATHS) {
  const html = await readFile('dist' + (path === '/' ? '' : path) + '/index.html', 'utf8')
  const init = html.indexOf('<script src="/gtm-init.js"')
  const gtm = html.indexOf('<script id="ilyakav-gtm" async src="https://www.googletagmanager.com/gtm.js?id=')
  assert.ok(init > html.indexOf('<head>') && gtm > init && gtm < html.indexOf('</head>'), path)
  assert.ok(gtm < html.indexOf('<script type="module"'), path)
  assert.equal((html.match(/googletagmanager.com\/gtm.js/g) || []).length, 1, path)
 }
 const window = {}
 runInNewContext(await readFile('dist/gtm-init.js', 'utf8'), {
  window,
  localStorage: { getItem: () => null },
  location: { search: '' }, URLSearchParams,
  document: { createElement: () => ({}), head: { appendChild() {} } }
 })
 const entries = window.dataLayer
 assert.equal(entries[0][0], 'consent')
 assert.equal(entries[0][1], 'default')
 assert.ok(Object.values(entries[0][2]).every(value => value === 'denied'))
 assert.equal(entries.at(-1).event, 'gtm.js')
})
