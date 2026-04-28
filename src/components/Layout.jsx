import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useManifest } from '../ManifestContext'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading, error } = useManifest()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    const q = e.target.elements.q.value.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="md:ml-[280px] min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[var(--md-sys-color-surface-container)] border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  name="q"
                  type="text"
                  placeholder="Search the wiki…"
                  defaultValue={new URLSearchParams(location.search).get('q') || ''}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg px-4 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-glow)] transition"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </form>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-8 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-pulse">🏙️</div>
                <div className="text-[var(--text-dim)]">Loading Halden City…</div>
              </div>
            </div>
          ) : error ? (
            <div className="glass-panel p-6 text-center">
              <div className="text-red-400 mb-2">Error loading manifests</div>
              <div className="text-sm text-[var(--text-dim)]">{error}</div>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}