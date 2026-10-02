#!/usr/bin/env python3
"""Small regression checks for security/performance remediations.

Uses only the Python standard library; it does not rewrite site files.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

# An image must be rendered with <img>/<picture>, never executed as JavaScript.
for path in ROOT.rglob("*.html"):
    text = path.read_text(encoding="utf-8", errors="replace")
    for match in re.finditer(r'<script\\b[^>]*\\bsrc\\s*=\\s*["\']([^"\']+)["\']', text, re.I):
        src = match.group(1).split("?", 1)[0].lower()
        if src.endswith((".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg")):
            errors.append(f"{path.relative_to(ROOT)}: image asset incorrectly loaded as script: {match.group(1)}")

    consent_count = len(re.findall(r'<script\\b[^>]*\\bsrc\\s*=\\s*["\'][^"\']*cookie-consent\\.js(?:\\?[^"\']*)?["\']', text, re.I))
    if consent_count > 1:
        errors.append(f"{path.relative_to(ROOT)}: cookie-consent.js included {consent_count} times")

headers_path = ROOT / "_headers"
if headers_path.exists():
    headers = headers_path.read_text(encoding="utf-8", errors="replace").lower()
    for name in (
        "strict-transport-security:",
        "x-content-type-options:",
        "x-frame-options:",
        "referrer-policy:",
        "permissions-policy:",
    ):
        if name not in headers:
            errors.append(f"_headers: missing expected security header {name}")
else:
    errors.append("_headers: file is missing")

if errors:
    print("Site regression checks failed:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("Site regression checks passed.")
