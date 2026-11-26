#!/usr/bin/env python3
"""Bump de version du cache PWA.

Incrémente `const CACHE = "ttt-vN"` dans static/sw.js et ajoute `?v=N` à toutes les
références d'assets (js/*.js, styles.css) dans static/*.html. Comme ça, un déploiement
change les URLs : plus de mélange entre vieille et nouvelle version des fichiers en cache.

Usage : python3 tools/bump_cache.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "static"
SW = ROOT / "sw.js"


def main():
    sw = SW.read_text(encoding="utf-8")
    m = re.search(r'const CACHE = "ttt-v(\d+)";', sw)
    if not m:
        sys.exit("constante CACHE introuvable dans sw.js")
    n = int(m.group(1)) + 1
    sw = sw[: m.start()] + f'const CACHE = "ttt-v{n}";' + sw[m.end() :]
    SW.write_text(sw, encoding="utf-8")

    changed = 0
    for html in sorted(ROOT.glob("*.html")):
        src = html.read_text(encoding="utf-8")
        new = re.sub(r'(src="js/[^"]+?\.js|href="styles\.css)(\?v=\d+)?"', rf'\1?v={n}"', src)
        if new != src:
            html.write_text(new, encoding="utf-8")
            changed += 1
    print(f"cache bump -> ttt-v{n} ({changed} pages HTML mises à jour avec ?v={n})")


if __name__ == "__main__":
    main()
