import { useId, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { SECTION_IDS } from '../config/site'
import { Container, SectionTitle } from '../components/ui/primitives'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReveal } from '../hooks/useReveal'
import { servicePath } from '../config/services'

const swapIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`

const PreviewShot = styled.div`
  overflow: hidden;
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  position: relative;
  aspect-ratio: 3 / 2;
  background: linear-gradient(
    150deg,
    ${({ theme }) => theme.colors.surface2},
    ${({ theme }) => theme.colors.accentSoft}
  );
`

const InlineShot = styled(PreviewShot)`
  width: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: 20px;
`

const Wrapper = styled.section`
  padding: ${({ theme }) => theme.layout.sectionPadding} ${({ theme }) => theme.layout.pagePadding};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.xl};

  @media (max-width: 760px) {
    border-radius: ${({ theme }) => theme.radii.lg};
  }
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: clamp(24px, 3.5vw, 48px);
`

const Price = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.accent};
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr));
  gap: clamp(18px, 3vw, 44px);
  align-items: start;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Item = styled.div<{ $active: boolean }>`
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.line)};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: clamp(18px, 2.2vw, 26px);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease,
    border-color 0.35s ease;
  transform: ${({ $active }) => ($active ? 'translateX(6px)' : 'none')};
  box-shadow: ${({ theme, $active }) => ($active ? theme.shadows.s : 'none')};

  &:hover {
    transform: translateX(6px);
    box-shadow: ${({ theme }) => theme.shadows.s};
  }

  @media (max-width: 760px) {
    transform: none;

    &:hover {
      transform: none;
    }
  }
`
const ItemButton = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.radii.lg};
  }
`

/** Phone-only disclosure: the preview copy opens under the service it belongs to. */
const Details = styled.div`
  &[hidden] { display: none; }
  position: relative;
  z-index: 2;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  animation: ${swapIn} 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const ItemTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: clamp(22px, 2.2vw, 30px);
  margin-bottom: 6px;
`

const ItemDesc = styled.p`
  font-size: 15px;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 48ch;
`

/** Sticky preview that follows whichever service is hovered or focused. */
const Preview = styled.div`
  position: sticky;
  top: 110px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.m};

  @media (max-width: 760px) {
    display: none;
  }
`


/** Re-keyed on every service change so the copy cross-fades instead of snapping. */
const PreviewBody = styled.div`
  padding: clamp(18px, 2.4vw, 28px);
  animation: ${swapIn} 0.45s cubic-bezier(0.2, 0.8, 0.3, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const PreviewTitle = styled.p`
  margin-bottom: 8px;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 26px;
  line-height: 1.15;
`

const PreviewNote = styled.p`
  font-size: 15px;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textDim};
`

const ServiceTerms = styled.p`
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  font-size: 14px;
  font-weight: 600;
  span { display: block; margin-top: 5px; color: ${({ theme }) => theme.colors.textDim}; font-size: 12px; font-weight: 400; }
`
const ServiceLink = styled.a`
  display: inline-flex; align-items: center; gap: 14px; min-height: 44px;
  margin-top: 12px; font-size: 14px; font-weight: 600;
  text-decoration: underline; text-underline-offset: 5px;
  &:hover { color: ${({ theme }) => theme.colors.accent}; }
`
const Extensions = styled.div`
  margin-top: clamp(44px, 6vw, 80px); padding-top: 32px;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  > h3 { font-size: clamp(26px, 3vw, 40px); line-height: 1.15; letter-spacing: -.035em; }
  > p { max-width: 65ch; margin-top: 14px; font-size: 15px; color: ${({ theme }) => theme.colors.textDim}; }
`
const ExtensionGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 3vw, 44px); margin: 32px 0 26px;
  @media (max-width: 760px) { grid-template-columns: 1fr; gap: 24px; }
`
const Extension = styled.a`
  display: flex; flex-direction: column; align-items: start; color: inherit; text-decoration: none;
  h4 { width: 100%; display: flex; justify-content: space-between; gap: 16px; font-size: 21px; line-height: 1.25; letter-spacing: -.025em; }
  p { margin-top: 12px; font-size: 14px; line-height: 1.65; color: ${({ theme }) => theme.colors.textDim}; }
  > span { margin-top: auto; padding-top: 16px; font-size: 12px; text-decoration: underline; text-underline-offset: 4px; }
  &:hover h4 { color: ${({ theme }) => theme.colors.accent}; }
  @media (max-width: 760px) { padding-bottom: 22px; border-bottom: 1px solid ${({ theme }) => theme.colors.line}; }
`

