/** Jeu d'icônes en trait, 1.6px, héritant de la couleur du texte. */
interface IconProps { size?: number; className?: string }

function Svg({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" focusable="false"
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="3" width="7" height="8" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></Svg>
)
export const IconIncome = (p: IconProps) => (
  <Svg {...p}><path d="M12 20V4" /><path d="m5 11 7-7 7 7" /></Svg>
)
export const IconExpense = (p: IconProps) => (
  <Svg {...p}><path d="M12 4v16" /><path d="m19 13-7 7-7-7" /></Svg>
)
export const IconBudget = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></Svg>
)
export const IconSavings = (p: IconProps) => (
  <Svg {...p}><path d="M3 9.5A3.5 3.5 0 0 1 6.5 6H15a6 6 0 0 1 6 6v1.5a4.5 4.5 0 0 1-2 3.7V20h-3v-1.5h-4V20H9v-2.2a6 6 0 0 1-2.6-3.3H4.5A1.5 1.5 0 0 1 3 13z" /><circle cx="16.5" cy="11.5" r="0.7" fill="currentColor" /></Svg>
)
export const IconInvest = (p: IconProps) => (
  <Svg {...p}><path d="M3 20h18" /><path d="M6 16v-4" /><path d="M11 16V8" /><path d="M16 16v-6" /><path d="M21 16V5" /></Svg>
)
export const IconWealth = (p: IconProps) => (
  <Svg {...p}><path d="m3 10 9-6 9 6" /><path d="M5 10v9" /><path d="M19 10v9" /><path d="M9 19v-5h6v5" /><path d="M3 20h18" /></Svg>
)
export const IconPlus = (p: IconProps) => (<Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>)
export const IconEdit = (p: IconProps) => (<Svg {...p}><path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" /><path d="M13.5 6.5 17.5 10.5" /></Svg>)
export const IconTrash = (p: IconProps) => (<Svg {...p}><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></Svg>)
export const IconSearch = (p: IconProps) => (<Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Svg>)
export const IconClose = (p: IconProps) => (<Svg {...p}><path d="M6 6 18 18" /><path d="M18 6 6 18" /></Svg>)
export const IconChevronLeft = (p: IconProps) => (<Svg {...p}><path d="m14 6-6 6 6 6" /></Svg>)
export const IconChevronRight = (p: IconProps) => (<Svg {...p}><path d="m10 6 6 6-6 6" /></Svg>)
export const IconSettings = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 14a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10.6 4a2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20 10a2 2 0 1 1 0 4z" /></Svg>
)
export const IconSun = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>
)
export const IconMoon = (p: IconProps) => (<Svg {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" /></Svg>)
export const IconDownload = (p: IconProps) => (<Svg {...p}><path d="M12 4v11" /><path d="m8 11 4 4 4-4" /><path d="M4 19h16" /></Svg>)
export const IconUpload = (p: IconProps) => (<Svg {...p}><path d="M12 16V5" /><path d="m8 9 4-4 4 4" /><path d="M4 19h16" /></Svg>)
export const IconAlert = (p: IconProps) => (<Svg {...p}><path d="M12 4.5 2.8 20h18.4z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none" /></Svg>)
export const IconInfo = (p: IconProps) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" /></Svg>)
export const IconCheck = (p: IconProps) => (<Svg {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>)
export const IconArrowUp = (p: IconProps) => (<Svg {...p}><path d="M12 19V6" /><path d="m6 11 6-6 6 6" /></Svg>)
export const IconArrowDown = (p: IconProps) => (<Svg {...p}><path d="M12 5v13" /><path d="m18 13-6 6-6-6" /></Svg>)
export const IconTarget = (p: IconProps) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" /></Svg>)
