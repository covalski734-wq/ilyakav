import { contactMailto, type MailDraft } from '../lib/mailto'
import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { trackEvent } from '../lib/consent'

import { Container, SectionTitle } from '../components/ui/primitives'
import { ROUTES, SITE } from '../config/site'
import { useReveal } from '../hooks/useReveal'
import { PROJECT_TYPES, isProjectType, validateContact, type ProjectType, type FieldErrors, type ContactField } from '../../shared/contact'

const Intro = styled.section`
  position: relative;
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(120px + env(safe-area-inset-top)) ${({ theme }) => theme.layout.pagePadding}
    28px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  isolation: isolate;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    width: min(820px, 80vw);
    aspect-ratio: 1;
    top: -58%;
    right: -12%;
    border-radius: 50%;
    background: radial-gradient(circle, ${({ theme }) => theme.colors.accent} 0%, transparent 68%);
    opacity: 0.3;
    filter: blur(24px);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0.1;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
    background-size: 76px 76px;
    mask-image: linear-gradient(115deg, #000, transparent 76%);
    -webkit-mask-image: linear-gradient(115deg, #000, transparent 76%);
  }

  @media (max-width: 760px) {
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(102px + env(safe-area-inset-top)) clamp(18px, 5vw, 24px) 24px;

    &::before {
      width: 120vw;
      top: -32%;
      right: -58%;
    }

    &::after {
      background-size: 44px 44px;
    }
  }
`

const IntroInner = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const IntroTitle = styled.h1`
  max-width: 18ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 700;
  font-size: clamp(38px, 4.2vw, 60px);
  line-height: 0.94;
  letter-spacing: -0.055em;
`

const IntroBottom = styled.div`
  width: 100%;
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px 40px;
`

const IntroLead = styled.p`
  max-width: 48ch;
  font-size: clamp(16px, 1.45vw, 20px);
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const ReplyNote = styled.p`
  padding: 9px 13px;
  border: 1px solid rgba(247, 249, 252, 0.12);
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

/** Direct contact is available before the form on every screen. */
const QuickContacts = styled.div`
  width: 100%;
  margin-top: 16px;
`

const QuickList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const QuickLink = styled.a`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-height: 44px;
  padding: 11px 15px;
  border: 1px solid rgba(247, 249, 252, 0.16);
  border-radius: ${({ theme }) => theme.radii.pill};
  background: rgba(9, 12, 18, 0.34);
  color: ${({ theme }) => theme.colors.onDeep};
  text-decoration: none;
  transition:
    background 0.25s ease,
    border-color 0.25s ease;

  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.onDeepDim};
  }

  strong {
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  &:hover {
    background: rgba(9, 12, 18, 0.62);
    border-color: rgba(247, 249, 252, 0.32);
  }
`

const Content = styled.section`
  padding: clamp(24px, 3vw, 42px) ${({ theme }) => theme.layout.pagePadding};
`

const Layout = styled(Container)`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.65fr);
  gap: clamp(24px, 5vw, 80px);
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Form = styled.form`
  padding: clamp(20px, 3vw, 36px);
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.s};
`

const FormTitle = styled(SectionTitle)`
  font-size: clamp(26px, 3vw, 36px);
`

const Fields = styled.fieldset`
  display: grid;
  min-width: 0;
  padding: 0;
  border: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Field = styled.label<{ $wide?: boolean }>`
  [role="alert"] { font-size: 13px; line-height: 1.45; font-weight: 600; }
  [aria-invalid="true"] { border-color: currentColor; border-width: 2px; }
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  ${({ $wide }) =>
    $wide &&
    css`
      grid-column: 1 / -1;
    `}
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`

const fieldStyles = css`
  width: 100%;
  min-height: 52px;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  padding: 13px 15px;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textDim};
    opacity: 0.74;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.textDim};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
    background: ${({ theme }) => theme.colors.surface};
  }
`

const Input = styled.input`
  ${fieldStyles};
`

const Select = styled.select`
  ${fieldStyles};
  cursor: pointer;
`

const Textarea = styled.textarea`
  ${fieldStyles};
  min-height: 168px;
  resize: vertical;
  line-height: 1.55;
`

const FormFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 20px;
  margin-top: 20px;
