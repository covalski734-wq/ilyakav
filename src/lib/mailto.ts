import type { TFunction } from 'i18next'
import { SITE } from '../config/site.ts'
import { SERVICE_PAGES } from '../config/services.ts'
import type { ProjectType } from '../../shared/contact.ts'

export type MailDraft = { name: string; contact: string; type: ProjectType; brief: string }
type MailContext = { scenario?: 'project' | 'privacy' | 'cookies'; type?: ProjectType; draft?: MailDraft }

export function mailContextForPath(pathname: string): MailContext {
  if (pathname === '/privacy') return { scenario: 'privacy' }
  if (pathname === '/cookies') return { scenario: 'cookies' }
  const service = Object.values(SERVICE_PAGES).find(item => pathname === `/services/${item.slug}`)
  return service ? { type: service.type } : {}
}

export function contactMailto(t: TFunction, { scenario = 'project', type, draft }: MailContext = {}): string {
  const projectType = draft?.type ?? type
  const typeLabel = projectType ? t(`contact.form.types.${projectType}`) : t('emailDraft.project.typePlaceholder')
  const values = { ...draft, type: typeLabel }
  const template = draft ? 'form' : scenario === 'project' && projectType ? 'service' : scenario
  const subject = t(`emailDraft.${template}.subject`, values).replace(/[\r\n]+/g, ' ')
  const body = t(`emailDraft.${template}.body`, values)
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
