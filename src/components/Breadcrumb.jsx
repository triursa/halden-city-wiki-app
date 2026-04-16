import { Link } from 'react-router-dom'
import { useManifest } from '../ManifestContext'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-[var(--text-dim)] mb-4">
      <Link to="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-[var(--text-dim)]">/</span>
          {item.to ? (
            <Link to={item.to} className="hover:text-[var(--accent)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text-primary)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}