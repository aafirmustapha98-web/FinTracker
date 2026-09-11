import { useEffect, useState } from 'react'
import { useStore } from './store/store'
import { useAppTheme } from './lib/theme'
import { currentMonth, formatDate, formatMonth, today } from './lib/date'
import { Dashboard } from './pages/Dashboard'
import { TransactionsPage } from './pages/TransactionsPage'
import { BudgetPage } from './pages/BudgetPage'
import { SavingsPage } from './pages/SavingsPage'
import { InvestmentsPage } from './pages/InvestmentsPage'
import { WealthPage } from './pages/WealthPage'
import { SettingsPanel } from './components/SettingsPanel'
import {
  IconBudget, IconDashboard, IconExpense, IconIncome, IconInvest,
  IconMoon, IconSavings, IconSettings, IconSun, IconWealth,
} from './components/ui/Icons'

type PageId = 'dashboard' | 'income' | 'expenses' | 'budget' | 'savings' | 'investments' | 'wealth'

interface PageDefinition {
  id: PageId
  label: string
  title: string
  subtitle: string
  icon: (props: { size?: number }) => React.ReactElement
}

const PAGES: PageDefinition[] = [
  { id: 'dashboard', label: 'Tableau de bord', title: 'Tableau de bord', subtitle: `Situation du mois de ${formatMonth(currentMonth())}`, icon: IconDashboard },
  { id: 'income', label: 'Revenus', title: 'Revenus', subtitle: 'Salaire, freelance, primes et autres entrées', icon: IconIncome },
  { id: 'expenses', label: 'Dépenses', title: 'Dépenses', subtitle: 'Dépenses fixes et variables par catégorie', icon: IconExpense },
  { id: 'budget', label: 'Budget', title: 'Budget mensuel', subtitle: 'Prévu contre réel, catégorie par catégorie', icon: IconBudget },
  { id: 'savings', label: 'Épargne', title: 'Épargne', subtitle: 'Épargne disponible et objectifs', icon: IconSavings },
  { id: 'investments', label: 'Investissements', title: 'Investissements', subtitle: 'Actions, ETF, OPCVM et performance', icon: IconInvest },
  { id: 'wealth', label: 'Patrimoine', title: 'Patrimoine', subtitle: 'Actifs, dettes et patrimoine net', icon: IconWealth },
]

const isPageId = (value: string): value is PageId => PAGES.some((page) => page.id === value)

/** Navigation par ancre : chaque page reste partageable et résiste au rechargement. */
function useHashRoute(): [PageId, (page: PageId) => void] {
  const read = (): PageId => {
    const hash = window.location.hash.replace('#/', '')
    return isPageId(hash) ? hash : 'dashboard'
  }
  const [page, setPage] = useState<PageId>(read)

  useEffect(() => {
    const onHashChange = () => setPage(read())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = (next: PageId) => {
    window.location.hash = `#/${next}`
    setPage(next)
  }
  return [page, navigate]
}

export default function App() {
  const { state, updateSettings } = useStore()
  const { mode } = useAppTheme()
  const [page, navigate] = useHashRoute()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const definition = PAGES.find((item) => item.id === page) ?? PAGES[0]

  const toggleTheme = () => updateSettings({ theme: mode === 'dark' ? 'light' : 'dark' })

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">FT</span>
          <span>
            FinTracker
            <span className="brand-sub">Mes finances en MAD</span>
          </span>
        </div>
        <nav className="nav" aria-label="Navigation principale">
          {PAGES.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className="nav-item"
                aria-current={item.id === page ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-item" onClick={() => setSettingsOpen(true)}>
            <IconSettings size={17} /> Réglages et données
          </button>
          <p className="muted" style={{ fontSize: 11, padding: '0 10px' }}>
            {state.transactions.length} opérations · mise à jour {formatDate(today())}
          </p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{definition.title}</h1>
            <p>{definition.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <button
              type="button" className="icon-btn" onClick={toggleTheme}
              aria-label={mode === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
            >
              {mode === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
            </button>
            <button type="button" className="icon-btn" aria-label="Réglages" onClick={() => setSettingsOpen(true)}>
              <IconSettings size={17} />
            </button>
          </div>
        </header>

        <main>
          {page === 'dashboard' ? <Dashboard onNavigate={(next) => isPageId(next) && navigate(next)} /> : null}
          {page === 'income' ? <TransactionsPage kind="income" key="income" /> : null}
          {page === 'expenses' ? <TransactionsPage kind="expense" key="expenses" /> : null}
          {page === 'budget' ? <BudgetPage /> : null}
          {page === 'savings' ? <SavingsPage /> : null}
          {page === 'investments' ? <InvestmentsPage /> : null}
          {page === 'wealth' ? <WealthPage /> : null}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navigation principale">
        {PAGES.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === page ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon size={18} />
              {item.label === 'Tableau de bord' ? 'Accueil' : item.label}
            </button>
          )
        })}
      </nav>

      {settingsOpen ? <SettingsPanel onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}
