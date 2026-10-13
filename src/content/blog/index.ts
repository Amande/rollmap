export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  author: string;
  readTime: string;
  cityLinks?: string[]; // city slugs to link to
  countryLinks?: string[]; // country slugs
  event?: string; // tournament name — shows a callout on the cityLinks pages
  content: string; // simple markdown-like blocks
}

export const POSTS: BlogPost[] = [
  {
    slug: "abu-dhabi-world-pro-2026-where-to-train",
    title: "Abu Dhabi World Pro 2026: Dates & Where to Train",
    description:
      "Abu Dhabi World Professional Jiu-Jitsu Championship 2026: Nov 9–21 at Mubadala Arena, pro divisions Nov 19–21. Key info + BJJ gyms in Abu Dhabi and the UAE.",
    date: "2026-10-13",
    author: "Amandine",
    readTime: "4 min read",
    cityLinks: ["abu-dhabi", "dubai", "al-ain"],
    countryLinks: ["united-arab-emirates"],
    event: "the Abu Dhabi World Pro 2026",
    content: `
## One of the biggest jiu-jitsu events of the year

The 18th **Abu Dhabi World Professional Jiu-Jitsu Championship** takes place from **November 9 to 21, 2026** at **Mubadala Arena** in Abu Dhabi. Around **12,000 athletes** from all over the world are expected, according to the UAE's official news agency.

The event runs over 13 days: the first days cover youth, masters and other divisions, and the **professional divisions run from November 19 to 21**.

## Registration

Registration is handled on the official AJP website (ajptour.com). At the time of writing, the event listing shows a late registration window until **November 1, 2026**. Always check the official page for the latest deadlines and weigh-in times before booking your trip.

## Training before your matches

Abu Dhabi has a strong jiu-jitsu culture: the sport is taught widely in the UAE and there are plenty of mats to keep your timing sharp before competing.

RollMap lists **17 gyms in Abu Dhabi** and more across the Emirates. Browse all [BJJ gyms in Abu Dhabi](/city/abu-dhabi), the [gyms in Dubai](/city/dubai) and [Al Ain](/city/al-ain), or every [BJJ gym in the UAE](/country/united-arab-emirates).

## Tips for World Pro week

1. **Message gyms early.** Event weeks bring a lot of visiting athletes. A quick Instagram message avoids surprises with class times or drop-in fees.
2. **Train early or late.** Even in November, midday in Abu Dhabi is warm. Morning and evening classes are the most comfortable.
3. **Keep it light.** The week before a big tournament is for sharpening, not for hard rounds with strangers.
4. **Plan your weight.** Check the official weigh-in schedule for your division as soon as it's published.

Competing at the World Pro? Tell us which gym you trained at with the "I've trained here" button, it helps the next traveler.

Oss.
    `.trim(),
  },
  {
    slug: "ibjjf-no-gi-worlds-2026-las-vegas-where-to-train",
    title: "IBJJF No-Gi Worlds 2026 Las Vegas: Dates & Where to Train",
    description:
      "World IBJJF No-Gi Championship 2026: Dec 10–12 at the Las Vegas Convention Center. Registration closes Nov 29. All key deadlines + BJJ gyms in Las Vegas.",
    date: "2026-10-13",
    author: "Amandine",
    readTime: "4 min read",
    cityLinks: ["las-vegas"],
    countryLinks: ["united-states"],
    event: "the IBJJF No-Gi Worlds 2026",
    content: `
## The No-Gi world championship is in Vegas

The **World IBJJF Jiu-Jitsu No-Gi Championship 2026** runs from **December 10 to 12, 2026** at the **Las Vegas Convention Center** (Halls N3/N4, 300 Convention Center Dr). Adult and master divisions, blue to black belt.

## Key dates to put in your calendar

- **November 19, 2026** — affiliation deadline
- **November 29, 2026** — registration deadline (11:59 PM local time)
- **November 30, 2026** — athlete correction deadline
- **December 4, 2026** — registration checkday
- **December 9, 2026** — schedule and brackets released
- **December 10–12, 2026** — competition days

Registration fee is **$204 until November 29**. Spectator entry is **$25 per day**, free for kids 12 and under.

## Weigh-in: don't get caught out

Weigh-in happens **right before your first fight**, in pounds, with **only one attempt**. If you're over the limit, you're disqualified from your division. Plan your cut accordingly, and be in the bullpen at least one hour before your estimated start time.

## Training before your matches

Vegas is one of the busiest cities in the world for combat sports. RollMap lists **35+ BJJ gyms in Las Vegas**, from big international affiliations to small local academies. Browse all [BJJ gyms in Las Vegas](/city/las-vegas) or every [BJJ gym in the United States](/country/united-states).

## Tips for No-Gi Worlds week

1. **Stay close to your gym.** Vegas is spread out. Check the map before assuming a gym is walkable from the Strip.
2. **Hydrate like it's a competition.** The desert air dries you out fast, especially after a long flight.
3. **Message before you go.** Event weeks bring a lot of visitors. A quick Instagram message avoids surprises with class times or drop-in fees.
4. **Bring your no-gi kit.** Rashguard and spats or shorts, and check each gym's dress code.

Competing at No-Gi Worlds? Tell us which gym you trained at with the "I've trained here" button, it helps the next traveler.

Oss.
    `.trim(),
  },
    {
    slug: "ibjjf-europeans-2027-lisbon-where-to-train",
    title: "IBJJF Europeans 2027 Lisbon: Dates & Where to Train",
    description:
      "European IBJJF Championship 2027: Jan 13–23 in Odivelas, Lisbon. Registration closes Jan 3. All key deadlines + BJJ gyms to train at during your trip.",
    date: "2026-09-30",
    author: "Amandine",
    readTime: "4 min read",
    cityLinks: ["lisbon", "odivelas"],
    countryLinks: ["portugal"],
    event: "the IBJJF Europeans 2027",
    content: `
## The biggest BJJ tournament in Europe is back near Lisbon

The 2027 European IBJJF Jiu-Jitsu Championship runs from **January 13 to 23, 2027** at the **Pavilhão Multiusos de Odivelas**, just north of Lisbon. Thousands of athletes from all over the world will fly in, from juvenile divisions to masters and adult black belts.

If you're competing, or just coming to watch, you'll probably spend a few days in the city. That's the perfect excuse to train somewhere new.

## Key dates to put in your calendar

- **December 23, 2026** — affiliation deadline
- **January 3, 2027** — registration deadline
- **January 4, 2027** — athlete correction deadline
- **January 8, 2027** — registration checkday
- **January 13–23, 2027** — competition days

Always double-check the official IBJJF event page before booking: schedules can move depending on bracket sizes.

## Training before your matches

Want to keep your timing sharp without getting injured the week of the tournament? A few light drilling sessions or a relaxed open mat in a gym near your hotel is the way to go.

RollMap lists **35+ gyms in Lisbon** and a few right in **Odivelas**, a short ride from the venue. Browse all [BJJ gyms in Lisbon](/city/lisbon), the [gyms in Odivelas](/city/odivelas), or every [BJJ gym in Portugal](/country/portugal).

## Tips for Europeans week

1. **Message gyms early.** During Europeans week, many gyms get a lot of visitors. Send a quick Instagram message a few days before to confirm drop-in and class times.
2. **Ask about competitor-friendly sessions.** Some gyms run lighter sessions or open mats for visiting athletes during big tournaments.
3. **Plan your weight.** January in Lisbon is mild, but you'll be eating out a lot. Keep a scale in your bag.
4. **Stay after your division.** The tournament runs for more than a week, so if your bracket is early, you have time to train, recover and watch the black belts on the final weekend.

Competing at the Europeans? Tell us which gym you trained at with the "I've trained here" button, it helps the next traveler.

Oss.
    `.trim(),
  },
  {
    slug: "bjj-gyms-lisbon-guide",
    title: "Training BJJ in Lisbon: the traveler's guide",
    description:
      "Everything you need to know to train Brazilian Jiu-Jitsu in Lisbon as a visitor. Drop-in culture, gym recommendations, prices, and what to expect.",
    date: "2026-04-20",
    author: "Amandine",
    readTime: "5 min read",
    cityLinks: ["lisbon"],
    countryLinks: ["portugal"],
    content: `
## Why Lisbon is great for BJJ travelers

Lisbon has quietly become one of Europe's best BJJ destinations. The combination of a strong local scene, low cost of living, warm weather year-round, and a welcoming culture makes it a natural stop for nomads and traveling grapplers.

Most gyms in Lisbon are **drop-in friendly**, especially in central neighborhoods like Alfama, Bairro Alto, and Parque das Nações. Expect drop-in fees between **€10 and €20** per class, with some gyms offering weekly passes around €40–60.

## What to expect on the mats

- **Most classes run in English or Portuguese** — English is widely spoken by instructors
- **Warm rooms** — Lisbon gets hot. Bring a rashguard and plan to sweat
- **Open Mats on weekends** are common and usually free or very cheap
- **No-Gi is growing fast** — you'll find dedicated no-gi classes in most top gyms

## How to find a gym

The easiest way is to check our [Lisbon page](/city/lisbon) — we list every gym we know about in the city, with filters for Gi, No-Gi, Open Mat, and Drop-in friendly. You can also browse all [BJJ gyms in Portugal](/country/portugal).

Most gyms are happy to accommodate travelers — just send them an Instagram message 1–2 days before you plan to visit.

## Tips for your trip

1. **Book a place with access to washing machines** — you'll need to wash your Gi daily in the heat
2. **Check schedules carefully** — some gyms close for part of August
3. **Bring both Gi and No-Gi gear** — you'll want both options
4. **Respect the house style** — some Lisbon gyms lean heavily toward IBJJF rules, others favor submission-only

Oss.
    `.trim(),
  },
  {
    slug: "drop-in-bjj-etiquette",
    title: "Drop-in BJJ etiquette: what to expect when training abroad",
    description:
      "A practical guide to drop-in training for traveling BJJ practitioners. How to contact gyms, what to bring, how much to pay, and common mistakes to avoid.",
    date: "2026-04-18",
    author: "Amandine",
    readTime: "4 min read",
    content: `
## Why drop-in culture matters

Dropping in at a new gym is one of the best parts of being a BJJ traveler. It connects you to the global community, teaches you new styles, and gives you friends in cities you've never lived in. But every gym has its own culture, and getting it right the first time matters.

## Before you arrive

**Email or DM the gym 2–3 days ahead**. Tell them:
- Your belt rank and gym affiliation
- Which classes you want to attend
- When you're arriving

Most gyms reply within a day. If they don't, try their Instagram — it's often faster than email.

## What to bring

- **Gi + No-Gi gear** (even if you only plan one, bring both)
- **Mouthguard** (many gyms require it, some won't let you spar without one)
- **Flip-flops** (never walk barefoot to/from the mats)
- **Cash or a card** for the drop-in fee

## How much does it cost?

Drop-in fees vary widely:
- **Europe**: €10–25 per class
- **USA**: $20–40 per class
- **Brazil**: R$30–60 per class
- **Asia**: very variable, from $5 in Thailand to $40 in Japan

Weekly passes often save 30–50%. Always ask.

## Mat etiquette reminders

1. **Shake hands with everyone** when you arrive and when you leave
2. **Roll to your level, not above it** — no ego, no spaz
3. **Tap early, tap often** — you're traveling, don't get injured
4. **Thank the instructor** before you leave, especially if they taught for free
5. **Post on your IG story** with the gym's handle — costs you nothing, gyms love it

Find a gym to drop in at on [RollMap](/) — 10,000+ clubs worldwide.
    `.trim(),
  },
  {
    slug: "best-bjj-destinations-europe-2026",
    title: "Best BJJ destinations in Europe 2026",
    description:
      "The top European cities and countries for Brazilian Jiu-Jitsu travelers in 2026. Where to train, what to expect, and why.",
    date: "2026-04-15",
    author: "Amandine",
    readTime: "6 min read",
    cityLinks: ["lisbon", "paris", "barcelona", "london"],
    countryLinks: ["portugal", "france", "spain", "united-kingdom"],
    content: `
## Europe is a BJJ playground

The European BJJ scene has exploded in the last 5 years. What used to be 3–4 major cities is now a continent-wide network of serious schools, international camps, and drop-in friendly gyms. Here are the destinations I'd prioritize in 2026.

## 1. Lisbon, Portugal

**Why**: Warm weather year-round, thriving BJJ scene, affordable, nomad-friendly.

180+ gyms in Portugal, most concentrated in Lisbon and Porto. Drop-in fees are among the lowest in Western Europe (€10–20). English is widely spoken. See all [BJJ gyms in Portugal](/country/portugal).

## 2. Paris, France

**Why**: Dense gym network, strong competitive scene, accessible from anywhere.

France has 680+ registered clubs — one of the largest BJJ ecosystems in Europe. Paris alone has 20+ gyms across the metro area. Drop-in culture is growing but still less standardized than Portugal or the UK. See [BJJ gyms in Paris](/city/paris) or [all of France](/country/france).

## 3. Barcelona, Spain

**Why**: Mediterranean climate, beach lifestyle, solid gym network.

Barcelona draws BJJ travelers year-round. Many gyms have English-speaking instructors and Open Mats on Saturdays. See [BJJ gyms in Barcelona](/city/barcelona) or [all of Spain](/country/spain).

## 4. London, United Kingdom

**Why**: World-class instruction, dense scene, easy travel hub.

London has some of the most respected gyms in Europe. Drop-in fees are higher (£20–30) but the quality is exceptional. See [BJJ gyms in London](/city/london) or [all of the UK](/country/united-kingdom).

## 5. Warsaw & Krakow, Poland

**Why**: Hidden gem. Strong scene, very affordable, growing fast.

Poland's BJJ scene is one of the fastest-growing in Europe. Drop-in fees are €5–10 in many places.

## Honorable mentions

- **Amsterdam** — compact, walkable, good for short trips
- **Berlin** — creative scene, open to visitors
- **Dublin** — friendly, strong Irish BJJ community
- **Helsinki** — small but high-quality scene

## Planning your trip

Use [RollMap](/) to search by city or country, filter by Gi, No-Gi, Open Mat, and Drop-in friendly. Every gym has contact info — reach out before you travel.

Happy rolling.
    `.trim(),
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Tournament posts linked to a city page (for the "Visiting for a tournament?" callout) */
export function getEventPostsForCity(citySlug: string): BlogPost[] {
  const slug = citySlug.toLowerCase();
  return getAllPosts().filter((p) => p.event && p.cityLinks?.includes(slug));
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}
