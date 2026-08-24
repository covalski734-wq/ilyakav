import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { useReveal } from '../hooks/useReveal'

const Wrapper = styled.section`
  padding: 0 ${({ theme }) => theme.layout.pagePadding} clamp(30px, 5vw, 60px);
`

/** Deliberately empty slot — real quotes replace it, nothing invented in the meantime. */
const Slot = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: clamp(18px, 2.4vw, 26px) clamp(20px, 3vw, 34px);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  align-items: baseline;
`

const Label = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.accent};
`

const Text = styled.p`
  grid-column: span 2;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 62ch;
`

export function Testimonials() {
  const { t } = useTranslation()
  const slotRef = useReveal<HTMLDivElement>({ y: 20 })

  return (
    <Wrapper>
      <Slot ref={slotRef}>
        <Label>{t('testimonials.label')}</Label>
        <Text>{t('testimonials.text')}</Text>
      </Slot>
    </Wrapper>
  )
}
