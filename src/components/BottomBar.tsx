import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { ROUTES, SITE } from '../config/site'

/** Thumb-reach action bar — phones only, matching where ad traffic actually lands. */
const Bar = styled.div<{ $visible: boolean }>`
  display: none;
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 60;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 17px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.accent};
  box-shadow: ${({ theme }) => theme.shadows.l};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '18px')});
  transition:
    opacity 0.28s ease,
    transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1),
    visibility 0.28s;

  @media (max-width: 760px) {
    display: flex;
  }

  /* A fixed two-button bar consumes too much of a short landscape viewport;
     the same actions remain available in the mobile menu. */
  @media (max-height: 600px) and (orientation: landscape) {
    display: none;
  }
`

const Primary = styled.a`
  flex: 1;
  padding: 15px 20px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
`

const Secondary = styled.a`
  padding: 15px 20px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  background: rgba(0, 0, 0, 0.14);
`

export function BottomBar() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('top')
    if (!hero) return

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <Bar $visible={visible} aria-hidden={!visible}>
      <Primary href={ROUTES.contact}>{t('actions.startProject')}</Primary>
      <Secondary href={SITE.telegram.url}>Telegram</Secondary>
    </Bar>
  )
}