`

const Submit = styled.button`
  min-height: 54px;
  padding: 15px 28px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  transition:
    transform 0.25s ease,
    background 0.25s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentInk};
    transform: translateY(-2px);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
    transform: none;
  }

  @media (max-width: 520px) {
    width: 100%;
  }
`

/** Off-screen rather than `display: none`, which crawlers skip. */
const Honeypot = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

const Result = styled.div<{ $error?: boolean }>`
  margin-top: 22px;
  padding: 20px 22px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid
    ${({ theme, $error }) => ($error ? theme.colors.line : theme.colors.accent)};
  background: ${({ theme, $error }) => ($error ? theme.colors.surface2 : theme.colors.accentSoft)};
`

const ResultTitle = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: 20px;
  line-height: 1.2;
`

const ResultBody = styled.p`
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
`

const ResultLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 14px;

  a {
    font-weight: 600;
    font-size: 15px;
    color: ${({ theme }) => theme.colors.accent};
    overflow-wrap: anywhere;
  }
`

const Privacy = styled.p`
  flex: 1 1 230px;
  max-width: 46ch;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textDim};
`

const Direct = styled.aside`
  position: sticky;
  top: 112px;

  /* phones get the same links up beside the heading instead */
  @media (max-width: 900px) {
    display: none;
  }
`

const DirectTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 650;
  line-height: 1.05;
  letter-spacing: -0.04em;
`

const DirectLead = styled.p`
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
`

