import { PUBLIC_PATHS } from '../../shared/routes.ts'
/** Browser-only adapter. Keep this module independent of React/router for SSR migrations. */
export const CONSENT_KEY = 'ilyakav-consent'
export const CONSENT_VERSION = 2 // Bump whenever processing purposes or providers materially change.
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000
export type Choice = { analytics: boolean; marketing: boolean }
export type Consent = Choice & { version: number; chosenAt: string }
export const denied: Choice = { analytics: false, marketing: false }
type ConsentWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  fbq?: (...args: unknown[]) => void
  __ilyakavSetMetaConsent?: (granted: boolean) => void
}
let state: Consent | null = null
let initialized = false
let containerLoaded = false
let lastPage = ''
let expiryTimer: number | undefined
const listeners = new Set<() => void>()
// An explicit empty build variable disables the existing site container.
const configId = (import.meta.env?.VITE_GTM_ID ?? 'GTM-TKPFHC7B').trim()
const metaEnabled = (import.meta.env?.VITE_META_ENABLED ?? 'true').trim().toLowerCase() !== 'false'
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
  if (browser().__ilyakavSetMetaConsent) browser().__ilyakavSetMetaConsent!(choice.marketing)
  else browser().fbq?.('consent', metaEnabled && choice.marketing ? 'grant' : 'revoke')
  push({ event: 'consent_updated', consent_analytics: choice.analytics, consent_marketing: choice.marketing })
}
function loadContainer() {
  if (!gtmConfigured || containerLoaded) return
  containerLoaded = true
  // Fallback for documents without the early head loader.
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
function readStored() {
  try {
    const stored = parseConsent(localStorage.getItem(CONSENT_KEY))
    if (stored && (stored.analytics || stored.marketing)) {
      // A saved grant is trusted only while storage can also record withdrawal.
      // Keep this necessary, temporary probe in sync with the early head loader.
      const probeKey = CONSENT_KEY + '-storage-probe'
      localStorage.setItem(probeKey, '1')
      localStorage.removeItem(probeKey)
    }
    return stored
  } catch { return null }
}
function scheduleExpiry() {
  if (expiryTimer !== undefined) window.clearTimeout(expiryTimer)
  expiryTimer = undefined
  if (!state) return
  const remaining = Date.parse(state.chosenAt) + CONSENT_MAX_AGE - Date.now()
  // Browser timers have a signed 32-bit delay limit; renew long waits in chunks.
  expiryTimer = window.setTimeout(() => {
    expiryTimer = undefined
    if (state && !parseConsent(JSON.stringify(state))) apply(null)
    else scheduleExpiry()
  }, Math.max(0, Math.min(remaining, 2 ** 31 - 1)))
}
function apply(next: Consent | null) {
  state = next
  scheduleExpiry()
  const choice = next ?? denied
  update(choice)
  clearOptionalCookies(choice)
  listeners.forEach(listener => listener())
  loadContainer()
}
export function initConsent() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  containerLoaded = gtmConfigured && !!document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${configId}"]`)
  browser().dataLayer ??= []
  browser().gtag ??= command
  if (!containerLoaded) browser().gtag!('consent', 'default', consentSignals(denied))
  browser().gtag!('set', 'ads_data_redaction', true)
  browser().gtag!('set', 'url_passthrough', false)
  state = new URLSearchParams(location.search).has('consent-reset') ? null : readStored()
  scheduleExpiry()
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
  if (!persisted) {
    // Keep the explicit choice in memory without interrupting this page. Remove
    // stale storage when possible; restoration rejects grants in read-only storage.
    try { localStorage.removeItem(CONSENT_KEY) } catch { /* The restore probe fails closed. */ }
  }
  if (persisted && new URLSearchParams(location.search).has('consent-reset')) {
    const params = new URLSearchParams(location.search)
    params.delete('consent-reset')
    const search = params.toString()
    history.replaceState(null, '', location.pathname + (search ? '?' + search : '') + location.hash)
  }
  apply(next)
  return persisted
}
export function openCookieSettings() { window.dispatchEvent(new Event('cookie-settings')) }
/** Explicit allowlist: never accept form values, full URLs, query strings or link text. */
export function trackEvent(event: 'cta_click' | 'generate_lead', action: 'contact' | 'telegram' | 'whatsapp' | 'email' | 'contact_form') {
  if (!prepareEvent()) return
  const path = safePath(location.pathname)
  push({ event, action, ...eventConsent(), page_path: path, page_location: location.origin + path, page_referrer: '' })
}
function safePath(path: string) {
  const normalized = path.replace(/\/+$/, '') || '/'
  return PUBLIC_PATHS.includes(normalized as typeof PUBLIC_PATHS[number]) ? normalized : '/404'
}
export function trackPage(path: string) {
  const safe = safePath(path)
  if (!prepareEvent() || lastPage === safe) return
  lastPage = safe
  push({ event: 'page_view', ...eventConsent(), page_path: safe, page_location: location.origin + safe, page_referrer: '' })
}

function prepareEvent() {
  if (typeof window === 'undefined' || !gtmConfigured) return false
  initConsent()
  if (state && !parseConsent(JSON.stringify(state))) apply(null)
  return true
}
function eventConsent() {
  return { consent_analytics: state?.analytics ?? false, consent_marketing: state?.marketing ?? false }
}
