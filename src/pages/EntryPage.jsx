import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useManifest } from '../ManifestContext'
import Breadcrumb from '../components/Breadcrumb'
import GlassPanel, { SECTION_COLORS } from '../components/GlassPanel'
import { parseMarkdown } from '../components/MarkdownRenderer'

export default function EntryPage() {
  const { sectionKey, stem } = useParams()
  const navigate = useNavigate()
  const { core, files, resolveFile, getBacklinks, getOutboundLinks } = useManifest()
  const [content, setContent] = useState(null)
  const [loadingContent, setLoadingContent] = useState(true)

  const file = resolveFile(stem)
  const section = file?.section
  const color = SECTION_COLORS[section] || '#8b5cf6'
  const backlinks = getBacklinks(stem)
  const outbound = getOutboundLinks(stem)

  // Load markdown content
  useEffect(() => {
    if (!file) return
    setLoadingContent(true)
    fetch(`/vault/${file.path}`)
      .then(r => r.ok ? r.text() : '')
      .then(text => {
        // Strip frontmatter
        let body = text
        if (body.startsWith('---')) {
          const end = body.indexOf('---', 3)
          if (end !== -1) body = body.substring(end + 3).trim()
        }
        setContent(body)
        setLoadingContent(false)
      })
      .catch(() => { setContent(''); setLoadingContent(false) })
  }, [file?.path])

  const handleWikilink = (target) => {
    // Try to resolve the target to a file
    const resolved = resolveFile(target)
    if (resolved) {
      navigate(`/${resolved.section}/${resolved.stem}`)
    }
  }

  if (!file) {
    return (
      <GlassPanel className="p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">Entry not found</h2>
        <p className="text-[var(--text-dim)]">No entry named "{stem}" exists in the wiki.</p>
      </GlassPanel>
    )
  }

  // Portrait images
  const portraits = file.images || {}
  const hasDual = portraits.civilian && portraits.superhero
  const hasPortrait = portraits.portrait || hasDual

  return (
    <div>
      <Breadcrumb items={[
        { label: `${core?.sections?.[section]?.icon || ''} ${core?.sections?.[section]?.label || section || ''}`, to: section ? `/${section}` : '/' },
        { label: file.title },
      ]} />

      {/* Title area */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] mb-1">
          {file.title}
        </h1>
        {file.description && (
          <p className="text-[var(--text-secondary)] italic">{file.description}</p>
        )}
        {file.tags?.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {file.tags.filter(t => t !== 'halden-city').map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[var(--text-dim)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Portrait */}
      {hasPortrait && (
        <div className="mb-6">
          {hasDual ? (
            <div className="grid grid-cols-2 gap-3">
              {portraits.civilian && (
                <div className="glass-panel overflow-hidden">
                  <img src={portraits.civilian} alt={`${file.title} — Civilian`} className="w-full object-cover" style={{ maxHeight: '400px' }} />
                  <div className="px-3 py-1.5 text-sm text-[var(--text-dim)] text-center">Civilian</div>
                </div>
              )}
              {portraits.superhero && (
                <div className="glass-panel overflow-hidden">
                  <img src={portraits.superhero} alt={`${file.title} — Superhero`} className="w-full object-cover" style={{ maxHeight: '400px' }} />
                  <div className="px-3 py-1.5 text-sm text-[var(--text-dim)] text-center">Superhero</div>
                </div>
              )}
            </div>
          ) : portraits.portrait ? (
            <GlassPanel className="overflow-hidden">
              <img src={portraits.portrait} alt={file.title} className="w-full object-cover" style={{ maxHeight: '400px' }} />
            </GlassPanel>
          ) : null}
        </div>
      )}

      {/* Scene image */}
      {portraits.scene && (
        <div className="mb-6">
          <GlassPanel className="overflow-hidden">
            <img src={portraits.scene} alt="Scene" className="w-full object-cover" style={{ maxHeight: '300px' }} />
          </GlassPanel>
        </div>
      )}

      {/* Main content */}
      <GlassPanel className="p-6" glow>
        <div className="wiki-prose">
          {loadingContent ? (
            <div className="text-center py-8 text-[var(--text-dim)]">
              <div className="animate-pulse">Loading content…</div>
            </div>
          ) : content ? (
            parseMarkdown(content, handleWikilink)
          ) : (
            <p className="text-[var(--text-dim)] text-center py-4">No content available.</p>
          )}
        </div>
      </GlassPanel>

      {/* Relationships */}
      {file.relationships?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-3">Relationships</h3>
          <GlassPanel className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-left py-2 px-4 text-[var(--text-primary)]">Person</th>
                  <th className="text-left py-2 px-4 text-[var(--text-secondary)]">Relationship</th>
                </tr>
              </thead>
              <tbody>
                {file.relationships.map((rel, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                    <td className="py-2 px-4">
                      <button
                        className="wikilink resolved"
                        onClick={() => handleWikilink(rel.person)}
                      >
                        {rel.person}
                      </button>
                    </td>
                    <td className="py-2 px-4 text-[var(--text-secondary)]">{rel.relationship}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassPanel>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-3">
            Referenced by ({backlinks.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {backlinks.map(bl => (
              <button
                key={bl.stem}
                className="glass-btn text-xs"
                onClick={() => navigate(`/${bl.section}/${bl.stem}`)}
              >
                {bl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outbound links */}
      {outbound.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-3">
            Connections ({outbound.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {outbound.map((link, i) => {
              const target = resolveFile(link.target)
              return (
                <button
                  key={i}
                  className={`glass-btn text-xs ${target ? '' : 'opacity-50'}`}
                  onClick={() => target && navigate(`/${target.section}/${target.stem}`)}
                >
                  {target ? target.title : link.target}
                  {link.label && <span className="ml-1 text-[var(--text-dim)]">({link.label})</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}