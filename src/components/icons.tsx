type P = { className?: string }
const base = 'w-5 h-5'
const svg = (d: React.ReactNode, extra?: string) => ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
       strokeLinecap="round" strokeLinejoin="round" className={className ?? `${base} ${extra ?? ''}`}>
    {d}
  </svg>
)

export const IconClock    = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
export const IconWallet   = svg(<><path d="M3 8a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" /><path d="M3 8v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2Z" /><circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" /></>)
export const IconPlus     = svg(<><path d="M12 5v14M5 12h14" /></>)
export const IconUsers    = svg(<><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" /><circle cx="10" cy="8" r="3.2" /><path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4" /><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6" /></>)
export const IconUser     = svg(<><path d="M19 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 5 18.5V20" /><circle cx="12" cy="8" r="3.6" /></>)
export const IconCheck    = svg(<><path d="M4.5 12.5 9.5 17.5 19.5 7" /></>)
export const IconRight    = svg(<><path d="M9 6l6 6-6 6" /></>)
export const IconLeft     = svg(<><path d="M15 6l-6 6 6 6" /></>)
export const IconTrash    = svg(<><path d="M4 7h16M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" /><path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" /></>)
export const IconLogout   = svg(<><path d="M15 12H4.5M12 8.5 15.5 12 12 15.5" /><path d="M9 6.5V5a2 2 0 0 1 2-2h6.5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-1.5" /></>)
export const IconCalendar = svg(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3.5V6.5M16 3.5V6.5" /></>)
export const IconCopy     = svg(<><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" /></>)
export const IconX        = svg(<><path d="M6 6l12 12M18 6 6 18" /></>)
export const IconEdit     = svg(<><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="M15 6l3 3" /></>)
export const IconBell     = svg(<><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></>)
export const IconChart    = svg(<><path d="M4.5 19.5h15" /><rect x="6" y="12" width="3.2" height="5" rx="1" /><rect x="11.5" y="8" width="3.2" height="9" rx="1" /><rect x="17" y="5" width="3.2" height="12" rx="1" /></>)
export const IconKey      = svg(<><circle cx="8" cy="12" r="3.5" /><path d="M11.5 12H20M17 12v3M20 12v2.5" /></>)
export const IconInfo     = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>)
export const IconShare    = svg(<><path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" /><path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" /></>)
export const IconRegalo  = svg(<><rect x="3.5" y="9.5" width="17" height="11" rx="2" /><path d="M3 9.5h18M12 9.5V20.5" /><path d="M12 9.5S10.5 5.5 8.2 5.5a2.2 2.2 0 0 0 0 4.4M12 9.5s1.5-4 3.8-4a2.2 2.2 0 0 1 0 4.4" /></>)
export const IconOcchio  = svg(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3.2" /></>)
export const IconSun      = svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" /></>)
