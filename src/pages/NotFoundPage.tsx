import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { Container, Eyebrow, GhostButton, PrimaryButton } from '../components/ui/primitives'

const Intro = styled.section`
  position: relative;
  min-height: 100svh;
  margin-top: calc(-92px - env(safe-area-inset-top));
  padding: calc(148px + env(safe-area-inset-top)) ${({ theme }) => theme.layout.pagePadding}
    clamp(54px, 8vw, 96px);
  display: flex;
  align-items: center;
  overflow: hidden;
  isolation: isolate;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.onDeep};

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    width: min(760px, 78vw);
    aspect-ratio: 1;
    top: -42%;
    right: -14%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99, 91, 255, 0.35), transparent 68%);
    filter: blur(18px);
    pointer-events: none;
  }

  @media (max-width: 760px) {
    min-height: 100svh;
    margin-top: calc(-78px - env(safe-area-inset-top));
    padding-top: calc(120px + env(safe-area-inset-top));
    align-items: flex-end;

    &::before {
      width: 130vw;
      top: -18%;
      right: -58%;
    }
  }
`

const Inner = styled.div`
  position: relative;
  max-width: 760px;
`

const Code = styled.span`
  position: absolute;
  z-index: -1;
  left: clamp(150px, 24vw, 330px);
  top: clamp(-118px, -10vw, -72px);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: clamp(150px, 28vw, 410px);
  font-weight: 600;
  line-height: 0.8;
  letter-spacing: -0.09em;
  color: rgba(247, 249, 252, 0.035);
  user-select: none;
  white-space: nowrap;

  @media (max-width: 760px) {
    left: 20vw;
    top: -27vw;
    font-size: 48vw;
  }
`

const Label = styled(Eyebrow)`
  margin-bottom: clamp(18px, 3vw, 28px);
  color: ${({ theme }) => theme.colors.status};
`

const Title = styled.h1`
  max-width: 11ch;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(48px, 8.4vw, 118px);
  font-weight: 700;
  line-height: 0.94;
  letter-spacing: -0.055em;
`

const Lead = styled.p`
  max-width: 46ch;
  margin-top: clamp(22px, 3vw, 34px);
  font-size: clamp(16px, 1.35vw, 20px);
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.onDeepDim};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: clamp(28px, 4vw, 42px);

  @media (max-width: 520px) {
    flex-direction: column;

    a {
      width: 100%;
      min-height: 52px;
    }
  }
`

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <Intro id="top">
      <Container>
        <Inner>
          <Code aria-hidden="true">404</Code>
          <Label>{t('notFound.eyebrow')}</Label>
          <Title>{t('notFound.title')}</Title>
          <Lead>{t('notFound.lead')}</Lead>
          <Actions>
            <PrimaryButton href="/">{t('notFound.home')}</PrimaryButton>
            <GhostButton href="/contact">{t('notFound.contact')}</GhostButton>
          </Actions>
        </Inner>
      </Container>
    </Intro>
  )
}
