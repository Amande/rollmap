"""
Geocode all clubs missing lat/lng using Nominatim (OpenStreetMap).
Rate limit: 1 request per 1.1 seconds.
Saves progress every 50 clubs.

Strategy:
1. Try full address (if available)
2. Try city + country
3. Try address with structured query (city/country separate)
4. Try just city name alone

Usage: python3 src/data/geocode-missing.py
"""

import json
import time
import urllib.request
import urllib.parse
import sys

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWd2YXZlYXVwb3F2b3ZxbW9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY1NTYxMSwiZXhwIjoyMDkxMjMxNjExfQ.iQOmrTtKmAzh85HdzWHlcZ6yTkt7RRn1upeiWPIyWa4"
BASE = "https://ubegvaveaupoqvovqmog.supabase.co/rest/v1/clubs"
PROGRESS_FILE = "src/data/geocode-progress.json"
LOG_FILE = "src/data/geocode-log.txt"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

# Normalize country names for better geocoding
COUNTRY_MAP = {
    "Brasil": "Brazil",
    "Korea, South": "South Korea",
    "Korea, North": "North Korea",
    "USA": "United States",
    "United States of America": "United States",
    "UK": "United Kingdom",
    "Uae": "United Arab Emirates",
    "UAE": "United Arab Emirates",
    "Czech Republic": "Czechia",
}


def fetch_clubs_without_coords():
    """Fetch all clubs missing lat/lng in batches."""
    all_clubs = []
    page = 0
    while True:
        req = urllib.request.Request(
            f"{BASE}?select=id,name,address,city,country&or=(lat.is.null,lng.is.null)&order=id&limit=1000&offset={page * 1000}",
            headers=HEADERS,
        )
        data = json.loads(urllib.request.urlopen(req).read())
        if not data:
            break
        all_clubs.extend(data)
        page += 1
    return all_clubs


def geocode_free(query):
    """Free-text query to Nominatim."""
    params = urllib.parse.urlencode({"q": query, "format": "json", "limit": 1})
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "RollMap/1.0 (rollmap.co)"})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        results = json.loads(resp.read())
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass
    return None


def geocode_structured(city=None, country=None):
    """Structured query to Nominatim (better for city+country)."""
    params = {"format": "json", "limit": 1}
    if city:
        params["city"] = city
    if country:
        params["country"] = COUNTRY_MAP.get(country, country)
    url = f"https://nominatim.openstreetmap.org/search?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "RollMap/1.0 (rollmap.co)"})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        results = json.loads(resp.read())
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception:
        pass
    return None


def update_club(club_id, lat, lng):
    """Update club coordinates in Supabase."""
    payload = json.dumps({"lat": lat, "lng": lng}).encode()
    req = urllib.request.Request(
        f"{BASE}?id=eq.{club_id}",
        data=payload,
        headers=HEADERS,
        method="PATCH",
    )
    req.add_header("Prefer", "return=minimal")
    urllib.request.urlopen(req)


def load_progress():
    try:
        with open(PROGRESS_FILE, "r") as f:
            return set(json.load(f))
    except:
        return set()


def save_progress(done_ids):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(list(done_ids), f)


def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def geocode_club(club):
    """Try multiple strategies to geocode a club. Returns (lat, lng) or None."""
    city = club.get("city") or ""
    country = club.get("country") or ""
    address = club.get("address") or ""
    name = club.get("name") or ""
    norm_country = COUNTRY_MAP.get(country, country)

    # Strategy 1: Structured query with city + country (most reliable)
    if city and country:
        result = geocode_structured(city=city, country=norm_country)
        if result:
            return result
        time.sleep(1.1)

    # Strategy 2: Full address as free text
    if address:
        result = geocode_free(address)
        if result:
            return result
        time.sleep(1.1)

    # Strategy 3: City alone (without country, for weird country names)
    if city:
        result = geocode_free(city)
        if result:
            return result
        time.sleep(1.1)

    # Strategy 4: Club name + country
    if name and country:
        result = geocode_free(f"{name}, {norm_country}")
        if result:
            return result
        time.sleep(1.1)

    return None


def main():
    log("=" * 60)
    log("Starting geocoding run")
    log("Fetching clubs without coordinates...")
    clubs = fetch_clubs_without_coords()
    log(f"Found {len(clubs)} clubs to geocode")

    done = load_progress()
    log(f"Already processed: {len(done)}")

    remaining = [c for c in clubs if c["id"] not in done]
    log(f"Remaining: {len(remaining)}")

    if not remaining:
        log("Nothing to do!")
        return

    geocoded = 0
    failed = 0

    for i, club in enumerate(remaining):
        result = geocode_club(club)

        if result:
            lat, lng = result
            update_club(club["id"], lat, lng)
            geocoded += 1
        else:
            failed += 1

        done.add(club["id"])

        # Rate limit between clubs (if geocode_club didn't sleep enough)
        time.sleep(1.1)

        # Progress log every 50
        if (i + 1) % 50 == 0:
            save_progress(done)
            elapsed_pct = (i + 1) / len(remaining) * 100
            log(f"Progress: {i+1}/{len(remaining)} ({elapsed_pct:.1f}%) — geocoded: {geocoded}, failed: {failed}")

    # Final save
    save_progress(done)
    log(f"\nDone! Geocoded: {geocoded}, Failed: {failed}, Total processed: {len(remaining)}")


if __name__ == "__main__":
    main()
