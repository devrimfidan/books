#!/usr/bin/env python3
"""Export book notes from the Obsidian vault to data/books.json.

Usage:
    python3 scripts/export_vault.py [VAULT_REFERENCES_DIR] [OUTPUT_JSON]

Defaults:
    VAULT_REFERENCES_DIR = ~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Emin-Notes/References
    OUTPUT_JSON          = data/books.json (relative to the repo root)

Only notes whose `categories` contain [[Books]] are exported. The body of the
note (## Notlarım) is never published. Standard library only.
"""
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

DEFAULT_VAULT = Path.home() / "Library/Mobile Documents/iCloud~md~obsidian/Documents/Emin-Notes/References"
REPO_ROOT = Path(__file__).resolve().parent.parent

LIST_FIELDS = {"categories", "author", "topics", "genre", "format"}
WIKILINK = re.compile(r"^\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]$")


def unquote(v: str) -> str:
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
    return v.strip()


def clean(v: str) -> str:
    v = unquote(v)
    m = WIKILINK.match(v)
    return m.group(1).strip() if m else v


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    data, key = {}, None
    for raw in text[3:end].splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        item = re.match(r"^\s*-\s*(.*)$", raw)
        if item and key is not None:
            if not isinstance(data.get(key), list):
                data[key] = []
            val = clean(item.group(1))
            if val:
                data[key].append(val)
            continue
        kv = re.match(r"^([A-Za-z0-9_\-]+):\s*(.*)$", raw)
        if not kv:
            continue
        key, val = kv.group(1), kv.group(2).strip()
        if val.startswith("[") and val.endswith("]") and not val.startswith("[["):
            data[key] = [clean(x) for x in val[1:-1].split(",") if clean(x)]
        elif val == "":
            data[key] = [] if key in LIST_FIELDS else None
        else:
            data[key] = clean(val)
    return data


def as_list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def as_int(v):
    try:
        return int(float(str(v)))
    except (TypeError, ValueError):
        return None


def as_num(v):
    try:
        n = float(str(v))
        return int(n) if n.is_integer() else n
    except (TypeError, ValueError):
        return None


def as_date(v):
    if not v:
        return None
    m = re.match(r"^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?", str(v))
    return m.group(0) if m else None


def as_url(v):
    v = (v or "").strip() if isinstance(v, str) else ""
    return v if v.startswith("http") else None


def isbn(v):
    s = re.sub(r"[^0-9Xx]", "", str(v or ""))
    return s if len(s) in (10, 13) else None


def export(vault: Path, out: Path):
    books = []
    for path in sorted(vault.glob("*.md")):
        try:
            fm = parse_frontmatter(path.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, OSError):
            continue
        if "Books" not in as_list(fm.get("categories")):
            continue
        title = path.stem
        authors = as_list(fm.get("author"))
        # Disambiguated filenames look like "Title - Author"; drop the author part.
        for a in authors:
            if title.endswith(" - " + a):
                title = title[: -len(" - " + a)]
        books.append({
            "id": re.sub(r"[^a-z0-9]+", "-", path.stem.lower()).strip("-") or str(len(books)),
            "title": title,
            "authors": authors,
            "year": as_int(fm.get("year")),
            "pages": as_int(fm.get("pages")),
            "language": fm.get("language") or None,
            "formats": as_list(fm.get("format")),
            "status": fm.get("status") or "Backlog",
            "rating": as_num(fm.get("rating")),
            "topics": as_list(fm.get("topics")),
            "genre": as_list(fm.get("genre")),
            "depth": fm.get("depth") or None,
            "dateRead": as_date(fm.get("last")),
            "added": as_date(fm.get("created")),
            "isbn13": isbn(fm.get("isbn13")),
            "isbn": isbn(fm.get("isbn")),
            "cover": as_url(fm.get("cover")),
            "goodreads": as_url(fm.get("goodreads")),
        })
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"generated": date.today().isoformat(), "count": len(books), "books": books}
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return books


if __name__ == "__main__":
    vault = Path(os.path.expanduser(sys.argv[1])) if len(sys.argv) > 1 else DEFAULT_VAULT
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else REPO_ROOT / "data" / "books.json"
    books = export(vault, out)
    print(f"{len(books)} books -> {out}")
