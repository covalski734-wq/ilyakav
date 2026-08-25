import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { Section } from '../components/ui/primitives'
import { useReveal } from '../hooks/useReveal'

const Layout = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(26px, 4vw, 80px);
  align-items: center;
`

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 650;
  font-size: clamp(30px, 4vw, 58px);
  line-height: 1.02;
  letter-spacing: -0.045em;
  margin-bottom: 20px;
  max-width: 20ch;
`

const Paragraph = styled.p`
  font-size: 17px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textDim};
  max-width: 48ch;

  & + & {
    margin-top: 14px;
  }
`

const Roles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const LeadRole = styled.div`
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 22px 26px;
  box-shadow: ${({ theme }) => theme.shadows.s};

  p {
    font-family: ${({ theme }) => theme.fonts.display};
    font-weight: 600;
    font-size: 22px;
  }
`

const SupportRole = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px 26px;
  box-shadow: ${({ theme }) => theme.shadows.s};

  p {
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const SUPPORT_ROLES = ['backend', 'desktop', 'ads'] as const

export function Team() {
  const { t } = useTranslation()
  const copyRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.12 })
  const rolesRef = useReveal<HTMLDivElement>({ children: true, stagger: 0.09 })

  return (
    <Section>
      <Layout>
        <div ref={copyRef}>
          <Title>{t('team.title')}</Title>
          <Paragraph>{t('team.p1')}</Paragraph>
          <Paragraph>{t('team.p2')}</Paragraph>
        </div>

        <Roles ref={rolesRef}>
          <LeadRole>
            <p>{t('team.lead')}</p>
          </LeadRole>
          {SUPPORT_ROLES.map((role) => (
            <SupportRole key={role}>
              <p>{t(`team.${role}` as const)}</p>
            </SupportRole>
          ))}
        </Roles>
      </Layout>
    </Section>
  )
}
