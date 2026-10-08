import { useEffect, useRef, type ReactNode } from 'react'
import styled from 'styled-components'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

const Panel = styled.dialog`
  position: fixed; inset: 0; margin: auto; padding: clamp(20px, 4vw, 32px);
  width: min(620px, calc(100vw - 24px)); max-height: calc(100dvh - 24px);
  overflow: auto; overscroll-behavior: contain;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.m};
  &::backdrop { background: rgb(7 9 14 / 72%); }
  h2 { font-family: ${({ theme }) => theme.fonts.display}; font-size: 28px; line-height: 1.1; margin-bottom: 16px; }
`
export const ModalButton = styled.button`
  min-height: 44px; padding: 10px 16px; border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md}; background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.text}; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  &:hover { border-color: ${({ theme }) => theme.colors.accent}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.accent}; outline-offset: 3px; }
`
export function Modal({ titleId, onClose, children, className }: { titleId: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose); closeRef.current = onClose
  useLockBodyScroll(true)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => { dialog.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }) }
  }, [])
  return <Panel ref={ref} className={className} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); closeRef.current() }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const nodes = [...ref.current!.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]')].filter(node => node.getClientRects().length)
    const first = nodes[0], last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }}>
    {children}
  </Panel>
}
