import { PUBLIC_PATHS } from '../../shared/routes.ts'
/** Browser-only adapter. Keep this module independent of React/router for SSR migrations. */
export const CONSENT_KEY = 'ilyakav-consent'
export const CONSENT_VERSION = 1 // Bump whenever processing purposes or providers materially change.
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000
export type Choice = { analytics: boolean; marketing: boolean }
export type Consent = Choice & { version: number; chosenAt: string }
export const denied: Choice = { analytics: false, marketing: false }
type ConsentWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
let state: Consent | null = null
let initialized = false
let containerLoaded = false
let lastPage = ''
const listeners = new Set<() => void>()
const configId = import.meta.env?.VITE_GTM_ID?.trim() ?? ''
export const gtmConfigured = /^GTM-[A-Z0-9]+$/.test(configId)
const browser = () => window as ConsentWindow
export function parseConsent(raw: string | null, now = Date.now()): Consent | null {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (!value || value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean' || typeof value.chosenAt !== 'string') return null
    const age = now - Date.parse(value.chosenAt)
    return Number.isFinite(age) && age >= 0 && age < CONSENT_MAX_AGE ? { version: value.version, chosenAt: value.chosenAt, analytics: value.analytics, marketing: value.marketing } : null
  } catch { return null }
}
export const getConsent = () => state
export const subscribeConsent = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function consentSignals(choice: Choice) {
  return { analytics_storage: choice.analytics ? 'granted' : 'denied', ad_storage: choice.marketing ? 'granted' : 'denied', ad_user_data: choice.marketing ? 'granted' : 'denied', ad_personalization: choice.marketing ? 'granted' : 'denied' }
}
function push(value: unknown) { browser().dataLayer!.push(value) }
function command(..._args: unknown[]) { push(arguments) }
function update(choice: Choice) {
  browser().gtag!('consent', 'update', consentSignals(choice))
  push({ event: 'consent_updated', consent_analytics: choice.analytics, consent_marketing: choice.marketing })
}
function loadContainer() {
  if (!gtmConfigured || containerLoaded || !(state?.analytics || state?.marketing)) return
  containerLoaded = true
  // The default and restored/current update are queued BEFORE gtm.js.
  if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${configId}"]`)) return
  push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const script = document.createElement('script')
  script.id = 'ilyakav-gtm'; script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${configId}`
  document.head.append(script)
}
/** Only known optional first-party cookies are removed. No necessary/site preferences touched. */
export function clearOptionalCookies(choice: Choice) {
  const names = document.cookie.split(';').map(cookie => cookie.split('=')[0].trim()).filter(name =>
    (!choice.analytics && /^(?:_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) ||
    (!choice.marketing && /^(?:_gcl_|_fbp$|_fbc$)/.test(name)))
  const hosts = location.hostname.split('.')
  const domains = ['', ...hosts.map((_, i) => hosts.slice(i).join('.')).filter(host => host.includes('.')).flatMap(host => [host, `.${host}`])]
  const parts = location.pathname.split('/').filter(Boolean)
  const paths = ['/', ...parts.flatMap((_, i) => { const path = '/' + parts.slice(0, i + 1).join('/'); return [path, path + '/'] })]
  for (const name of names) for (const domain of domains) for (const path of paths)
    document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? `; domain=${domain}` : ''}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}
function readStored() { try { return parseConsent(localStorage.getItem(CONSENT_KEY)) } catch { return null } }
function apply(next: Consent | null) {
  const previous = state
  state = next
  const choice = next ?? denied
  update(choice)
  clearOptionalCookies(choice)
  listeners.forEach(listener => listener())
  // Loaded third-party code cannot be unloaded safely. Reset the document on withdrawal
  // to stop timers/listeners, including tags not controlled by our event gateway.
  if (containerLoaded && ((previous?.analytics && !choice.analytics) || (previous?.marketing && !choice.marketing))) {
    location.reload()
    return
  }
  loadContainer()
  if (choice.analytics) trackPage(location.pathname)
}
export function initConsent() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  browser().dataLayer ??= []
  browser().gtag ??= command
  browser().gtag!('consent', 'default', consentSignals(denied))
  browser().gtag!('set', 'ads_data_redaction', true)
  browser().gtag!('set', 'url_passthrough', false)
  state = new URLSearchParams(location.search).has('consent-reset') ? null : readStored()
  update(state ?? denied)
  clearOptionalCookies(state ?? denied)
  loadContainer()
  window.addEventListener('storage', event => { if (event.key === CONSENT_KEY || event.key === null) apply(readStored()) })
  // Recheck expiry after a background tab resumes, not only on full reload.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state && !parseConsent(JSON.stringify(state))) apply(null) })
}
export function saveConsent(choice: Choice): boolean {
  initConsent()
  const next = { analytics: choice.analytics === true, marketing: choice.marketing === true, version: CONSENT_VERSION, chosenAt: new Date().toISOString() }
  let persisted = true
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)) } catch { persisted = false }
  // If storage is blocked, a reload must fail closed instead of restoring a stale grant.
  if (!persisted && containerLoaded) { state = next; update(denied); clearOptionalCookies(denied); location.replace(location.pathname + '?consent-reset=1'); return false }
  if (persisted && new URLSearchParams(location.search).has('consent-reset')) history.replaceState(null, '', location.pathname + location.hash)
  apply(next)
  return persisted
}
export function openCookieSettings() { window.dispatchEvent(new Event('cookie-settings')) }
/** Explicit allowlist: never accept form values, full URLs, query strings or link text. */
export function trackEvent(event: 'cta_click' | 'generate_lead', action: 'contact' | 'telegram' | 'email' | 'contact_form') {
  if (!state?.analytics || !gtmConfigured || !parseConsent(JSON.stringify(state))) return
  const path = safePath(location.pathname)
  push({ event, action, page_path: path, page_location: location.origin + path, page_referrer: '' })
}
function safePath(path: string) { return PUBLIC_PATHS.includes(path as typeof PUBLIC_PATHS[number]) ? path : '/404' }
export function trackPage(path: string) {
  const safe = safePath(path)
  if (!state?.analytics || !gtmConfigured || lastPage === safe || !parseConsent(JSON.stringify(state))) return
  lastPage = safe
  push({ event: 'page_view', page_path: safe, page_location: location.origin + safe, page_referrer: '' })
}
