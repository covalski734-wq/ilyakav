import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { SECTION_IDS } from '../config/site'
import { Container, SectionTitle } from '../components/ui/primitives'
import { grayscaleMedia } from '../theme/GlobalStyle'
import { useReveal } from '../hooks/useReveal'

const swapIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
`

const tintIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
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
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.line)};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: clamp(18px, 2.2vw, 26px);
  cursor: pointer;
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;
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
    position: static;
  }
`

const PreviewShot = styled.div`
  ${grayscaleMedia};
  position: relative;
  aspect-ratio: 4 / 3;
  background: linear-gradient(
    150deg,
    ${({ theme }) => theme.colors.surface2},
    ${({ theme }) => theme.colors.accentSoft}
  );
`

/** Re-keyed on every service change so the copy cross-fades instead of snapping. */
const PreviewBody = styled.div`
  padding: clamp(18px, 2.4vw, 28px);
  animation: ${swapIn} 0.45s cubic-bezier(0.2, 0.8, 0.3, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** The placeholder shot shifts its gradient with the active service. */
const PreviewShotTint = styled.div<{ $index: number }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    ${({ $index }) => 120 + $index * 22}deg,
    ${({ theme }) => theme.colors.accentSoft},
    ${({ theme }) => theme.colors.surface2}
  );
  animation: ${tintIn} 0.55s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const PreviewTag = styled.p`
  margin-bottom: 10px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.accent};
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

const SERVICE_KEYS = ['site', 'landing', 'redesign', 'app', 'desktop'] as const
type ServiceKey = (typeof SERVICE_KEYS)[number]

export function Services() {
  const { t } = useTranslation()
  const [active, setActive] = useState<ServiceKey>('site')
  const headRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const listRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.08 })
  const activeIndex = SERVICE_KEYS.indexOf(active)

  return (
    <Wrapper id={SECTION_IDS.services}>
      <Container>
        <Head ref={headRef}>
          <SectionTitle>{t('services.title')}</SectionTitle>
          <Price>{t('services.priceFrom')}</Price>
        </Head>

        <Layout>
          <List ref={listRef}>
            {SERVICE_KEYS.map((key) => (
              <Item
                key={key}
                tabIndex={0}
                $active={active === key}
                onMouseEnter={() => setActive(key)}
                onFocus={() => setActive(key)}
              >
                <ItemTitle>{t(`services.items.${key}.title` as const)}</ItemTitle>
                <ItemDesc>{t(`services.items.${key}.desc` as const)}</ItemDesc>
              </Item>
            ))}
          </List>

          <Preview>
            <PreviewShot>
              <PreviewShotTint $index={activeIndex} key={active} />
            </PreviewShot>
            <PreviewBody key={active}>
              <PreviewTag>{t(`services.items.${active}.tag` as const)}</PreviewTag>
              <PreviewTitle>{t(`services.items.${active}.previewTitle` as const)}</PreviewTitle>
              <PreviewNote>{t(`services.items.${active}.previewNote` as const)}</PreviewNote>
            </PreviewBody>
          </Preview>
        </Layout>
      </Container>
    </Wrapper>
  )
}
