/** Cloudflare's HTMLRewriter is available in both Pages Functions and Workers. */
declare const HTMLRewriter: {
  new(): {
    on(selector: string, handler: { element(element: { setAttribute(name: string, value: string): void }): void }): {
      transform(response: Response): Response
    }
  }
}

const scriptSources = "'self' https://www.googletagmanager.com https://tagmanager.google.com https://www.googleadservices.com https://www.google.com https://connect.facebook.net"
// Exact origins for the site's Google/Meta tags and Tag Assistant, based on
// https://developers.google.com/tag-platform/security/guides/csp .
// The corresponding static policy in public/_headers is checked in tests.
export const HTML_BASE_CSP = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://tagmanager.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://ssl.gstatic.com https://www.gstatic.com https://www.facebook.com",
  "media-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://ad.doubleclick.net https://pagead2.googlesyndication.com https://www.facebook.com https://connect.facebook.net",
  "frame-src https://marianaleus.com https://www.marianaleus.com https://www.googletagmanager.com https://www.facebook.com",
  "frame-ancestors 'none'", "form-action 'self' mailto: https://www.facebook.com/tr/", 'upgrade-insecure-requests',
].join('; ')

const defaultHeaders: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
}

/** Trust the server-authored scripts and scripts loaded by them, including GTM Custom HTML. */
export function applyHtmlSecurity(response: Response): Response {
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) return response
  if (response.status === 304) {
    // A 304 has no new document to rewrite. Keep the cached body's existing CSP
    // instead of merging a fresh nonce into headers for an older document.
    const headers = new Headers(response.headers)
    headers.delete('content-security-policy')
    headers.set('cache-control', 'no-store, no-transform')
    return new Response(null, { status: 304, headers })
  }
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const nonce = btoa(String.fromCharCode(...bytes))
  const scriptPolicy = `script-src 'nonce-${nonce}' 'strict-dynamic' ${scriptSources}`
  const directives = (response.headers.get('content-security-policy') || HTML_BASE_CSP).split(';')
    .map(value => value.trim())
    .filter(value => value && !/^script-src(?:-elem|-attr)?(?:\s|$)/.test(value))
  directives.push(scriptPolicy, "script-src-attr 'none'")
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(defaultHeaders)) if (!headers.has(name)) headers.set(name, value)
  headers.set('content-security-policy', directives.join('; '))
  // Per-response nonces must not be cached or changed by later HTML transforms.
  // no-transform also prevents Cloudflare email obfuscation changing hydrated markup.
  headers.set('cache-control', 'no-store, no-transform')
  headers.delete('etag')
  headers.delete('last-modified')
  headers.delete('content-length')
  const secured = new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  if (!response.body) return secured
  return new HTMLRewriter().on('script', {
    element(element) { element.setAttribute('nonce', nonce) },
  }).transform(secured)
}
