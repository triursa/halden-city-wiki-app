# Halden City Wiki — masks.kaleb.one

A browsable, cross-referenced worldbuilding wiki for the Halden City superhero setting. Built with Astro 6, M3 Obsidian theme, and Pagefind full-text search.

## Architecture

- **Astro 6** — Static site generator, zero JS on content pages
- **@kaleb-one/theme** — M3 Obsidian design system
- **remark-obsidian** — Wikilink parsing from Obsidian-flavored markdown
- **Pagefind** — Client-side full-text search index
- **Cloudflare Pages** — Deployment target

## Content Source

Content lives in the `second-brain-vault` repository (external). The build reads from `VAULT_DIR` (default: `../second-brain-vault/domains/worldbuilding/halden-city`).

## Sections

| Key | Label | Subfolder |
|---|---|---|
| pcs | Player Characters | characters/pcs |
| alliance | The Alliance | characters/alliance |
| npcs | NPCs | characters/npcs |
| factions | Factions | factions |
| locations | Locations | locations |
| lore | Lore | lore |
| plot | Plot | plot |
| villains | Villains | plot/villain-sheets |
| meta | Meta | meta |

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

This runs the graph builder first, then Astro build, then Pagefind index.

## Deployment

Push to `main` → GitHub Actions → Cloudflare Pages (project: `masks-wiki`).