const SERVICE_KEYS = ['site', 'landing', 'redesign', 'app', 'desktop'] as const
type ServiceKey = (typeof SERVICE_KEYS)[number]

type PhotoKey = ServiceKey | 'bot' | 'automation' | 'booking'

function ServicePhoto({ kind, compact = false }: { kind: PhotoKey; compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <img
      src={`/media/services/${kind}-v1.webp`}
      srcSet={`/media/services/${kind}-v1-600.webp 600w, /media/services/${kind}-v1.webp 1200w`}
      sizes={compact ? '(max-width: 760px) calc(100vw - 80px), (max-width: 1200px) 30vw, 380px' : '(max-width: 760px) calc(100vw - 100px), (max-width: 1200px) 45vw, 620px'}
      alt={t(`services.images.${kind}`)}
      width={1200}
      height={800}
      loading="lazy"
      decoding="async"
    />
  )
}

export function Services() {
  const { t } = useTranslation()
  const [active, setActive] = useState<ServiceKey>('site')
  const [expanded, setExpanded] = useState<ServiceKey | null>('site')
  const headRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const listRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.08 })
  const phone = useMediaQuery('(max-width: 760px)')
  const detailsId = useId()

  return (
    <Wrapper id={SECTION_IDS.services}>
      <Container>
        <Head ref={headRef}>
          <SectionTitle>{t('services.title')}</SectionTitle>
          <Price>{t('services.priceFrom')}</Price>
        </Head>

        <Layout>
          <List ref={listRef}>
            {SERVICE_KEYS.map((key) => {
              const open = phone ? expanded === key : active === key

              return (
                <Item key={key} $active={open}>
                  <ItemTitle>
                    <ItemButton
                      type="button"
                      aria-expanded={phone ? open : undefined}
                      aria-pressed={phone ? undefined : open}
                      aria-controls={phone ? `${detailsId}-${key}` : undefined}
                      onClick={() => {
                        setActive(key)
                        setExpanded(current => current === key ? null : key)
                      }}
                      // Keyboard users select with Enter/Space so tabbing to
                      // the preview link does not silently change their choice.
                      onMouseEnter={phone ? undefined : () => setActive(key)}
                    >
                      {t(`services.items.${key}.title` as const)}
                    </ItemButton>
                  </ItemTitle>
                  <ItemDesc>{t(`offering.pages.${key}.lead`)}</ItemDesc>

                  {phone && (
                    <Details id={`${detailsId}-${key}`} hidden={!open}>
                      {open && <InlineShot><ServicePhoto kind={key} /></InlineShot>}
                      <PreviewTitle>
                        {t(`services.items.${key}.previewTitle` as const)}
                      </PreviewTitle>
                      <PreviewNote>{t(`services.items.${key}.previewNote` as const)}</PreviewNote>
                      <ServiceTerms>{t(`services.items.${key}.price`)}<span>{t(`services.items.${key}.timing`)}</span></ServiceTerms>
                      <ServiceLink href={servicePath(key)}>{t('offering.learn')} <span aria-hidden="true">↗</span></ServiceLink>
                    </Details>
                  )}
                </Item>
              )
            })}
          </List>

          {!phone && <Preview>
            <PreviewShot>
              <ServicePhoto kind={active} />
            </PreviewShot>
            <PreviewBody key={active}>
              <PreviewTitle>{t(`services.items.${active}.previewTitle` as const)}</PreviewTitle>
              <PreviewNote>{t(`services.items.${active}.previewNote` as const)}</PreviewNote>
              <ServiceTerms>{t(`services.items.${active}.price`)}<span>{t(`services.items.${active}.timing`)}</span></ServiceTerms>
              <ServiceLink href={servicePath(active)}>{t('offering.learn')} <span aria-hidden="true">↗</span></ServiceLink>
            </PreviewBody>
          </Preview>}
        </Layout>
        <Extensions>
          <h3>{t('services.extensions.title')}</h3>
          <p>{t('services.extensions.lead')}</p>
          <ExtensionGrid>
            {(['bot', 'automation', 'booking'] as const).map(key => <Extension key={key} href={servicePath(key)}>
              <InlineShot><ServicePhoto kind={key} compact /></InlineShot>
              <h4>{t(`services.extensions.items.${key}.title`)}<span aria-hidden="true">↗</span></h4>
              <p>{t(`services.extensions.items.${key}.desc`)}</p>
              <span>{t('offering.learn')}</span>
            </Extension>)}
          </ExtensionGrid>
          <p>{t('services.extensions.note')}</p>
        </Extensions>
      </Container>
    </Wrapper>
  )
}
