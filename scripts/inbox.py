#!/usr/bin/env python3
"""RollMap — traitement des reponses des clubs (boite Gmail RollMap, IMAP).

  python3 scripts/inbox.py check [--no-auto]   # releve les emails non traites -> inbox-pending.json
  python3 scripts/inbox.py apply decisions.json  # applique les decisions validees par Amandine

`check` lit sans marquer comme lu (BODY.PEEK). Il applique seul deux cas sans ambiguite
(adresse invalide -> bounced, "stop" explicite -> stop) et ecarte les notifications
automatiques (no-reply, Google), sauf avec --no-auto ; tout le reste
attend une decision validee. Les emails traites recoivent le libelle Gmail "rollmap-traite".

Format de decisions.json (une entree par email) :
  [{"uid": "123", "action": "update" | "ignore",
    "club_id": 899, "club_update": {"drop_in": true, "drop_in_price": "..."},
    "outreach_status": "replied" | "stop" | null, "notes": "...",
    "reply_body": "texte de la reponse (optionnel)"}]
"""

import argparse
import email
import imaplib
import json
import os
import re
import smtplib
import ssl
import sys
from datetime import datetime, timezone
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.utils import formataddr, make_msgid, parseaddr, parsedate_to_datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from outreach import db, fetch_all, load_env, pretty_name  # noqa: E402

DONE_LABEL = "rollmap-traite"
PENDING_FILE = Path(__file__).resolve().parent.parent / "scripts" / "inbox-pending.json"
CLUB_FIELDS = {"drop_in", "drop_in_price", "open_mat", "schedule_notes", "website", "instagram",
               "phone", "email", "address", "gi", "nogi", "kids_friendly", "name"}
STOP_PATTERNS = re.compile(r"\b(stop(?!\s+by)|unsubscribe|d[ée]sinscri\w*|pas int[ée]ress[ée]e?s?|not interested|"
                           r"ne plus (me|nous) contacter|retirez|supprimez)\b", re.I)
QUOTE_START = re.compile(r"^(le .+ a [ée]crit ?:|on .+ wrote:|-----original message-----|de ?: .+@)", re.I)


def imap_connect():
    m = imaplib.IMAP4_SSL("imap.gmail.com", 993)
    m.login(os.environ["OUTREACH_GMAIL_USER"], os.environ["OUTREACH_GMAIL_APP_PASSWORD"])
    m.select("INBOX")
    return m


def decode(value):
    return str(make_header(decode_header(value))) if value else ""


def text_body(msg):
    """Plain-text body without the quoted original message."""
    part = None
    if msg.is_multipart():
        for p in msg.walk():
            if p.get_content_type() == "text/plain" and "attachment" not in str(p.get("Content-Disposition", "")):
                part = p
                break
        if part is None:
            for p in msg.walk():
                if p.get_content_type() == "text/html":
                    part = p
                    break
    else:
        part = msg
    if part is None:
        return ""
    raw = part.get_payload(decode=True) or b""
    text = raw.decode(part.get_content_charset() or "utf-8", errors="replace")
    if part.get_content_type() == "text/html":
        text = re.sub(r"<br\s*/?>|</p>", "\n", text, flags=re.I)
        text = re.sub(r"<[^>]+>", "", text)
    lines = []
    for line in text.splitlines():
        if line.startswith(">") or QUOTE_START.match(line.strip()):
            break
        lines.append(line.rstrip())
    return "\n".join(lines).strip()


def classify(msg, sender, subject, body):
    if re.search(r"(^|[.@])(no-?reply|noreply|notifications?)[@.]|@accounts\.google\.com$|googlecommunityteam", sender, re.I):
        return "system"
    if re.search(r"mailer-daemon|postmaster", sender, re.I) or \
            re.search(r"delivery status notification|undeliver|non remis|address not found", subject, re.I):
        return "bounce"
    if msg.get("Auto-Submitted", "no").lower() != "no" or \
            re.search(r"r[ée]ponse automatique|out of office|absence|automatic reply|autoreply", subject, re.I):
        return "auto"
    # "stop" only when the whole reply is short, to avoid catching "Stop by any time!"
    # "stop" only for a short reply with no sign of a positive answer (a wrong "stop" excludes the club for good)
    positive = re.search(r"\b(oui|yes|welcome|bienvenue|drop|open mat|tarif|prix|price|euros?)\b|€", body, re.I)
    if len(body) < 150 and STOP_PATTERNS.search(body) and not positive:
        return "stop"
    return "reply"


def match_outreach(msg, sender, subject, outreach_rows):
    refs = " ".join(filter(None, [msg.get("In-Reply-To"), msg.get("References")]))
    if refs:
        for row in outreach_rows:
            if row.get("message_id") and row["message_id"] in refs:
                return row
    sender_l = sender.lower()
    by_address = [r for r in outreach_rows if (r.get("to_address") or "").lower() == sender_l]
    if by_address:
        return sorted(by_address, key=lambda r: r.get("sent_at") or "")[-1]
    return None


def bounced_address(body):
    found = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", body)
    return found[0].lower() if found else None


