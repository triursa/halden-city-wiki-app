import { useParams } from 'react-router-dom'
import { useManifest } from '../ManifestContext'
import Breadcrumb from '../components/Breadcrumb'
import Card from '../components/Card'
import GlassPanel, { SECTION_COLORS } from '../components/GlassPanel'

export default function SectionPage() {
  const { sectionKey } = useParams()
  const { core, getSectionFiles } = useManifest()

  if (!core) return null
  const section = core.sections[sectionKey]
  if (!section) {
    return (
      <GlassPanel className="p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="font-serif text-xl text-[var(--text-primary)] mb-2">Section not found</h2>
        <p className="text-[var(--text-dim)]">No section named "{sectionKey}" exists in the wiki.</p>
      </GlassPanel>
    )
  }

  const files = getSectionFiles(sectionKey)
  const color = SECTION_COLORS[sectionKey] || '#8b5cf6'
  const fileCount = files.length

  return (
    <div>
      <Breadcrumb items={[{ label: section.icon + ' ' + section.label }]} />

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] mb-2">
          <span style={{ color }}>{section.icon}</span> {section.label}
        </h1>
        <p className="text-[var(--text-dim)]">
          {fileCount} {fileCount === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files
          .sort((a, b) => a.title.localeCompare(b.title))
          .map(file => (
            <Card key={file.stem} file={file} />
          ))
        }
      </div>

      {files.length === 0 && (
        <GlassPanel className="p-6 text-center">
          <p className="text-[var(--text-dim)]">No entries in this section yet.</p>
        </GlassPanel>
      )}
    </div>
  )
}