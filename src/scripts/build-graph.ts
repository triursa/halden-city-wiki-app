/**
 * build-graph.ts — Build-time script that generates src/data/graph.json
 *
 * Reads all vault markdown files, extracts wikilinks and relationships,
 * computes backlinks, and writes a graph of nodes + edges.
 * Gracefully handles missing VAULT_DIR (writes empty graph).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_DIR = process.env.VAULT_DIR || '../second-brain-vault/domains/worldbuilding/halden-city';
// Script is at src/scripts/build-graph.ts, project root is 2 levels up
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
let VAULT_BASE = path.resolve(PROJECT_ROOT, VAULT_DIR);

// Fallback: use local public/vault if VAULT_DIR doesn't exist
if (!fs.existsSync(VAULT_BASE)) {
  const localVault = path.resolve(PROJECT_ROOT, 'public/vault');
  if (fs.existsSync(localVault)) {
    console.warn(`[build-graph] VAULT_DIR not found at ${VAULT_BASE}, using local fallback: ${localVault}`);
    VAULT_BASE = localVault;
  }
}

const OUTPUT = path.resolve(PROJECT_ROOT, 'src/data/graph.json');

// Section subfolder → section key mapping
const SUBFOLDER_MAP: Record<string, string> = {
  'characters/pcs': 'pcs',
  'characters/alliance': 'alliance',
  'characters/npcs': 'npcs',
  'factions': 'factions',
  'locations': 'locations',
  'lore': 'lore',
  'plot': 'plot',
  'plot/villain-sheets': 'villains',
  'meta': 'meta',
};

interface Node {
  id: string;
  label: string;
  section: string | null;
  type: string;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
  backlinks: Record<string, string[]>;
}

function deriveSection(relPath: string): string | null {
  if (!relPath.includes('/')) return null;
  const parts = relPath.split('/');
  for (let i = parts.length - 1; i >= 1; i--) {
    const sub = parts.slice(0, i).join('/');
    if (SUBFOLDER_MAP[sub]) return SUBFOLDER_MAP[sub];
  }
  return null;
}

function deriveId(relPath: string): string {
  return relPath.replace(/\.md$/, '');
}

function deriveLabel(content: string, fallback: string): string {
  const fmTitle = content.match(/^---\n[\s\S]*?title:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (fmTitle) return fmTitle[1].trim();
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return fallback.replace(/\.md$/, '').replace(/-/g, ' ');
}

function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const target = m[1].split('|')[0].trim();
    links.push(target);
  }
  return links;
}

function extractMdLinks(content: string): string[] {
  const links: string[] = [];
  const re = /\[([^\]]*)\]\(([^)]+\.md)\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    links.push(m[2]);
  }
  return links;
}

function extractRelationships(content: string): { name: string; relationship: string }[] {
  const rels: { name: string; relationship: string }[] = [];
  const relMatch = content.match(/^##\s+Relationships\s*\n([\s\S]*?)(?=\n##\s|\n---\s*$|$)/m);
  if (!relMatch) return rels;

  const tableContent = relMatch[1];
  const rows = tableContent.matchAll(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|/gm);
  for (const row of rows) {
    const name = row[1].trim();
    const relationship = row[2].trim();
    if (name === 'Name' || name === '---' || name.startsWith('-')) continue;
    rels.push({ name, relationship });
  }
  return rels;
}

function walkDir(dir: string, base: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full, base));
    } else if (entry.name.endsWith('.md')) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

function buildGraph(): Graph {
  const files = walkDir(VAULT_BASE, VAULT_BASE);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const backlinks: Record<string, string[]> = {};

  const nodeIndex = new Map<string, Node>();

  // First pass: create nodes
  for (const relPath of files) {
    const content = fs.readFileSync(path.join(VAULT_BASE, relPath), 'utf-8');
    const id = deriveId(relPath);
    const section = deriveSection(relPath);
    const label = deriveLabel(content, path.basename(relPath));

    const node: Node = { id, label, section, type: section || 'root' };
    nodes.push(node);
    nodeIndex.set(id, node);

    const stem = path.basename(relPath, '.md');
    nodeIndex.set(stem, node);
  }

  // Second pass: extract edges
  for (const relPath of files) {
    const content = fs.readFileSync(path.join(VAULT_BASE, relPath), 'utf-8');
    const sourceId = deriveId(relPath);

    for (const target of extractWikilinks(content)) {
      const targetNode = nodeIndex.get(target) || nodeIndex.get(target.replace(/ /g, '-'));
      if (targetNode && targetNode.id !== sourceId) {
        edges.push({ source: sourceId, target: targetNode.id });
        if (!backlinks[targetNode.id]) backlinks[targetNode.id] = [];
        if (!backlinks[targetNode.id].includes(sourceId)) {
          backlinks[targetNode.id].push(sourceId);
        }
      }
    }

    for (const target of extractMdLinks(content)) {
      const cleanTarget = target.replace(/^\.\//, '').replace(/\.md$/, '');
      const targetNode = nodeIndex.get(cleanTarget);
      if (targetNode && targetNode.id !== sourceId) {
        edges.push({ source: sourceId, target: targetNode.id });
        if (!backlinks[targetNode.id]) backlinks[targetNode.id] = [];
        if (!backlinks[targetNode.id].includes(sourceId)) {
          backlinks[targetNode.id].push(sourceId);
        }
      }
    }

    for (const rel of extractRelationships(content)) {
      const targetNode = nodeIndex.get(rel.name) || nodeIndex.get(rel.name.replace(/ /g, '-'));
      if (targetNode && targetNode.id !== sourceId) {
        edges.push({ source: sourceId, target: targetNode.id, label: rel.relationship });
        if (!backlinks[targetNode.id]) backlinks[targetNode.id] = [];
        if (!backlinks[targetNode.id].includes(sourceId)) {
          backlinks[targetNode.id].push(sourceId);
        }
      }
    }
  }

  return { nodes, edges, backlinks };
}

// Main
console.log('Building content graph from:', VAULT_BASE);

if (!fs.existsSync(VAULT_BASE)) {
  console.warn(`No vault directory found. Writing empty graph.`);
  const emptyGraph: Graph = { nodes: [], edges: [], backlinks: {} };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(emptyGraph, null, 2));
  console.log('Wrote empty graph to', OUTPUT);
} else {
  const graph = buildGraph();
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(graph, null, 2));
  console.log(`Wrote graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges → ${OUTPUT}`);
}