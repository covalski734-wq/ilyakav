import { type FormEvent, useId } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { Container, Eyebrow, SectionTitle } from '../components/ui/primitives'
import { SITE } from '../config/site'
import { useReveal } from '../hooks/useReveal'
import { breathe } from '../theme/GlobalStyle'

const Intro = styled.section`
  position: relative;
  min-height: min(720px, 72svh);
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(156px + env(safe-area-inset-top)) ${({ theme }) => theme.layout.pagePadding}
    clamp(62px, 9vw, 120px);
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
    min-height: min(660px, 78svh);
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding: calc(126px + env(safe-area-inset-top)) clamp(18px, 5vw, 24px) 58px;

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

const IntroEyebrow = styled(Eyebrow)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: clamp(20px, 3vw, 34px);
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const Pulse = styled.span`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status};
  box-shadow: 0 0 0 4px rgba(85, 214, 160, 0.1);
  animation: ${breathe} 2.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const IntroTitle = styled.h1`
  max-width: 12ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 700;
  font-size: clamp(48px, 7.8vw, 116px);
  line-height: 0.94;
  letter-spacing: -0.055em;
`

const IntroBottom = styled.div`
  width: 100%;
  margin-top: clamp(28px, 4vw, 48px);
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

const Content = styled.section`
  padding: clamp(52px, 8vw, 112px) ${({ theme }) => theme.layout.pagePadding};
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
  padding: clamp(24px, 4vw, 54px);
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.s};
`

const FormTitle = styled(SectionTitle)`
  font-size: clamp(30px, 4vw, 54px);
`

const FormLead = styled.p`
  max-width: 50ch;
  margin-top: 14px;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 16px;
  line-height: 1.6;
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: clamp(28px, 4vw, 42px);

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Field = styled.label<{ $wide?: boolean }>`
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

  @media (max-width: 520px) {
    width: 100%;
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

  @media (max-width: 900px) {
    position: static;
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

const PROJECT_TYPES = ['site', 'landing', 'webApp', 'desktop', 'redesign', 'other'] as const
type ProjectType = (typeof PROJECT_TYPES)[number]

export function ContactPage() {
  const { t } = useTranslation()
  const privacyId = useId()
  const introRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12, start: 'top 92%' })
  const formRef = useReveal<HTMLFormElement>({ y: 34 })
  const directRef = useReveal<HTMLElement>({ y: 34, delay: 0.12 })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const contact = String(data.get('contact') ?? '').trim()
    const brief = String(data.get('brief') ?? '').trim()
    const rawType = String(data.get('type') ?? 'other')
    const type: ProjectType = PROJECT_TYPES.includes(rawType as ProjectType) ? (rawType as ProjectType) : 'other'

    const subject = t('contact.form.emailSubject', { name })
    const body = [
      `${t('contact.form.nameLabel')}: ${name}`,
      `${t('contact.form.contactLabel')}: ${contact}`,
      `${t('contact.form.typeLabel')}: ${t(`contact.form.types.${type}` as const)}`,
      '',
      `${t('contact.form.briefLabel')}:`,
      brief,
    ].join('\n')

    window.location.assign(`mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return (
    <>
      <Intro id="top">
        <IntroInner ref={introRef}>
          <IntroEyebrow>
            <Pulse aria-hidden="true" />
            {t('contact.eyebrow')}
          </IntroEyebrow>
          <IntroTitle>{t('contact.title')}</IntroTitle>
          <IntroBottom>
            <IntroLead>{t('contact.lead')}</IntroLead>
            <ReplyNote>{t('contact.replyNote')}</ReplyNote>
          </IntroBottom>
        </IntroInner>
      </Intro>

      <Content>
        <Layout>
          <Form ref={formRef} onSubmit={handleSubmit} aria-describedby={privacyId}>
            <FormTitle>{t('contact.form.title')}</FormTitle>
            <FormLead>{t('contact.form.lead')}</FormLead>

            <Fields>
              <Field>
                <Label>{t('contact.form.nameLabel')}</Label>
                <Input
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t('contact.form.namePlaceholder')}
                  required
                />
              </Field>

              <Field>
                <Label>{t('contact.form.contactLabel')}</Label>
                <Input
                  name="contact"
                  type="text"
                  autoComplete="email"
                  placeholder={t('contact.form.contactPlaceholder')}
                  required
                />
              </Field>

              <Field $wide>
                <Label>{t('contact.form.typeLabel')}</Label>
                <Select name="type" defaultValue="site">
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`contact.form.types.${type}` as const)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field $wide>
                <Label>{t('contact.form.briefLabel')}</Label>
                <Textarea
                  name="brief"
                  placeholder={t('contact.form.briefPlaceholder')}
                  rows={6}
                  required
                />
              </Field>
            </Fields>

            <FormFooter>
              <Submit type="submit">{t('contact.form.submit')}</Submit>
              <Privacy id={privacyId}>{t('contact.form.privacyNote')}</Privacy>
            </FormFooter>
          </Form>

          <Direct ref={directRef}>
            <DirectTitle>{t('contact.direct.title')}</DirectTitle>
            <DirectLead>{t('contact.direct.lead')}</DirectLead>

            <DirectLinks>
              <DirectLink href={`mailto:${SITE.email}`}>
                <span>{t('contact.direct.email')}</span>
                <span>{SITE.email}</span>
              </DirectLink>
              <DirectLink href={SITE.telegram.url}>
                <span>{t('contact.direct.telegram')}</span>
                <span>{SITE.telegram.handle}</span>
              </DirectLink>
              <DirectLink href={SITE.phone.href}>
                <span>{t('contact.direct.phone')}</span>
                <span>{SITE.phone.display}</span>
              </DirectLink>
            </DirectLinks>
          </Direct>
        </Layout>
      </Content>
    </>
  )
}
