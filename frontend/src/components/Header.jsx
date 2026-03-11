import { useState } from 'react'

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
}

export function Header({ board, connected }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-40">
      {/* Left — logo + board name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <span className="font-semibold text-slate-100 text-sm tracking-wide">KanbanFlow</span>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        <div>
          <h1 className="font-semibold text-slate-100 text-sm leading-tight">
            {board?.name || 'Loading…'}
          </h1>
          {board?.description && (
            <p className="text-slate-400 text-xs leading-tight mt-0.5 max-w-xs truncate">
              {board.description}
            </p>
          )}
        </div>
      </div>

      {/* Right — status + avatar */}
      <div className="flex items-center gap-3">
        {/* Live connection indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className={connected ? 'text-emerald-400' : 'text-slate-400'}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Priority legend */}
        <div className="hidden md:flex items-center gap-2">
          {Object.entries(PRIORITY_COLORS).map(([p, cls]) => (
            <div key={p} className="flex items-center gap-1 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${cls}`} />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </div>
          ))}
        </div>

        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
          TZ
        </div>
      </div>
    </header>
  )
}

export default Header
