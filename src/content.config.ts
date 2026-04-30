import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import path from 'node:path';
import fs from 'node:fs';

const VAULT_DIR = process.env.VAULT_DIR || '../second-brain-vault/domains/worldbuilding/halden-city';

// Resolve vault dir relative to project root (src/ -> ../)
const projectRoot = path.resolve(import.meta.dirname ?? '.', '..');
let vaultBase = path.resolve(projectRoot, VAULT_DIR);

// Fallback: if VAULT_DIR doesn't exist, use the local copy in public/vault
if (!fs.existsSync(vaultBase)) {
  const localVault = path.resolve(projectRoot, 'public/vault');
  if (fs.existsSync(localVault)) {
    console.warn(`[content.config] VAULT_DIR not found at ${vaultBase}, using local fallback: ${localVault}`);
    vaultBase = localVault;
  } else {
    console.warn(`[content.config] No vault directory found. Content collections will be empty.`);
  }
}

// Root collection: top-level .md files in vault
const root = defineCollection({
  loader: fs.existsSync(vaultBase) ? glob({ pattern: '*.md', base: vaultBase }) : { load: async () => [] },
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    domain: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Entries collection: files in section subfolders
const entries = defineCollection({
  loader: fs.existsSync(vaultBase) ? glob({ pattern: '**/*.md', base: vaultBase }) : { load: async () => [] },
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    domain: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const collections = { root, entries };