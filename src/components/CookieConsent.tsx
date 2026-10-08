import { useEffect, useState, useSyncExternalStore } from 'react'
import styled from 'styled-components'
import { denied, getConsent, gtmConfigured, saveConsent, subscribeConsent, type Choice } from '../lib/consent'
import { Modal, ModalButton } from './ui/Modal'
import { useConsentText } from './consentText'

const Banner = styled.section`
  position: fixed; z-index: 120; bottom: max(12px, env(safe-area-inset-bottom)); left: 12px; right: 12px;
  max-width: 1040px; margin: auto; padding: 20px; display: flex; align-items: center; gap: 20px;
  background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.line}; border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.m}; max-height: 55dvh; overflow: auto;
  h2 { font-size: 17px; margin-bottom: 6px; } p { font-size: 13px; line-height: 1.5; }
  @media (max-width: 760px) { display: block; padding: 16px; }
`
const Actions = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;
  > button { flex: 1 1 auto; }
`
const BannerActions = styled(Actions)`
  flex: 0 0 390px; margin: 0;
  @media (max-width: 760px) { margin-top: 12px; button { flex-basis: 40%; } }
`
const Copy = styled.p`font-size: 14px; line-height: 1.6; color: ${({ theme }) => theme.colors.textDim}; margin: 12px 0;`
const Category = styled.div`
  padding: 16px 0; border-top: 1px solid ${({ theme }) => theme.colors.line};
  label { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-weight: 600; cursor: pointer; }
  input { width: 22px; height: 22px; accent-color: ${({ theme }) => theme.colors.accent}; flex-shrink: 0; }
  p { margin: 6px 0 0; }
`
export function CookieConsent() {
  const text = useConsentText()
  const choice = useSyncExternalStore(subscribeConsent, getConsent, () => null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Choice>(denied)
  const [error, setError] = useState(false)
  const customize = () => { setDraft(getConsent() ?? denied); setOpen(true) }
  useEffect(() => {
    setReady(true)
    window.addEventListener('cookie-settings', customize)
    return () => window.removeEventListener('cookie-settings', customize)
  }, [])
  const save = (value: Choice) => { const persisted = saveConsent(value); setError(!persisted); setOpen(false) }
  const links = <><a href="/cookies">{text.policy}</a> · <a href="/privacy">{text.privacy}</a></>
  return <>
    {ready && !choice && !open && <Banner aria-labelledby="cookie-banner-title" data-cookie-banner>
      <div><h2 id="cookie-banner-title">{text.title}</h2><p>{text.intro} {links}</p></div>
      <BannerActions>
        <ModalButton onClick={() => save({ analytics: true, marketing: true })}>{text.accept}</ModalButton>
        <ModalButton onClick={() => save(denied)}>{text.reject}</ModalButton>
        <ModalButton onClick={customize}>{text.customize}</ModalButton>
      </BannerActions>
    </Banner>}
    {error && <Banner role="status"><p>{text.storageError}</p><ModalButton onClick={() => setError(false)}>{text.close}</ModalButton></Banner>}
    {open && <Modal titleId="cookie-settings-title" onClose={() => setOpen(false)}>
      <h2 id="cookie-settings-title">{text.settings}</h2><Copy>{text.expiry}</Copy>
      <Category><label><span>{text.necessary} · {text.always}</span><input type="checkbox" checked disabled /></label><Copy>{text.necessaryNote}</Copy></Category>
      {(['analytics', 'marketing'] as const).map(key => <Category key={key}>
        <label htmlFor={`consent-${key}`}>{text[key]}<input id={`consent-${key}`} type="checkbox" checked={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.checked })} aria-describedby={`consent-${key}-note`} /></label>
        <Copy id={`consent-${key}-note`}>{text[`${key}Note`]}</Copy>
      </Category>)}
      {!gtmConfigured && <Copy>{text.inactive}</Copy>}<Copy>{links}</Copy>
      <Actions><ModalButton onClick={() => save({ analytics: true, marketing: true })}>{text.accept}</ModalButton><ModalButton onClick={() => save(denied)}>{text.reject}</ModalButton></Actions>
      <Actions><ModalButton onClick={() => save(draft)}>{text.save}</ModalButton><ModalButton onClick={() => setOpen(false)}>{text.close}</ModalButton></Actions>
    </Modal>}
  </>
}
