import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { ROUTES, SITE } from '../config/site'

/** Thumb-reach action bar — phones only, matching where ad traffic actually lands. */
const Bar = styled.div`
  display: none;
  position: fixed;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 90;
  border-radius: ${({ theme }) => theme.radii.pill};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.accent};
  box-shadow: ${({ theme }) => theme.shadows.l};

  @media (max-width: 760px) {
    display: flex;
  }
`

const Primary = styled.a`
  flex: 1;
  padding: 16px 22px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
`

const Secondary = styled.a`
  padding: 16px 22px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  background: rgba(0, 0, 0, 0.14);
`

export function BottomBar() {
  const { t } = useTranslation()

  return (
    <Bar>
      <Primary href={ROUTES.contact}>{t('actions.startProject')}</Primary>
      <Secondary href={SITE.telegram.url}>Telegram</Secondary>
    </Bar>
  )
}
