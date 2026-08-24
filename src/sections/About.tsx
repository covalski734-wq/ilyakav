import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { FEATURE_FLAGS, SECTION_IDS } from '../config/site'
import { Section } from '../components/ui/primitives'
import { grayscaleMedia } from '../theme/GlobalStyle'
import { useReveal } from '../hooks/useReveal'

const Layout = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: clamp(28px, 5vw, 88px);
  align-items: center;
`

const PortraitWrap = styled.div`
  position: relative;
`

const Portrait = styled.div`
  ${grayscaleMedia};
  aspect-ratio: 4 / 5;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: linear-gradient(
    150deg,
    ${({ theme }) => theme.colors.surface2},
    ${({ theme }) => theme.colors.accentSoft}
  );
  display: flex;
  align-items: flex-end;
  padding: 22px;
  box-shadow: ${({ theme }) => theme.shadows.m};

  span {
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const Badge = styled.div`
  position: absolute;
  right: -8px;
  bottom: -14px;

  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 12px 20px;
  font-size: 14px;
  box-shadow: ${({ theme }) => theme.shadows.m};
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-weight: 400;
  font-size: clamp(30px, 4vw, 58px);
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
  max-width: 22ch;
`

const Paragraph = styled.p`
  margin-bottom: 16px;
  font-size: 17px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 50ch;

  &:last-of-type {
    margin-bottom: 24px;
  }
`

const Name = styled.p`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 24px;
`

const Role = styled.p`
  margin-top: 4px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textDim};
`

export function About() {
  const { t } = useTranslation()
  const portraitRef = useReveal<HTMLDivElement>({ y: 34 })
  const copyRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.1 })
  // pops in a beat after the portrait has settled
  const badgeRef = useReveal<HTMLDivElement>({
    y: 10,
    scale: 0.7,
    delay: 0.45,
    duration: 0.5,
    ease: 'back.out(2)',
  })

  return (
    <Section id={SECTION_IDS.about}>
      <Layout>
        <PortraitWrap ref={portraitRef}>
          <Portrait>
            <span>{t('about.portraitNote')}</span>
          </Portrait>
          {FEATURE_FLAGS.personality && (
            <Badge ref={badgeRef}>
              <span>{t('about.badge')}</span>
            </Badge>
          )}
        </PortraitWrap>

        <div ref={copyRef}>
          <Title>{t('about.title')}</Title>
          <Paragraph>{t('about.p1')}</Paragraph>
          <Paragraph>{t('about.p2')}</Paragraph>
          <Name>Ilya Kavaleuski</Name>
          <Role>{t('about.role')}</Role>
        </div>
      </Layout>
    </Section>
  )
}
