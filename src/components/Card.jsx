import { Link } from 'react-router-dom'
import { useManifest } from '../ManifestContext'
import GlassPanel, { SECTION_COLORS } from './GlassPanel'

export default function Card({ file }) {
  const { resolveFile } = useManifest()
  const section = file.section
  const color = SECTION_COLORS[section] || '#8b5cf6'
  const hasPortrait = file.images?.portrait || file.images?.civilian || file.images?.superhero
  const portraitSrc = file.images?.civilian || file.images?.superhero || file.images?.portrait

  return (
    <Link to={`/${section}/${file.stem}`} className="block group">
      <GlassPanel className="overflow-hidden">
        {/* Accent bar */}
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

        <div className="p-4">
          {/* Portrait thumbnail (for character sections) */}
          {hasPortrait && (
            <div className="mb-3 -mx-4 -mt-4 mb-3 overflow-hidden" style={{ maxHeight: '160px' }}>
              <img
                src={portraitSrc}
                alt={file.title}
                className="w-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ maxHeight: '160px' }}
                loading="lazy"
              />
            </div>
          )}

          {/* Title */}
          <h3 className="font-serif text-base font-semibold group-hover:text-[var(--accent)] transition-colors" style={{ color }}>
            {file.title}
          </h3>

          {/* Description */}
          {file.description && (
            <p className="mt-1.5 text-sm text-[var(--text-dim)] line-clamp-2 leading-relaxed">
              {file.description}
            </p>
          )}

          {/* Tags */}
          {file.tags?.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {file.tags.filter(t => t !== 'halden-city').slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--glass-bg)] text-[var(--text-dim)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>
    </Link>
  )
}