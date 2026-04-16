import { Link } from 'react-router-dom'
import { useManifest } from '../ManifestContext'
import GlassPanel, { SECTION_COLORS } from '../components/GlassPanel'

export default function HomePage() {
  const { core } = useManifest()

  if (!core) return null

  const sections = core.section_order.map(key => core.sections[key])
  const totalEntries = core.stats?.total_files || 0
  const totalConnections = core.stats?.total_edges || 0

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold text-[var(--text-primary)] mb-2">
          🏙️ Halden City
        </h1>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-2xl">
          A browsable, cross-referenced worldbuilding wiki for the Halden City superhero setting.
          Explore characters, factions, locations, and lore — every entry linked to every other.
        </p>
        <div className="flex gap-4 mt-4 text-sm text-[var(--text-dim)]">
          <span>{totalEntries} entries</span>
          <span>·</span>
          <span>{totalConnections} connections</span>
          <span>·</span>
          <span>{sections.length} sections</span>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(section => {
          const color = SECTION_COLORS[section.key] || '#8b5cf6'
          const fileCount = section.files?.length || 0

          return (
            <Link key={section.key} to={`/${section.key}`} className="group">
              <GlassPanel className="relative overflow-hidden h-full transition-all hover:shadow-[0_0_30px_var(--glass-glow)]">
                {/* Gradient glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"
                  style={{ background: color }}
                />

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl" style={{ color }}>{section.icon}</span>
                    <h2 className="font-serif text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {section.label}
                    </h2>
                  </div>
                  <div className="text-sm text-[var(--text-dim)]">
                    {fileCount} {fileCount === 1 ? 'entry' : 'entries'}
                  </div>
                </div>
              </GlassPanel>
            </Link>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
        <GlassPanel className="p-5">
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-3">Quick Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {sections.map(section => (
              <Link
                key={section.key}
                to={`/${section.key}`}
                className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                style={{ borderLeftColor: SECTION_COLORS[section.key] }}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </Link>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}