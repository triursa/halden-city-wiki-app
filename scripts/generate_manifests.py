#!/usr/bin/env python3
"""
Halden City Wiki — Triple Manifest Generator

Reads vault markdown files and produces three JSON manifests:
  1. manifest-core.json   — Site-level metadata (section list, stats)
  2. manifest-files.json  — Flat map of every file: title, section, tags, excerpt, image info
  3. manifest-graph.json  — Node-edge graph of cross-references

Stdlib only.
"""

import json
import os
import re
import shutil
from pathlib import Path
from collections import defaultdict

VAULT_DIR = Path("/root/second-brain-vault/domains/worldbuilding/halden-city")
OUTPUT_DIR = Path("/root/world-kaleb-one/public")

IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
PORTRAIT_SECTIONS = {"pcs", "alliance", "npcs"}
SKIP_PREFIXES = ("_",)

SECTION_CONFIG = [
    {"key": "pcs",       "label": "Player Characters", "icon": "★", "subfolder": "characters/pcs"},
    {"key": "alliance",  "label": "Alliance & Network",  "icon": "⬡", "subfolder": "characters/alliance"},
    {"key": "npcs",      "label": "Characters",         "icon": "◈", "subfolder": "characters/npcs"},
    {"key": "factions",  "label": "Factions",            "icon": "◉", "subfolder": "factions"},
    {"key": "locations", "label": "Locations",            "icon": "◎", "subfolder": "locations"},
    {"key": "lore",      "label": "Lore",                "icon": "◇", "subfolder": "lore"},
    {"key": "plot",      "label": "Plot",                "icon": "◆", "subfolder": "plot"},
    {"key": "villains",  "label": "Villain Sheets",      "icon": "◥", "subfolder": "plot/villain-sheets"},
    {"key": "meta",      "label": "Meta",                "icon": "◌", "subfolder": "meta"},
]

SCENE_PAGE_MAP = {
    "aegis-halden-regional-command": "crownpoint",
    "alliance-tower":                "crownpoint",
    "hq-ironworkers-hall":           "ironworks",
    "street-texture":                None,
}


def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}, text
    end = text.find("---", 3)
    if end == -1:
        return {}, text
    fm_block = text[3:end].strip()
    body = text[end + 3:].strip()
    meta = {}
    for line in fm_block.split("\n"):
        line = line.strip()
        if line.startswith("- "):
            # It's a list item under the last key
            val = line[2:].strip()
            last_key = list(meta.keys())[-1] if meta else None
            if last_key and isinstance(meta[last_key], list):
                meta[last_key].append(val)
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if not val:
                meta[key] = []
            else:
                meta[key] = val
    return meta, body


def extract_description(body, max_len=200):
    lines = body.split("\n")
    # Priority 1: blockquote epigraph
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(">"):
            text = stripped.lstrip(">").strip().strip("*").strip('"').strip("'")
            if len(text) > 8:
                return text[:max_len] + ("…" if len(text) > max_len else "")
    # Priority 2: first prose paragraph
    skip = [
        lambda l: l.startswith("#"),
        lambda l: l.startswith("|"),
        lambda l: l.strip() == "---",
        lambda l: l.startswith("-") or l.startswith("* "),
        lambda l: bool(re.match(r"^\d+\.", l)),
        lambda l: l.startswith(">"),
        lambda l: l.startswith("![") or l.startswith("["),
        lambda l: l.startswith("**") and l.upper() == l and "**" in l[2:],
        lambda l: len(l.strip()) == 0,
    ]
    for line in lines:
        stripped = line.strip()
        if any(pat(stripped) for pat in skip):
            continue
        text = re.sub(r"\*\*(.+?)\*\*", r"\1", stripped)
        text = re.sub(r"`(.+?)`", r"\1", text)
        text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
        if len(text) > 20:
            return text[:max_len] + ("…" if len(text) > max_len else "")
    return ""


def extract_wikilinks(body):
    return re.findall(r"\[\[(.+?)\]\]", body)


def extract_code_refs(body):
    refs = re.findall(r"`([^`]*?\.md)`", body)
    return [r for r in refs if "/" in r]


def extract_markdown_links(body):
    return [{"text": m.group(1), "url": m.group(2)}
             for m in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", body)
             if not m.group(2).startswith("http")]


def extract_relationships(body):
    relationships = []
    in_rel = False
    for line in body.split("\n"):
        s = line.strip()
        if s.startswith("## Relationships"):
            in_rel = True
            continue
        if in_rel:
            if s.startswith("## ") or s.startswith("---"):
                break
            if s.startswith("|") and "**" in s:
                cells = [c.strip() for c in s.split("|")[1:-1]]
                if len(cells) >= 2:
                    person = re.sub(r"\*\*(.+?)\*\*", r"\1", cells[0]).strip()
                    rel = cells[1].strip().rstrip(".")
                    if person and person != "Person" and person != "---":
                        relationships.append({"person": person, "relationship": rel})
    return relationships


def find_portrait_images(stem):
    base = VAULT_DIR / "images" / "characters"
    result = {}
    for suffix, key in [("", "portrait"), ("-civilian", "civilian"), ("-super", "superhero")]:
        for ext in IMAGE_EXTENSIONS:
            candidate = base / f"{stem}{suffix}{ext}"
            if candidate.exists():
                result[key] = f"/images/characters/{candidate.name}"
                break
    return result


def find_scene_image(stem):
    scene_key = SCENE_PAGE_MAP.get(stem, stem)
    if not scene_key:
        return None
    base = VAULT_DIR / "images" / "locations"
    for ext in IMAGE_EXTENSIONS:
        candidate = base / f"scene_{scene_key}{ext}"
        if candidate.exists():
            return f"/images/locations/{candidate.name}"
    return None


