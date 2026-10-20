#!/usr/bin/env python3
"""RollMap — prise de contact des clubs par email (Gmail SMTP).

Flux : preview (cree des brouillons en base + les affiche) -> validation d'Amandine -> send.
Rien n'est envoye sans la commande `send`.

  python3 scripts/outreach.py preview [--size 10]   # nouveau lot J0 (clubs FR avec email, jamais contactes)
  python3 scripts/outreach.py preview-file contacts.json --lot us-1 [--lang en]  # lot depuis un fichier de contacts
  python3 scripts/outreach.py followups             # brouillons de relance J+7 (1 seule relance)
  python3 scripts/outreach.py send --lot LOT        # envoie les brouillons du lot (10-20/jour max)
  python3 scripts/outreach.py cancel --lot LOT      # annule les brouillons du lot
  python3 scripts/outreach.py status                # resume du suivi

Variables (.env.local) : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
OUTREACH_GMAIL_USER, OUTREACH_GMAIL_APP_PASSWORD.
"""

import argparse
import json
import os
import random
import smtplib
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://rollmap.co"
CONTACT = "contact@rollmap.co"
MAX_PER_LOT = 20
RELANCE_AFTER_DAYS = 7
# Villes les plus utiles aux voyageurs d'abord, puis les autres par taille de club
PRIORITY_CITIES = ["paris", "lyon", "marseille", "toulouse", "nice", "nantes", "bordeaux",
                   "lille", "montpellier", "strasbourg", "rennes", "grenoble"]
KEEP_UPPER = {"BJJ", "JJB", "MMA", "ADAM", "GB", "CSPSE", "RNK", "JJ", "TFC", "AJA"}


def load_env():
    env_file = ROOT / ".env.local"
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())
    for key in ("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
        if not os.environ.get(key):
            sys.exit(f"Variable manquante dans .env.local : {key}")


def db(method, path, body=None, prefer="return=representation"):
    url = f"{os.environ['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/{path}"
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"apikey": key, "Authorization": f"Bearer {key}",
                 "Content-Type": "application/json", "Prefer": prefer},
    )
    with urllib.request.urlopen(req) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def fetch_all(path):
    rows, page = [], 0
    while True:
        sep = "&" if "?" in path else "?"
        batch = db("GET", f"{path}{sep}limit=1000&offset={page * 1000}")
        rows += batch
        if len(batch) < 1000:
            return rows
        page += 1


def pretty_name(name):
    if not name.isupper():
        return name.strip()
    words = []
    for w in name.split():
        core = w.strip("()-")
        words.append(w if core in KEEP_UPPER else "-".join(part.capitalize() for part in w.split("-")))
    return " ".join(words)


def pretty_city(city):
    city = city.strip()
    return city.title() if city.isupper() or city.islower() else city


def j0_email(club):
    name, city = pretty_name(club["name"]), pretty_city(club["city"] or "")
    link = f"{SITE}/club/{club['id']}"
    subject = f"{name} est sur RollMap — votre fiche est-elle à jour ?"
    body = f"""Bonjour,

Je m'appelle Amandine, JJB addict et je voyage souvent. J'ai créé RollMap (https://rollmap.co), une carte gratuite des clubs de JJB dans le monde, pour aider les pratiquants de passage à trouver où s'entraîner.

{name} y est déjà référencé : {link}

Pour que les voyageurs qui passent par {city} puissent venir rouler chez vous, il me manque 3 infos :
1. Acceptez-vous les pratiquants de passage (drop-in) ?
2. Si oui, à quel tarif, et faut-il prévenir avant ?
3. Avez-vous un open mat ?

Une simple réponse à ce mail suffit, je mets la fiche à jour. Vous pouvez aussi la corriger directement via le bouton "Suggest an edit".

Et si RollMap vous paraît utile, un lien vers votre fiche sur votre site ou dans votre bio Instagram nous aide beaucoup à être trouvés par les voyageurs.

Pas intéressé ? Dites-le-moi et je ne vous relance pas.

Merci et bons entraînements,
Oss !
Amandine — RollMap
"""
    return subject, body


