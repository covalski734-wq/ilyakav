import type { ComponentType } from 'react'
import { WEB_CASES, WEB_CASE_IDS } from './config/cases'
import { SERVICE_IDS, servicePath } from './config/services'
import { normalizePath } from '../shared/routes'
export async function loadPage(pathname: string): Promise<ComponentType> {
  const path = normalizePath(pathname)
  switch (path) {
    case '/': return (await import('./pages/HomePage')).HomePage
    case '/contact': return (await import('./pages/ContactPage')).ContactPage
    case '/about': return (await import('./pages/AboutPage')).AboutPage
    case '/privacy': return (await import('./pages/PrivacyPage')).PrivacyPage
    case '/cookies': return (await import('./pages/CookiePage')).CookiePage
    case '/case/marianaleus': return (await import('./pages/MarianaleusCasePage')).MarianaleusCasePage
  }
  const service = SERVICE_IDS.find(id => servicePath(id) === path)
  if (service) {
    const { ServicePage } = await import('./pages/ServicePage')
    return () => <ServicePage id={service} />
  }
  const project = WEB_CASE_IDS.find(id => WEB_CASES[id].path === path)
  if (project) {
    const { WebCasePage } = await import('./pages/WebCasePage')
    return () => <WebCasePage id={project} />
  }
  return (await import('./pages/NotFoundPage')).NotFoundPage
}
