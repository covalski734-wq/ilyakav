import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createInstance } from 'i18next'
import { contactMailto, mailContextForPath } from '../src/lib/mailto.ts'
import { PROJECT_TYPES } from '../shared/contact.ts'
import { SERVICE_PAGES } from '../src/config/services.ts'

const resources = Object.fromEntries(['ru', 'uk', 'en'].map(lang => [lang, {
  translation: JSON.parse(readFileSync(new URL(`../src/i18n/locales/${lang}.json`, import.meta.url), 'utf8')),
}]))

test('all email scenarios and project types encode and localize correctly in RU, UA and EN', async () => {
  const i18n = createInstance()
  await i18n.init({ resources, lng: 'ru', fallbackLng: false, interpolation: { escapeValue: false } })
  const draft = { name: 'Ірина & Ilya + 50%', contact: 'test+tag@example.com', type: 'bot', brief: 'Кириллица & English? #1\nLine 2 = 100% <test> 🚀' }
  const greetings = { ru: 'Здравствуйте, Илья!', uk: 'Вітаю, Ілле!', en: 'Hello Ilya,' }
  for (const lang of ['ru', 'uk', 'en']) {
    await i18n.changeLanguage(lang)
    for (const context of [{}, { scenario: 'privacy' }, { scenario: 'cookies' }, { draft }, ...PROJECT_TYPES.map(type => ({ type }))]) {
      const href = contactMailto(i18n.t.bind(i18n), context)
      const url = new URL(href)
      assert.equal(url.pathname, 'contact@ilyakav.com')
      assert.deepEqual([...url.searchParams.keys()], ['subject', 'body'])
      const subject = url.searchParams.get('subject')
      const body = url.searchParams.get('body')
      assert.ok(subject.length > 10)
      assert.ok(body.startsWith(greetings[lang]))
      assert.ok(body.includes('\n\n'))
      assert.doesNotMatch(subject + body, /\{\{|emailDraft\.|\?{3}/)
      assert.equal(href, `mailto:contact@ilyakav.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      if (context.type || context.draft) assert.ok(body.includes(i18n.t(`contact.form.types.${context.type ?? draft.type}`)))
      if (context.draft) {
        for (const value of [draft.name, draft.contact, draft.brief]) assert.ok(body.includes(value))
        assert.ok(subject.includes(draft.name))
      }
    }
  }
})

test('page context selects privacy, cookies and the relevant service', () => {
  assert.deepEqual(mailContextForPath('/privacy'), { scenario: 'privacy' })
  assert.deepEqual(mailContextForPath('/cookies'), { scenario: 'cookies' })
  for (const service of Object.values(SERVICE_PAGES)) {
    assert.deepEqual(mailContextForPath(`/services/${service.slug}`), { type: service.type })
  }
  assert.deepEqual(mailContextForPath('/'), {})
})
