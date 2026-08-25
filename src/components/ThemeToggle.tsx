import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { useTheme } from '../theme/ThemeContext'

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 42px;
  height: 42px;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.25s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`

/** Half-filled dot that rotates 180° between light and dark. */
const Dot = styled.span<{ $dark: boolean }>`
  display: block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.text} 50%, transparent 50%);
  box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.text};
  transform: ${({ $dark }) => ($dark ? 'rotate(180deg)' : 'none')};
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.3, 1);
`

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <ToggleButton type="button" onClick={toggleTheme} aria-label={t('actions.themeAria')}>
      <Dot $dark={mode === 'dark'} data-theme-dot />
    </ToggleButton>
  )
}