const DirectLinks = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 26px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`

const DirectLink = styled.a`
  display: grid;
  grid-template-columns: minmax(76px, auto) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 64px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: color 0.25s ease;

  span:first-child {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textDim};
  }

  span:nth-child(2) {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 14px;
    font-weight: 600;
  }

  &::after {
    content: '\\2197';
    font-size: 16px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ContactPage() {
  const { t } = useTranslation()
  const privacyId = useId()
  const introRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12, start: 'top 92%' })
  const formRef = useRef<HTMLFormElement>(null)
  const busy = useRef(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const directRef = useReveal<HTMLElement>({ y: 34, delay: 0.12 })

  const [status, setStatus] = useState<Status>('idle')
  const [mailDraft, setMailDraft] = useState<MailDraft | undefined>()
  const [initialType, setInitialType] = useState<ProjectType>('site')
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('type')
    if (isProjectType(requested)) setInitialType(requested)
  }, [])
  const fieldError = (field: ContactField) => errors[field] ? <span id={privacyId + '-' + field} role="alert">{t(`contact.form.errors.${errors[field]}`)}</span> : null
  const fieldAccessibility = (field: ContactField) => ({ 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? privacyId + '-' + field : undefined })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy.current) return

    // captured before the first await, after which React clears currentTarget
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const contact = String(data.get('contact') ?? '').trim()
    const brief = String(data.get('brief') ?? '').trim()
    const rawType = String(data.get('type') ?? 'other')
    const type = isProjectType(rawType) ? rawType : 'other'
    const validation = validateContact({ name, contact, brief, type })
    setErrors(validation.errors)
    if (!validation.valid) {
      const first = Object.keys(validation.errors)[0]
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      setStatus('idle')
      return
    }

    // A ready-made mail draft is kept aside so a failed send still has a way
    // out instead of losing everything the visitor typed.
    setMailDraft({ name, contact, type, brief })

    busy.current = true
    setStatus('sending')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15_000)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name,
          contact,
          type,
          brief,
          company: String(data.get('company') ?? ''),
        }),
      })

      const result: unknown = await response.json()
      if (!response.ok) {
        if (response.status === 422 && result && typeof result === 'object' && 'fields' in result && result.fields && typeof result.fields === 'object') {
          const fields: FieldErrors = {}
          for (const key of ['name', 'contact', 'brief', 'type'] as const) {
            const code = (result.fields as Record<string, unknown>)[key]
            if (code === 'required' || code === 'too_long' || code === 'invalid_contact' || code === 'invalid_type') fields[key] = code
          }
          setErrors(fields)
        }
        throw new Error(String(response.status))
      }
      if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
        throw new Error('Unconfirmed delivery')
      }

      trackEvent('generate_lead', 'contact_form')
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    } finally {
      window.clearTimeout(timeout)
      busy.current = false
    }
  }

  return (
    <>
      <Intro id="top">
        <IntroInner ref={introRef}>
          <IntroTitle>{t('contact.title')}</IntroTitle>
          <IntroBottom>
            <IntroLead>{t('contact.lead')}</IntroLead>
            <ReplyNote>{t('contact.replyNote')}</ReplyNote>
          </IntroBottom>

          <QuickContacts>
            <QuickList>
              <QuickLink href={SITE.telegram.url}>
                <span>{t('contact.direct.telegram')}</span>
                <strong>{SITE.telegram.handle}</strong>
              </QuickLink>
              <QuickLink href={contactMailto(t, { type: initialType })}>
                <span>{t('contact.direct.email')}</span>
                <strong>{SITE.email}</strong>
              </QuickLink>
            </QuickList>
          </QuickContacts>
        </IntroInner>
      </Intro>

      <Content id="project-form">
        <Layout>
          <Form
            noValidate
            ref={formRef}
            onSubmit={handleSubmit}
            onChange={(event) => {
              const name = (event.target as HTMLInputElement).name as ContactField
              setErrors(current => ({ ...current, [name]: undefined }))
              if (status === 'sent' || status === 'error') setStatus('idle')
            }}
            aria-describedby={privacyId}
            aria-busy={status === 'sending'}
          >
            <FormTitle>{t('contact.form.title')}</FormTitle>

            <Fields disabled={status === 'sending'}>
              <Field>
                <Label>{t('contact.form.nameLabel')}</Label>
                <Input
                  name="name" {...fieldAccessibility('name')}
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  placeholder={t('contact.form.namePlaceholder')}
                  required
                />
                {fieldError('name')}
              </Field>

              <Field>
                <Label>{t('contact.form.contactLabel')}</Label>
                <Input
                  name="contact" {...fieldAccessibility('contact')}
                  type="text"
                  autoComplete="email"
                  maxLength={200}
                  placeholder={t('contact.form.contactPlaceholder')}
                  required
                />
                {fieldError('contact')}
              </Field>

              <Field $wide>
                <Label>{t('contact.form.typeLabel')}</Label>
                <Select name="type" value={initialType} onChange={event => setInitialType(event.target.value as ProjectType)} {...fieldAccessibility('type')}>
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`contact.form.types.${type}` as const)}
                    </option>
                  ))}
                </Select>
                {fieldError('type')}
              </Field>

              <Field $wide>
                <Label>{t('contact.form.briefLabel')}</Label>
                <Textarea
                  name="brief" {...fieldAccessibility('brief')}
                  placeholder={t('contact.form.briefPlaceholder')}
                  rows={6}
                  maxLength={3500}
                  required
                />
                {fieldError('brief')}
              </Field>
            </Fields>

            <Honeypot aria-hidden="true">
              <input name="company" type="text" tabIndex={-1} autoComplete="off" />
            </Honeypot>

            <FormFooter>
              <Submit type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? t('contact.form.sending') : t('contact.form.submit')}
              </Submit>
              <Privacy id={privacyId}>{t('contact.form.privacyNote')} <a href={ROUTES.privacy}>{t('footer.privacy')}</a></Privacy>
            </FormFooter>

            {status === 'sent' && (
              <Result role="status">
                <ResultTitle>{t('contact.form.sentTitle')}</ResultTitle>
                <ResultBody>{t('contact.form.sentBody')}</ResultBody>
              </Result>
            )}

            {status === 'error' && (
              <Result $error role="alert">
                <ResultTitle>{t('contact.form.errorTitle')}</ResultTitle>
                <ResultBody>{t('contact.form.errorBody')}</ResultBody>
                <ResultLinks>
                  <a href={SITE.telegram.url}>{SITE.telegram.handle}</a>
                  <a href={contactMailto(t, { draft: mailDraft })}>{t('contact.form.errorMailAction')}</a>
                </ResultLinks>
              </Result>
            )}
          </Form>

          <Direct ref={directRef}>
            <DirectTitle>{t('contact.direct.title')}</DirectTitle>
            <DirectLead>{t('contact.direct.lead')}</DirectLead>

            <DirectLinks>
              <DirectLink href={contactMailto(t, { type: initialType })}>
                <span>{t('contact.direct.email')}</span>
                <span>{SITE.email}</span>
              </DirectLink>
              <DirectLink href={SITE.telegram.url}>
                <span>{t('contact.direct.telegram')}</span>
                <span>{SITE.telegram.handle}</span>
              </DirectLink>
            </DirectLinks>
          </Direct>
        </Layout>
      </Content>
    </>
  )
}
