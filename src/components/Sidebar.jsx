import { Link, useLocation } from 'react-router-dom'
import { useManifest } from '../ManifestContext'
import { SECTION_COLORS } from './GlassPanel'

export default function Sidebar({ isOpen, onClose }) {
  const { core, loading } = useManifest()
  const location = useLocation()

  if (loading || !core) return null

  const sections = core.section_order.map(key => core.sections[key])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--glass-border)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-[280px] overflow-y-auto
        `}
      >
        {/* Logo / Home */}
        <Link
          to="/"
          onClick={onClose}
          className="block px-6 py-5 border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors"
        >
          <div className="font-serif text-xl font-bold text-[var(--text-primary)]">
            🏙️ Halden City
          </div>
          <div className="text-xs text-[var(--text-dim)] mt-1">
            world.kaleb.one
          </div>
        </Link>

        {/* Search link */}
        <Link
          to="/search"
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
        >
          <span>🔍</span>
          <span>Search</span>
          <span className="ml-auto text-xs text-[var(--text-dim)] border border-[var(--glass-border)] rounded px-1.5 py-0.5">/</span>
        </Link>

        <div className="h-px bg-[var(--glass-border)] mx-4" />

        {/* Sections */}
        <nav className="py-2">
          {sections.map(section => {
            const color = SECTION_COLORS[section.key] || '#8b5cf6'
            const isActive = location.pathname === `/${section.key}` ||
                             location.pathname.startsWith(`/${section.key}/`)
            const fileCount = section.files?.length || 0

            return (
              <Link
                key={section.key}
                to={`/${section.key}`}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-6 py-2.5 text-sm transition-all
                  ${isActive
                    ? 'text-white bg-[var(--glass-bg-hover)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'}
                `}
                style={isActive ? { borderRight: `2px solid ${color}` } : {}}
              >
                <span className="text-base" style={{ color }}>{section.icon}</span>
                <span className="font-medium">{section.label}</span>
                <span className="ml-auto text-xs text-[var(--text-dim)]">{fileCount}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-[var(--glass-border)] text-xs text-[var(--text-dim)]">
          <div>{core.stats?.total_files || 0} entries · {core.stats?.total_edges || 0} connections</div>
          <div className="mt-1 text-[var(--text-dim)]">Sovereign Mesh · Chronicler</div>
        </div>
      </aside>
    </>
  )
}