def relance_email(club, original_subject):
    name = pretty_name(club["name"])
    link = f"{SITE}/club/{club['id']}"
    subject = original_subject if original_subject.startswith("Re:") else f"Re: {original_subject}"
    body = f"""Hello,

Petite relance de mon message de la semaine dernière : est-ce que vous acceptez les pratiquants de passage chez {name} ?

Une réponse en une ligne me suffit (oui/non, tarif, open mat), je mets la fiche à jour : {link}

Pas intéressé ? Dites-le-moi et je ne vous relance plus.

Oss !
Amandine — RollMap
"""
    return subject, body


def j0_email_en(club):
    name, city = pretty_name(club["name"]), pretty_city(club["city"] or "")
    link = f"{SITE}/club/{club['id']}"
    subject = f"{name} is on RollMap — is your listing up to date?"
    body = f"""Hi,

I'm Amandine, a BJJ addict who travels a lot. I built RollMap (https://rollmap.co), a free map of BJJ gyms around the world to help traveling grapplers find a place to train.

{name} is already listed: {link}

So that people visiting {city} can come and roll with you, could you confirm 3 things:
1. Do you welcome visitors / drop-ins?
2. If so, what's the drop-in price, and should they message you first?
3. Do you run an open mat?

A one-line reply is enough, I'll update your page right away. You can also edit it directly with the "Suggest an edit" button.

And if you like RollMap, feel free to share it with your members who travel, it helps the whole community find good mats.

Not interested? Just tell me and I won't follow up.

Thanks and good training,
Oss!
Amandine — RollMap
"""
    return subject, body


def relance_email_en(club, original_subject):
    name = pretty_name(club["name"])
    link = f"{SITE}/club/{club['id']}"
    subject = original_subject if original_subject.startswith("Re:") else f"Re: {original_subject}"
    body = f"""Hi,

Quick follow-up on my message from last week: do you welcome drop-in visitors at {name}?

A one-line reply is enough (yes/no, price, open mat), I'll update your page: {link}

Not interested? Just tell me and I won't follow up again.

Oss!
Amandine — RollMap
"""
    return subject, body


def print_drafts(drafts, clubs_by_id):
    for i, d in enumerate(drafts, 1):
        club = clubs_by_id[d["club_id"]]
        print(f"\n### {i}. {pretty_name(club['name'])} — {pretty_city(club['city'] or '')} (#{club['id']})")
        print(f"**À :** {d['to_address']}  \n**Objet :** {d['subject']}\n")
        print("```\n" + d["body"].rstrip() + "\n```")


def cmd_preview(args):
    size = min(args.size, MAX_PER_LOT)
    contacted = {r["club_id"] for r in fetch_all("outreach?select=club_id&status=neq.cancelled")}
    stopped_addresses = {r["to_address"] for r in fetch_all("outreach?select=to_address&status=eq.stop")}
    clubs = fetch_all("clubs?select=id,name,city,email,nb_licencies&country=eq.France&email=not.is.null")

    def rank(c):
        city = (c["city"] or "").lower()
        city_rank = PRIORITY_CITIES.index(city) if city in PRIORITY_CITIES else len(PRIORITY_CITIES)
        size_n = int("".join(ch for ch in (c["nb_licencies"] or "0") if ch.isdigit()) or 0)
        return (city_rank, -size_n)

    # Eligible clubs grouped by city, biggest clubs first within each city
    seen_emails = set()
    by_city = {}
    for c in sorted(clubs, key=rank):
        email = (c["email"] or "").strip().lower()
        if c["id"] in contacted or "@" not in email or email in stopped_addresses or email in seen_emails:
            continue
        seen_emails.add(email)
        by_city.setdefault((c["city"] or "").lower(), []).append(c)

    # Round-robin across cities (priority cities first) so each batch mixes cities
    queues = list(by_city.values())
    candidates = []
    while len(candidates) < size and any(queues):
        for queue in queues:
            if queue and len(candidates) < size:
                candidates.append(queue.pop(0))
    if not candidates:
        print("Aucun club eligible.")
        return

    lot = args.lot or datetime.now().strftime("fr-%Y%m%d-%H%M")
    rows = []
    for c in candidates:
        subject, body = j0_email(c)
        rows.append({"club_id": c["id"], "channel": "email", "step": "j0", "to_address": c["email"].strip(),
                     "lot": lot, "status": "draft", "subject": subject, "body": body})
    drafts = db("POST", "outreach", rows)
    print(f"## Lot {lot} — {len(drafts)} brouillons (rien n'est envoye)")
    print_drafts(drafts, {c["id"]: c for c in candidates})
    print(f"\nPour envoyer : python3 scripts/outreach.py send --lot {lot}")


