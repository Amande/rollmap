export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  author: string;
  readTime: string;
  cityLinks?: string[]; // city slugs to link to
  countryLinks?: string[]; // country slugs
  content: string; // simple markdown-like blocks
}

export const POSTS: BlogPost[] = [
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

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}
