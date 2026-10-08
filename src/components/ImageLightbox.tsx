import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Modal, ModalButton } from './ui/Modal'
import { useConsentText } from './consentText'
const Viewer = styled(Modal)`
  width: min(1440px, calc(100vw - 24px)); padding: 16px;
  header { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
  h2 { font-size: 18px; margin: 0; flex: 1 1 200px; }
`
const ImageArea = styled.div<{ $zoom: boolean }>`
  overflow: auto; max-height: 75dvh; text-align: center; overscroll-behavior: contain;
  img { display: block; margin: auto; width: ${({ $zoom }) => $zoom ? 'auto' : '100%'}; max-width: ${({ $zoom }) => $zoom ? 'none' : '100%'}; height: auto; max-height: ${({ $zoom }) => $zoom ? 'none' : '75dvh'}; object-fit: contain; }
`
export function ImageLightbox() {
  const text = useConsentText()
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null)
  const [zoom, setZoom] = useState(false)
  useEffect(() => {
    const open = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.defaultPrevented) return
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]')
      if (!link) return
      event.preventDefault(); setZoom(false)
      setImage({ src: link.href, alt: link.querySelector('img')?.alt ?? '' })
    }
    document.addEventListener('click', open)
    return () => document.removeEventListener('click', open)
  }, [])
  return image && <Viewer titleId="image-preview-title" onClose={() => setImage(null)}>
    <header><h2 id="image-preview-title">{image.alt || text.image}</h2><ModalButton onClick={() => setZoom(value => !value)} aria-pressed={zoom}>{text.zoom}</ModalButton><ModalButton onClick={() => setImage(null)}>{text.close}</ModalButton></header>
    <ImageArea $zoom={zoom} tabIndex={0} role="region" aria-label={text.image}><img src={image.src} alt={image.alt} /></ImageArea>
  </Viewer>
}
