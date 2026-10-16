import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun, Search, Menu, LayoutDashboard, History, type LucideIcon } from 'lucide-react'

export type View = 'portfolio' | 'history'

interface HeaderProps {
  onSearch: (query: string) => void
  view: View
  onNavigate: (view: View) => void
}

const MENU_ITEMS: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'portfolio', label: 'Portfolio', icon: LayoutDashboard },
  { view: 'history', label: 'History', icon: History },
]

export const Header: React.FC<HeaderProps> = ({ onSearch, view, onNavigate }) => {
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const go = (next: View) => {
    onNavigate(next)
    setMenuOpen(false)
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <nav className="absolute left-0 top-full mt-2 w-48 z-50 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-2">
                  {MENU_ITEMS.map(({ view: v, label, icon: Icon }) => (
                    <button
                      key={v}
                      onClick={() => go(v)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition ${
                        view === v
                          ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </nav>
              </>
            )}
          </div>

          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                onSearch(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-slate-600" />
          ) : (
            <Sun className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>
    </header>
  )
}
