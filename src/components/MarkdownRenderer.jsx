import { useMemo } from 'react'
import { useManifest } from '../ManifestContext'

// Parse markdown to React elements — lightweight, handles the patterns in the vault
export function parseMarkdown(text, onWikilink) {
  if (!text) return []

  const lines = text.split('\n')
  const elements = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(<hr key={key++} className="border-[var(--glass-border)]" />)
      i++
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const Tag = `h${level}`
      elements.push(<Tag key={key++} className="font-serif">{inlineFormat(headingMatch[2], onWikilink)}</Tag>)
      i++
      continue
    }

    // Table
    if (line.trim().startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(renderTable(tableLines, onWikilink, key++))
      continue
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      elements.push(
        <blockquote key={key++} className="border-l-3 border-[var(--accent)] pl-4 py-2 my-3 bg-[var(--glass-bg)] rounded-r-lg italic text-[var(--text-primary)]">
          {quoteLines.map((ql, qi) => (
            <p key={qi}>{inlineFormat(ql, onWikilink)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    // Unordered list
    if (line.match(/^[\s]*[-*]\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[\s]*[-*]\s/)) {
        items.push(lines[i].replace(/^[\s]*[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={key++} className="list-disc pl-6 my-2 space-y-1 text-[var(--text-secondary)]">
          {items.map((item, ii) => (
            <li key={ii}>{inlineFormat(item, onWikilink)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (line.match(/^[\s]*\d+\.\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[\s]*\d+\.\s/)) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={key++} className="list-decimal pl-6 my-2 space-y-1 text-[var(--text-secondary)]">
          {items.map((item, ii) => (
            <li key={ii}>{inlineFormat(item, onWikilink)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Checkbox list
    if (line.match(/^[\s]*[-*]\s+\[[ x]\]/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[\s]*[-*]\s+\[[ x]\]/)) {
        const checked = lines[i].includes('[x]')
        const text = lines[i].replace(/^[\s]*[-*]\s+\[[ x]\]\s*/, '')
        items.push({ text, checked })
        i++
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-[var(--text-secondary)]">
              <span className={`mt-0.5 text-xs ${item.checked ? 'text-green-400' : 'text-[var(--text-dim)]'}`}>
                {item.checked ? '✅' : '⬜'}
              </span>
              <span>{inlineFormat(item.text, onWikilink)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={key++} className="my-2 text-[var(--text-secondary)] leading-relaxed">
        {inlineFormat(line, onWikilink)}
      </p>
    )
    i++
  }

  return elements
}

function inlineFormat(text, onWikilink) {
  // This returns an array of React elements and strings
  const parts = []
  let remaining = text
  let partKey = 0

  while (remaining.length > 0) {
    // Wikilink: [[target]]
    const wlMatch = remaining.match(/\[\[(.+?)\]\]/)
    // Bold+link: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    // Italic: *text*
    const italicMatch = remaining.match(/\*(.+?)\*/)
    // Code: `text`
    const codeMatch = remaining.match(/`(.+?)`/)
    // Markdown link: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)

    // Find the earliest match
    let earliest = null
    let earliestPos = Infinity

    if (wlMatch && wlMatch.index < earliestPos) { earliest = { type: 'wikilink', match: wlMatch }; earliestPos = wlMatch.index }
    if (boldMatch && boldMatch.index < earliestPos) { earliest = { type: 'bold', match: boldMatch }; earliestPos = boldMatch.index }
    if (linkMatch && linkMatch.index < earliestPos) { earliest = { type: 'link', match: linkMatch }; earliestPos = linkMatch.index }
    if (codeMatch && codeMatch.index < earliestPos) { earliest = { type: 'code', match: codeMatch }; earliestPos = codeMatch.index }
    if (italicMatch && italicMatch.index < earliestPos) { earliest = { type: 'italic', match: italicMatch }; earliestPos = italicMatch.index }

    if (!earliest) {
      parts.push(remaining)
      break
    }

    // Text before the match
    if (earliestPos > 0) {
      parts.push(remaining.substring(0, earliestPos))
    }

    if (earliest.type === 'wikilink') {
      const target = earliest.match[1]
      // Skip image references
      if (target.includes('/') && (target.endsWith('.png') || target.endsWith('.jpg') || target.endsWith('.jpeg') || target.endsWith('.webp'))) {
        parts.push(earliest.match[0])
      } else {
        const handleClick = onWikilink ? () => onWikilink(target) : undefined
        parts.push(
          <button
            key={partKey++}
            className="wikilink resolved"
            onClick={handleClick}
          >
            {target}
          </button>
        )
      }
    } else if (earliest.type === 'bold') {
      parts.push(<strong key={partKey++}>{inlineFormat(earliest.match[1], onWikilink)}</strong>)
    } else if (earliest.type === 'italic') {
      parts.push(<em key={partKey++}>{earliest.match[1]}</em>)
    } else if (earliest.type === 'code') {
      parts.push(<code key={partKey++} className="font-mono text-xs bg-[var(--glass-bg-active)] px-1.5 py-0.5 rounded text-[#c4b5fd]">{earliest.match[1]}</code>)
    } else if (earliest.type === 'link') {
      const url = earliest.match[2]
      if (url.startsWith('http')) {
        parts.push(<a key={partKey++} href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:text-[#a78bfa]">{earliest.match[1]}</a>)
      } else {
        // Internal link — try to resolve
        const handleClick = onWikilink ? () => onWikilink(url) : undefined
        parts.push(
          <button key={partKey++} className="wikilink resolved" onClick={handleClick}>
            {earliest.match[1]}
          </button>
        )
      }
    }

    remaining = remaining.substring(earliestPos + earliest.match[0].length)
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}

function renderTable(lines, onWikilink, key) {
  const rows = lines
    .filter(l => !l.trim().match(/^\|[\s-:|]+\|$/))  // skip separator
    .map(l => l.split('|').filter(c => c.trim() !== '').map(c => c.trim()))

  if (rows.length === 0) return null

  const header = rows[0]
  const body = rows.slice(1)

  return (
    <div key={key} className="overflow-x-auto my-3">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {header.map((cell, ci) => (
              <th key={ci} className="text-left py-2 px-3 text-[var(--text-primary)] font-semibold border-b border-[var(--glass-border)]">
                {inlineFormat(cell, onWikilink)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--glass-bg)]">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 px-3 text-[var(--text-secondary)]">
                  {inlineFormat(cell, onWikilink)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Custom hook for search indexing
export function useSearchIndex() {
  const { files } = useManifest()

  return useMemo(() => {
    if (!files) return { index: [], search: () => [] }

    const index = Object.entries(files).map(([stem, file]) => ({
      stem,
      title: file.title,
      description: file.description || '',
      section: file.section || '',
      tags: (file.tags || []).join(' '),
    }))

    const search = (query) => {
      if (!query.trim()) return []
      const q = query.toLowerCase()
      const terms = q.split(/\s+/).filter(Boolean)

      return index
        .map(entry => {
          const haystack = `${entry.title} ${entry.description} ${entry.tags} ${entry.section}`.toLowerCase()
          let score = 0
          for (const term of terms) {
            if (entry.title.toLowerCase().includes(term)) score += 10
            if (entry.description.toLowerCase().includes(term)) score += 5
            if (entry.tags.toLowerCase().includes(term)) score += 3
            if (entry.section.toLowerCase().includes(term)) score += 2
          }
          return { ...entry, score }
        })
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score)
    }

    return { index, search }
  }, [files])
}