import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useManifest } from '../ManifestContext'
import Breadcrumb from '../components/Breadcrumb'
import GlassPanel, { SECTION_COLORS } from '../components/GlassPanel'
import { useSearchIndex } from '../components/MarkdownRenderer'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { core, resolveFile } = useManifest()
  const { search } = useSearchIndex()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [sectionFilter, setSectionFilter] = useState(null)

  const results = useMemo(() => {
    const q = query || searchParams.get('q') || ''
    if (!q.trim()) return []
    return search(q)
      .filter(r => !sectionFilter || r.section === sectionFilter)
  }, [query, searchParams, sectionFilter, search])

  const sections = core?.section_order?.map(key => core.sections[key]) || []

  return (
    <div>
      <Breadcrumb items={[{ label: '🔍 Search' }]} />

      <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] mb-4">
        Search the Wiki
      </h1>

      {/* Search input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries, characters, factions, locations…"
            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-5 py-3 text-lg text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] transition"
            autoFocus
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Section filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`glass-btn text-xs ${!sectionFilter ? 'active' : ''}`}
          onClick={() => setSectionFilter(null)}
        >
          All
        </button>
        {sections.map(s => (
          <button
            key={s.key}
            className={`glass-btn text-xs ${sectionFilter === s.key ? 'active' : ''}`}
            onClick={() => setSectionFilter(s.key)}
          >
            <span className="mr-1">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.trim() ? (
        <div>
          <div className="text-sm text-[var(--text-dim)] mb-4">
            {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
          </div>
          <div className="space-y-3">
            {results.map(result => {
              const file = resolveFile(result.stem)
              if (!file) return null
              const color = SECTION_COLORS[file.section] || '#8b5cf6'
              const sectionLabel = core?.sections?.[file.section]?.label || file.section

              return (
                <button
                  key={result.stem}
                  className="w-full text-left"
                  onClick={() => navigate(`/${file.section}/${result.stem}`)}
                >
                  <GlassPanel className="p-4 hover:shadow-[0_0_20px_var(--glass-glow)] transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-12 rounded-full" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-semibold text-[var(--text-primary)] truncate">
                            {file.title}
                          </h3>
                          <span className="text-xs text-[var(--text-dim)] shrink-0" style={{ color }}>
                            {sectionLabel}
                          </span>
                        </div>
                        {file.description && (
                          <p className="text-sm text-[var(--text-dim)] mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-dim)] shrink-0">
                        Score: {result.score}
                      </div>
                    </div>
                  </GlassPanel>
                </button>
              )
            })}
          </div>

          {results.length === 0 && (
            <GlassPanel className="p-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-[var(--text-dim)]">No entries match your search.</p>
            </GlassPanel>
          )}
        </div>
      ) : (
        <GlassPanel className="p-8 text-center">
          <div className="text-3xl mb-2">🏙️</div>
          <p className="text-[var(--text-dim)]">Type a query to search across all wiki entries.</p>
        </GlassPanel>
      )}
    </div>
  )
}