def cmd_preview_file(args):
    """Drafts from a JSON contacts file [{"club_id": 1, "email": "x@y.com"}] (emails stay out of the public listing)."""
    contacts = json.loads(Path(args.file).read_text())[: min(args.size, MAX_PER_LOT)]
    contacted = {r["club_id"] for r in fetch_all("outreach?select=club_id&status=neq.cancelled")}
    stopped = {r["to_address"] for r in fetch_all("outreach?select=to_address&status=eq.stop")}
    contacts = [c for c in contacts if c["club_id"] not in contacted and c["email"].lower() not in stopped]
    if not contacts:
        print("Aucun contact eligible.")
        return
    ids = ",".join(str(c["club_id"]) for c in contacts)
    clubs = {c["id"]: c for c in fetch_all(f"clubs?select=id,name,city&id=in.({ids})")}
    template = j0_email_en if args.lang == "en" else j0_email
    rows = []
    for c in contacts:
        subject, body = template(clubs[c["club_id"]])
        rows.append({"club_id": c["club_id"], "channel": "email", "step": "j0", "to_address": c["email"],
                     "lot": args.lot, "status": "draft", "subject": subject, "body": body})
    drafts = db("POST", "outreach", rows)
    print(f"## Lot {args.lot} — {len(drafts)} brouillons (rien n'est envoye)")
    print_drafts(drafts, clubs)
    print(f"\nPour envoyer : python3 scripts/outreach.py send --lot {args.lot}")


def cmd_followups(args):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RELANCE_AFTER_DAYS)).isoformat()
    sent = fetch_all(f"outreach?select=*&channel=eq.email&step=eq.j0&status=eq.sent&sent_at=lt.{urllib.parse.quote(cutoff)}")
    already = {r["club_id"] for r in fetch_all("outreach?select=club_id&step=eq.relance&status=neq.cancelled")}
    closed = {r["club_id"] for r in fetch_all("outreach?select=club_id&status=in.(replied,stop,bounced)")}
    todo = [r for r in sent if r["club_id"] not in already and r["club_id"] not in closed][:MAX_PER_LOT]
    if not todo:
        print("Aucune relance a faire.")
        return
    ids = ",".join(str(r["club_id"]) for r in todo)
    clubs = {c["id"]: c for c in fetch_all(f"clubs?select=id,name,city&id=in.({ids})")}
    lot = args.lot or datetime.now().strftime("relance-%Y%m%d-%H%M")
    rows = []
    for r in todo:
        original = r["subject"] or j0_email({**clubs[r["club_id"]], "email": r["to_address"]})[0]
        relance = relance_email_en if "is on RollMap" in original else relance_email
        subject, body = relance(clubs[r["club_id"]], original)
        rows.append({"club_id": r["club_id"], "channel": "email", "step": "relance", "to_address": r["to_address"],
                     "lot": lot, "status": "draft", "subject": subject, "body": body,
                     "notes": f"in_reply_to:{r['message_id']}" if r.get("message_id") else None})
    drafts = db("POST", "outreach", rows)
    print(f"## Relances {lot} — {len(drafts)} brouillons (rien n'est envoye)")
    print_drafts(drafts, clubs)
    print(f"\nPour envoyer : python3 scripts/outreach.py send --lot {lot}")


