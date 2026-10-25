#!/usr/bin/env python3
"""RollMap — cherche les contacts publics (email, Instagram) sur les sites des clubs.

  python3 scripts/find_contacts.py clubs.json contacts-found.json

clubs.json : liste [{"id", "name", "city", "website", ...}] ; seules les pages d'accueil et de contact
de chaque site sont lues (8 sites en parallele, 12 s max par page). Les emails trouves servent a
l'envoi : ils ne sont pas publies sur les fiches.
"""
import concurrent.futures as cf
import html
import json
import re
import ssl
import sys
import urllib.parse
import urllib.request

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
INSTAGRAM = re.compile(r"instagram\.com/([A-Za-z0-9_.]{2,30})", re.I)
JUNK_EMAIL = re.compile(r"\.(png|jpe?g|gif|webp|svg|css|js)$|sentry|wixpress|example\.|domain\.com|godaddy|"
                        r"squarespace|yourdomain|@2x|schema\.org|cloudflare|zenplanner|mindbody", re.I)
JUNK_IG = {"p", "explore", "accounts", "reel", "reels", "stories", "instagram", "sharer", "tv"}
CONTACT_PATHS = ["", "/contact", "/contactos", "/contacto", "/contact-us", "/contato"]

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (RollMap directory check; +https://rollmap.co)"})
        with urllib.request.urlopen(req, timeout=12, context=CTX) as res:
            return res.read(600_000).decode("utf-8", "replace")
    except Exception:
        return ""


def scan(club):
    base = club["website"].strip()
    if not base.startswith("http"):
        base = "https://" + base
    parts = urllib.parse.urlparse(base)
    root = f"{parts.scheme}://{parts.netloc}"
    emails, handles = set(), set()
    for path in CONTACT_PATHS:
        text = html.unescape(fetch(root + path if path else base)).replace("%40", "@").replace("[at]", "@")
        emails |= {e.strip(".").lower() for e in EMAIL.findall(text) if not JUNK_EMAIL.search(e)}
        handles |= {h for h in INSTAGRAM.findall(text) if h.lower() not in JUNK_IG}
        if emails:
            break
    domain = parts.netloc.replace("www.", "")
    # Club's own domain and generic inboxes first
    ranked = sorted(emails, key=lambda e: (domain not in e, not e.startswith(("info", "contact", "hello", "geral", "office"))))
    return {**club, "found_emails": ranked[:3], "found_ig": sorted(handles)[:2]}


def main():
    clubs = [c for c in json.load(open(sys.argv[1])) if c.get("website")]
    with cf.ThreadPoolExecutor(8) as pool:
        found = list(pool.map(scan, clubs))
    json.dump(found, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
    print(f"sites: {len(found)} | avec email: {sum(1 for f in found if f['found_emails'])} | "
          f"avec Instagram: {sum(1 for f in found if f['found_ig'])}")


if __name__ == "__main__":
    main()
