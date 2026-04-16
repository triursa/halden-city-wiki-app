import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ManifestContext = createContext(null)

export function ManifestProvider({ children }) {
  const [core, setCore] = useState(null)
  const [files, setFiles] = useState(null)
  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [coreRes, filesRes, graphRes] = await Promise.all([
          fetch('/manifest-core.json'),
          fetch('/manifest-files.json'),
          fetch('/manifest-graph.json'),
        ])
        if (!coreRes.ok || !filesRes.ok || !graphRes.ok) {
          throw new Error(`Failed to load manifests: ${coreRes.status} ${filesRes.status} ${graphRes.status}`)
        }
        setCore(await coreRes.json())
        setFiles(await filesRes.json())
        setGraph(await graphRes.json())
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Resolve a wikilink target name to a file entry
  const resolveFile = useCallback((stem) => {
    if (!files) return null
    // Direct stem match
    if (files[stem]) return { ...files[stem], stem }
    // Try lowercase match
    const lowerStem = stem.toLowerCase()
    for (const [key, val] of Object.entries(files)) {
      if (key.toLowerCase() === lowerStem) return { ...val, stem: key }
    }
    // Try partial match
    for (const [key, val] of Object.entries(files)) {
      if (key.toLowerCase().includes(lowerStem) || lowerStem.includes(key.toLowerCase())) {
        return { ...val, stem: key }
      }
    }
    return null
  }, [files])

  // Get backlinks for a file (all files that link TO this stem)
  const getBacklinks = useCallback((stem) => {
    if (!graph) return []
    return graph.edges
      .filter(e => e.target === stem || e.target.toLowerCase() === stem.toLowerCase())
      .map(e => e.source)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .map(sourceStem => files?.[sourceStem])
      .filter(Boolean)
  }, [graph, files])

  // Get outbound links from a file
  const getOutboundLinks = useCallback((stem) => {
    if (!graph) return []
    return graph.edges
      .filter(e => e.source === stem)
      .map(e => ({ target: e.target, type: e.type, label: e.label }))
  }, [graph])

  // Get files for a section
  const getSectionFiles = useCallback((sectionKey) => {
    if (!core || !files) return []
    const section = core.sections[sectionKey]
    if (!section) return []
    return section.files.map(stem => files[stem]).filter(Boolean).map(f => ({ ...f, stem: f.stem }))
  }, [core, files])

  const value = {
    core, files, graph, loading, error,
    resolveFile, getBacklinks, getOutboundLinks, getSectionFiles,
  }

  return (
    <ManifestContext.Provider value={value}>
      {children}
    </ManifestContext.Provider>
  )
}

export function useManifest() {
  const ctx = useContext(ManifestContext)
  if (!ctx) throw new Error('useManifest must be used within ManifestProvider')
  return ctx
}

export default ManifestContext