def slug_to_title(slug):
    return slug.replace("-", " ").title()


def get_section_for_path(rel_path):
    # Check longest prefix first to handle subpaths like plot/villain-sheets/
    matches = []
    for section in SECTION_CONFIG:
        prefix = section["subfolder"] + "/"
        if rel_path.startswith(prefix):
            matches.append((len(prefix), section))
    if matches:
        # Return the longest (most specific) match
        matches.sort(key=lambda x: x[0], reverse=True)
        return matches[0][1]
    return None


def generate_manifests():
    files_manifest = {}
    nodes = []
    edges = []
    sections = {}

    for sec in SECTION_CONFIG:
        sections[sec["key"]] = {
            "key": sec["key"],
            "label": sec["label"],
            "icon": sec["icon"],
            "subfolder": sec["subfolder"],
            "files": []
        }

    all_md_files = sorted(VAULT_DIR.rglob("*.md"))

    for md_path in all_md_files:
        rel_path = md_path.relative_to(VAULT_DIR)
        stem = md_path.stem
        if stem.startswith(SKIP_PREFIXES):
            continue

        rel_str = str(rel_path)
        section = get_section_for_path(rel_str)
        section_key = section["key"] if section else None

        raw = md_path.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)
        title = meta.get("title", slug_to_title(stem))
        tags = meta.get("tags", [])
        if isinstance(tags, str):
            tags = [tags]
        description = extract_description(body)
        wikilinks = extract_wikilinks(body)
        code_refs = extract_code_refs(body)
        md_links = extract_markdown_links(body)
        relationships = extract_relationships(body)

        # Resolve wikilinks
        resolved_links = []
        for wl in wikilinks:
            if "." in wl and not wl.endswith(".md"):
                continue
            target_name = wl.replace(" ", "-").lower()
            for other in all_md_files:
                other_stem = other.stem
                if other_stem.startswith("_"):
                    continue
                if target_name == other_stem.lower():
                    resolved_links.append(other_stem)
                    break

        # Images
        images = {}
        if section_key in PORTRAIT_SECTIONS:
            images = find_portrait_images(stem)
        scene = find_scene_image(stem)
        if scene:
            images["scene"] = scene

        file_entry = {
            "path": rel_str,
            "stem": stem,
            "title": title,
            "section": section_key,
            "tags": tags,
            "description": description,
            "images": images,
            "relationships": relationships,
            "links": {
                "wikilinks": resolved_links,
                "code_refs": code_refs,
                "markdown_links": [{"text": l["text"], "url": l["url"]} for l in md_links],
            },
            "last_modified": os.path.getmtime(md_path),
        }
        files_manifest[stem] = file_entry

        if section_key and section_key in sections:
            sections[section_key]["files"].append(stem)

        nodes.append({"id": stem, "label": title, "section": section_key, "type": section_key or "root"})

        for target in resolved_links:
            edges.append({"source": stem, "target": target, "type": "wikilink"})
        for ref in code_refs:
            ref_stem = Path(ref).stem
            edges.append({"source": stem, "target": ref_stem, "type": "code_ref"})
        for link in md_links:
            link_stem = Path(link["url"]).stem
            if link_stem:
                edges.append({"source": stem, "target": link_stem, "type": "md_link"})
        for rel in relationships:
            person_slug = rel["person"].lower().replace(" ", "-")
            edges.append({"source": stem, "target": person_slug, "type": "relationship", "label": rel["relationship"]})

    core_manifest = {
        "site": "world.kaleb.one",
        "title": "Halden City Wiki",
        "description": "A browsable, cross-referenced worldbuilding wiki for the Halden City superhero setting.",
        "sections": sections,
        "section_order": [s["key"] for s in SECTION_CONFIG],
        "stats": {
            "total_files": len(files_manifest),
            "total_edges": len(edges),
            "sections": len(sections),
        },
        "root_files": ["overview", "story-status", "arc-structure", "key-npcs", "player-characters", "institutions", "lore"],
    }

    graph_manifest = {"nodes": nodes, "edges": edges}

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for name, data in [
        ("manifest-core.json", core_manifest),
        ("manifest-files.json", files_manifest),
        ("manifest-graph.json", graph_manifest),
    ]:
        path = OUTPUT_DIR / name
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        count = len(data) if isinstance(data, (list, dict)) else 0
        print(f"  ✓ {name} — {count} entries")

    # Copy images
    for subdir in ["characters", "locations"]:
        src = VAULT_DIR / "images" / subdir
        dst = OUTPUT_DIR / "images" / subdir
        if src.exists():
            dst.mkdir(parents=True, exist_ok=True)
            for f in src.iterdir():
                if f.suffix.lower() in IMAGE_EXTENSIONS:
                    shutil.copy2(f, dst / f.name)
            print(f"  ✓ Copied {len(list(dst.iterdir()))} {subdir} images")

    # Copy vault markdown for serving
    vault_copy = OUTPUT_DIR / "vault"
    vault_copy.mkdir(parents=True, exist_ok=True)
    for md_path in all_md_files:
        if md_path.stem.startswith("_"):
            continue
        rel = md_path.relative_to(VAULT_DIR)
        dst = vault_copy / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(md_path, dst)
    print(f"  ✓ Copied {len(list(vault_copy.rglob('*.md')))} vault markdown files")

    print(f"\n✓ Manifest generation complete.")


if __name__ == "__main__":
    generate_manifests()