#!/usr/bin/env python3
"""RollMap — notifie IndexNow (Bing, Yandex, Seznam, Naver... et les moteurs qui s'appuient dessus).

  python3 scripts/indexnow.py clubs 906 787        # fiche(s) club + leur page ville
  python3 scripts/indexnow.py urls https://rollmap.co/blog/...
  python3 scripts/indexnow.py sitemap              # toutes les URLs du sitemap (apres un gros changement)

La cle (INDEXNOW_KEY dans .env.local) est servie publiquement a https://rollmap.co/<cle>.txt.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from outreach import db, load_env  # noqa: E402

SITE = "https://rollmap.co"
ENDPOINT = "https://api.indexnow.org/indexnow"
BATCH = 10_000


def submit(urls):
    key = os.environ.get("INDEXNOW_KEY")
    if not key:
        sys.exit("INDEXNOW_KEY manquante dans .env.local")
    urls = sorted(set(urls))
    for i in range(0, len(urls), BATCH):
        chunk = urls[i:i + BATCH]
        body = json.dumps({"host": "rollmap.co", "key": key, "keyLocation": f"{SITE}/{key}.txt", "urlList": chunk}).encode()
        req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                print(f"IndexNow : {len(chunk)} URL(s) -> HTTP {res.status}")
        except urllib.error.HTTPError as e:
            print(f"IndexNow : {len(chunk)} URL(s) -> HTTP {e.code} {e.read()[:200]!r}")


def club_urls(ids):
    rows = db("GET", f"clubs?select=id,city&id=in.({','.join(str(i) for i in ids)})")
    urls = [f"{SITE}/club/{r['id']}" for r in rows]
    urls += [f"{SITE}/city/{urllib.parse.quote(r['city'].lower().replace(' ', '-'))}" for r in rows if r.get("city")]
    return urls


def sitemap_urls():
    with urllib.request.urlopen(f"{SITE}/sitemap.xml", timeout=60) as res:
        return re.findall(r"<loc>([^<]+)</loc>", res.read().decode())


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    load_env()
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "clubs":
        submit(club_urls(args))
    elif cmd == "urls":
        submit(args)
    elif cmd == "sitemap":
        submit(sitemap_urls())
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