def cmd_check(args):
    m = imap_connect()
    try:
        m.create(DONE_LABEL)
    except imaplib.IMAP4.error:
        pass
    typ, data = m.uid("search", None, "X-GM-RAW", f'"in:inbox -label:{DONE_LABEL}"')
    uids = data[0].split() if data and data[0] else []
    outreach_rows = fetch_all("outreach?select=id,club_id,to_address,message_id,sent_at,status,lot,step&channel=eq.email")
    pending, auto_done = [], []

    for uid in uids:
        uid = uid.decode()
        typ, msg_data = m.uid("fetch", uid, "(BODY.PEEK[])")
        msg = email.message_from_bytes(msg_data[0][1])
        sender = parseaddr(msg.get("From", ""))[1]
        subject = decode(msg.get("Subject"))
        body = text_body(msg)
        kind = classify(msg, sender, subject, body)
        row = match_outreach(msg, sender, subject, outreach_rows)
        if not row and kind == "bounce":
            addr = bounced_address(body)
            row = next((r for r in outreach_rows if (r.get("to_address") or "").lower() == addr), None)
        club_id = row["club_id"] if row else None
        if not club_id:
            hit = re.search(r"#(\d+)", subject)
            club_id = int(hit.group(1)) if hit else None

        if not args.no_auto and kind == "system":
            m.uid("store", uid, "+X-GM-LABELS", f"({DONE_LABEL})")
            auto_done.append({"kind": kind, "club_id": None, "from": sender, "subject": subject})
            continue

        if not args.no_auto and row and kind in ("bounce", "stop"):
            db("PATCH", f"outreach?id=eq.{row['id']}", {"status": "bounced" if kind == "bounce" else "stop",
                                                       "replied_at": datetime.now(timezone.utc).isoformat()})
            m.uid("store", uid, "+X-GM-LABELS", f"({DONE_LABEL})")
            auto_done.append({"kind": kind, "club_id": club_id, "from": sender, "subject": subject})
            continue

        club = None
        if club_id:
            found = db("GET", f"clubs?select=id,name,city,drop_in,drop_in_price,open_mat,schedule_notes,"
                              f"website,instagram,phone,email,address,verified&id=eq.{club_id}")
            club = found[0] if found else None
        try:
            date = parsedate_to_datetime(msg.get("Date")).isoformat()
        except (TypeError, ValueError):
            date = None
        pending.append({"uid": uid, "kind": kind, "from": sender, "subject": subject, "date": date,
                        "message_id": msg.get("Message-ID"), "outreach_id": row["id"] if row else None,
                        "club": club, "body": body[:3000]})
    m.logout()

    PENDING_FILE.write_text(json.dumps(pending, ensure_ascii=False, indent=2))
    print(f"{len(uids)} email(s) non traite(s) | auto : {len(auto_done)} | a decider : {len(pending)}")
    for a in auto_done:
        print(f"  AUTO {a['kind']:6} club #{a['club_id']} <- {a['from']} | {a['subject']}")
    for p in pending:
        club = f"#{p['club']['id']} {pretty_name(p['club']['name'])}" if p["club"] else "club inconnu"
        print(f"  {p['kind']:6} uid {p['uid']} | {club} <- {p['from']} | {p['subject']}")
    print(f"Detail : {PENDING_FILE}")


def send_reply(original, body):
    user = os.environ["OUTREACH_GMAIL_USER"]
    msg = EmailMessage()
    msg["From"] = formataddr(("Amandine — RollMap", user))
    msg["To"] = original["from"]
    subject = original["subject"] or ""
    msg["Subject"] = subject if subject.lower().startswith("re:") else f"Re: {subject}"
    msg["Message-ID"] = make_msgid(domain="rollmap.co")
    if original.get("message_id"):
        msg["In-Reply-To"] = original["message_id"]
        msg["References"] = original["message_id"]
    msg.set_content(body)
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(user, os.environ["OUTREACH_GMAIL_APP_PASSWORD"])
        smtp.send_message(msg)


def cmd_apply(args):
    decisions = json.loads(Path(args.file).read_text())
    pending = {p["uid"]: p for p in json.loads(PENDING_FILE.read_text())}
    m = imap_connect()
    for d in decisions:
        original = pending.get(str(d["uid"]))
        if not original:
            print(f"uid {d['uid']} : introuvable dans {PENDING_FILE.name}, ignore")
            continue
        if d.get("action") == "update" and d.get("club_id"):
            update = {k: v for k, v in (d.get("club_update") or {}).items() if k in CLUB_FIELDS}
            rejected = set(d.get("club_update") or {}) - CLUB_FIELDS
            if rejected:
                print(f"  champs refuses : {sorted(rejected)}")
            if update:
                update["verified"] = True
                db("PATCH", f"clubs?id=eq.{d['club_id']}", update)
                print(f"uid {d['uid']} : fiche #{d['club_id']} mise a jour ({', '.join(sorted(update))})")
        if original.get("outreach_id") and d.get("outreach_status"):
            db("PATCH", f"outreach?id=eq.{original['outreach_id']}",
               {"status": d["outreach_status"], "replied_at": original.get("date") or datetime.now(timezone.utc).isoformat(),
                "notes": d.get("notes")})
        if d.get("reply_body"):
            send_reply(original, d["reply_body"])
            print(f"uid {d['uid']} : reponse envoyee a {original['from']}")
        m.uid("store", str(d["uid"]), "+X-GM-LABELS", f"({DONE_LABEL})")
    m.logout()
    print("Termine.")


def main():
    parser = argparse.ArgumentParser(description="RollMap inbox")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("check"); p.add_argument("--no-auto", action="store_true")
    p = sub.add_parser("apply"); p.add_argument("file")
    args = parser.parse_args()
    load_env()
    for key in ("OUTREACH_GMAIL_USER", "OUTREACH_GMAIL_APP_PASSWORD"):
        if not os.environ.get(key):
            sys.exit(f"Variable manquante dans .env.local : {key}")
    {"check": cmd_check, "apply": cmd_apply}[args.cmd](args)


if __name__ == "__main__":
    main()