def cmd_send(args):
    user = os.environ.get("OUTREACH_GMAIL_USER")
    password = os.environ.get("OUTREACH_GMAIL_APP_PASSWORD")
    if not user or not password:
        sys.exit("OUTREACH_GMAIL_USER / OUTREACH_GMAIL_APP_PASSWORD manquants dans .env.local")
    drafts = fetch_all(f"outreach?select=*&lot=eq.{urllib.parse.quote(args.lot)}&status=eq.draft&order=id")
    if not drafts:
        sys.exit(f"Aucun brouillon pour le lot {args.lot}")
    if len(drafts) > MAX_PER_LOT:
        sys.exit(f"{len(drafts)} brouillons : maximum {MAX_PER_LOT} par lot")

    for i, d in enumerate(drafts, 1):
        msg = EmailMessage()
        msg["From"] = formataddr(("Amandine — RollMap", user))
        msg["To"] = d["to_address"]
        msg["Reply-To"] = user
        msg["Subject"] = d["subject"]
        msg["Message-ID"] = make_msgid(domain="rollmap.co")
        msg["List-Unsubscribe"] = f"<mailto:{CONTACT}?subject=stop>"
        if d.get("notes", "") and d["notes"].startswith("in_reply_to:"):
            original_id = d["notes"].split(":", 1)[1]
            msg["In-Reply-To"] = original_id
            msg["References"] = original_id
        msg.set_content(d["body"])

        try:
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                smtp.login(user, password)
                smtp.send_message(msg)
            db("PATCH", f"outreach?id=eq.{d['id']}", {"status": "sent", "message_id": msg["Message-ID"],
                                                       "sent_at": datetime.now(timezone.utc).isoformat()})
            print(f"[{i}/{len(drafts)}] envoye -> {d['to_address']}", flush=True)
        except Exception as e:  # on continue avec les suivants, le brouillon reste en draft
            print(f"[{i}/{len(drafts)}] ECHEC -> {d['to_address']} : {type(e).__name__} {e}", flush=True)

        if i < len(drafts):
            time.sleep(random.randint(90, 180))  # espacer les envois pour la delivrabilite
    print("Termine.")


def cmd_cancel(args):
    cancelled = db("PATCH", f"outreach?lot=eq.{urllib.parse.quote(args.lot)}&status=eq.draft", {"status": "cancelled"})
    print(f"{len(cancelled)} brouillons annules.")


def cmd_status(args):
    rows = fetch_all("outreach?select=lot,channel,step,status")
    summary = {}
    for r in rows:
        key = (r["lot"] or "-", r["channel"], r["step"])
        summary.setdefault(key, {}).setdefault(r["status"], 0)
        summary[key][r["status"]] += 1
    print("| Lot | Canal | Etape | Statuts |\n|---|---|---|---|")
    for (lot, channel, step), counts in sorted(summary.items()):
        print(f"| {lot} | {channel} | {step} | " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())) + " |")


def main():
    parser = argparse.ArgumentParser(description="RollMap outreach clubs")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("preview"); p.add_argument("--size", type=int, default=10); p.add_argument("--lot")
    p = sub.add_parser("preview-file"); p.add_argument("file"); p.add_argument("--lot", required=True)
    p.add_argument("--lang", choices=["fr", "en"], default="en"); p.add_argument("--size", type=int, default=10)
    p = sub.add_parser("followups"); p.add_argument("--lot")
    p = sub.add_parser("send"); p.add_argument("--lot", required=True)
    p = sub.add_parser("cancel"); p.add_argument("--lot", required=True)
    sub.add_parser("status")
    args = parser.parse_args()
    load_env()
    {"preview": cmd_preview, "preview-file": cmd_preview_file, "followups": cmd_followups, "send": cmd_send,
     "cancel": cmd_cancel, "status": cmd_status}[args.cmd](args)


if __name__ == "__main__":
    main()
