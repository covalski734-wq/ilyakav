import type { TFunction } from 'i18next'
import { WEB_CASES, WEB_CASE_IDS } from './config/cases'
import { SERVICE_IDS, servicePath } from './config/services'
import { SITE_ORIGIN, isPublicPath, normalizePath } from '../shared/routes'
export function pageMeta(t: TFunction, pathname: string) {
  const path = normalizePath(pathname)
  const service = SERVICE_IDS.find(id => servicePath(id) === path)
  const project = WEB_CASE_IDS.find(id => WEB_CASES[id].path === path)
  const keys: Record<string, 'home' | 'about' | 'contact' | 'privacy' | 'cookies' | 'case' | 'notFound'> = { '/': 'home', '/about': 'about', '/contact': 'contact', '/privacy': 'privacy', '/cookies': 'cookies', '/case/marianaleus': 'case' }
  const key = keys[path] ?? 'notFound'
  return {
    title: service ? `${t(`offering.pages.${service}.title`)} | ilyakav` : project ? `${t(`webCases.projects.${project}.title`)} | ilyakav` : t(`meta.${key}Title`),
    description: service ? t(`offering.pages.${service}.lead`) : project ? t(`webCases.projects.${project}.summary`) : t(`meta.${key}Description`),
    canonical: SITE_ORIGIN + path,
    image: SITE_ORIGIN + '/brand/social-card.png',
    indexable: isPublicPath(path),
  }
}
export function updateMeta(meta: ReturnType<typeof pageMeta>) {
  document.title = meta.title
  const set = (attribute: 'name' | 'property', key: string, content: string) => {
    let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
    if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.append(node) }
    node.content = content
  }
  set('name', 'description', meta.description)
  set('name', 'robots', meta.indexable ? 'index,follow' : 'noindex,follow')
  for (const [key, content] of Object.entries({ title: meta.title, description: meta.description, url: meta.canonical, image: meta.image, type: 'website' })) set('property', `og:${key}`, content)
  for (const [key, content] of Object.entries({ card: 'summary_large_image', title: meta.title, description: meta.description, image: meta.image })) set('name', `twitter:${key}`, content)
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
  canonical.href = meta.canonical
}
