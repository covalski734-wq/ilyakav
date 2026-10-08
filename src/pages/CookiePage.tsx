import styled from 'styled-components'
import { Container, SectionTitle } from '../components/ui/primitives'
import { useConsentText } from '../components/consentText'
import { ModalButton } from '../components/ui/Modal'
import { gtmConfigured, openCookieSettings } from '../lib/consent'
import { SITE } from '../config/site'
const Content = styled.article`
  padding: 60px ${({ theme }) => theme.layout.pagePadding} 90px;
  h1 { margin-bottom: 24px; } h2 { font-family: ${({ theme }) => theme.fonts.display}; font-size: clamp(24px, 3vw, 36px); margin-bottom: 16px; }
  section { padding: 28px 0; border-top: 1px solid ${({ theme }) => theme.colors.line}; }
  p { max-width: 72ch; line-height: 1.75; color: ${({ theme }) => theme.colors.textDim}; margin-bottom: 20px; }
`
export function CookiePage() {
  const text = useConsentText()
  return <Content id="top"><Container>
    <SectionTitle as="h1">{text.policy}</SectionTitle><p>{text.policyIntro}</p>
    <ModalButton onClick={openCookieSettings}>{text.settings}</ModalButton>
    <section><h2>{text.inventory}</h2><p>{text.inventoryBody}</p></section>
    <section><h2>{text.necessary}</h2><p>{text.necessaryNote}</p><h2>{text.analytics}</h2><p>{text.analyticsNote}</p><h2>{text.marketing}</h2><p>{text.marketingNote}</p></section>
    <section><h2>{text.optional}</h2><p>{gtmConfigured ? text.enabledBody : text.optionalBody}</p></section>
    <section><h2>{text.external}</h2><p>{text.externalBody}</p></section>
    <section><h2>{text.withdrawal}</h2><p>{text.withdrawalBody}</p><ModalButton onClick={openCookieSettings}>{text.settings}</ModalButton></section>
    <section><h2>{text.review}</h2><p>{text.reviewBody}</p><a href={`mailto:${SITE.email}`}>{SITE.email}</a> · <a href="/privacy">{text.privacy}</a></section>
  </Container></Content>
}
