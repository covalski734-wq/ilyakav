import { useId, useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { ROUTES } from '../config/site'
import { PrimaryButton } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.section`
  padding: clamp(48px, 7vw, 100px) ${({ theme }) => theme.layout.pagePadding};
`

const Layout = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(26px, 5vw, 80px);
  align-items: start;
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(30px, 4vw, 58px);
  line-height: 1.02;
  letter-spacing: -0.045em;
  margin-bottom: 18px;
  max-width: 14ch;
`

const Lead = styled.p`
  margin-bottom: 26px;
  font-size: 17px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 42ch;
`

const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Item = styled.div<{ $open: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $open }) => ($open ? theme.colors.accent : theme.colors.line)};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px 24px;
  box-shadow: ${({ theme, $open }) => ($open ? theme.shadows.m : theme.shadows.s)};
  transition: box-shadow 0.4s ease;
`

const Question = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 600;
  font-size: 22px;
  line-height: 1.25;
`

/** Two bars crossing into a plus; the vertical one folds away when the answer opens. */
const Marker = styled.span<{ $open: boolean }>`
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.3, 1);

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 50% 0 auto 0;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.accent};
    transform: translateY(-50%);
    transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.3, 1);
  }

  &::after {
    transform: translateY(-50%) rotate(${({ $open }) => ($open ? '0deg' : '90deg')});
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::before,
    &::after {
      transition: none;
    }
  }
`

/** Collapsible region — the 0fr → 1fr grid row animates to the answer's natural height. */
const AnswerRegion = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition:
    grid-template-rows 0.45s cubic-bezier(0.2, 0.8, 0.3, 1),
    opacity 0.35s ease;

  > div {
    overflow: hidden;
    min-height: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const Answer = styled.p`
  margin-top: 12px;
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
`

const FAQ_KEYS = ['price', 'time', 'scope', 'existing', 'ownership', 'ads'] as const
type FaqKey = (typeof FAQ_KEYS)[number]

export function Faq() {
  const { t } = useTranslation()
  const [open, setOpen] = useState<FaqKey | null>(null)
  const baseId = useId()
  const copyRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const itemsRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.07 })

  const toggle = (key: FaqKey) => setOpen((current) => (current === key ? null : key))

  return (
    <Wrapper>
      <Layout>
        <div ref={copyRef}>
          <Title>{t('faq.title')}</Title>
          <Lead>{t('faq.lead')}</Lead>
          <PrimaryButton href={ROUTES.contact}>{t('actions.askDirect')}</PrimaryButton>
        </div>

        <Items ref={itemsRef}>
          {FAQ_KEYS.map((key) => {
            const isOpen = open === key
            const regionId = `${baseId}-${key}`

            return (
              <Item key={key} $open={isOpen}>
                <Question
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={regionId}
                  onClick={() => toggle(key)}
                >
                  {t(`faq.items.${key}.q` as const)}
                  <Marker $open={isOpen} aria-hidden="true" />
                </Question>

                <AnswerRegion id={regionId} role="region" $open={isOpen}>
                  <div>
                    <Answer>{t(`faq.items.${key}.a` as const)}</Answer>
                  </div>
                </AnswerRegion>
              </Item>
            )
          })}
        </Items>
      </Layout>
    </Wrapper>
  )
}
