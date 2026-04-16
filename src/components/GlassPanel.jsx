import { useManifest } from '../ManifestContext'

const SECTION_COLORS = {
  pcs: '#f59e0b',
  alliance: '#3b82f6',
  npcs: '#10b981',
  factions: '#ef4444',
  locations: '#06b6d4',
  lore: '#a855f7',
  plot: '#f97316',
  villains: '#dc2626',
  meta: '#6b7280',
}

export default function GlassPanel({ children, className = '', glow = false, style = {} }) {
  return (
    <div
      className={`glass-panel ${glow ? 'glass-panel-glow' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export { SECTION_COLORS }