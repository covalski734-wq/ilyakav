type Kind = 'site' | 'bot' | 'automation' | 'booking'

/** Small code-native illustrations, shared by the hero and service links. */
export function ServiceIcon({ kind }: { kind: Kind }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'site' && <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01M7 13h6M7 16h9" /></>}
    {kind === 'bot' && <><rect x="3" y="6" width="18" height="14" rx="5" /><path d="M12 3v3M8 12h.01M16 12h.01M8 16h8" /><circle cx="12" cy="2.5" r=".5" /></>}
    {kind === 'automation' && <><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="15" y="15" width="6" height="6" rx="1.5" /><path d="M9 6h6a3 3 0 0 1 3 3v3m-3-3 3 3 3-3M15 18H9a3 3 0 0 1-3-3v-3m-3 3 3-3 3 3" /></>}
    {kind === 'booking' && <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 10h18m-13 5 3 3 5-5" /></>}
  </svg>
}
