# RollMap — Find BJJ gyms to train, anywhere.

MVP web app to discover 1300+ Brazilian Jiu-Jitsu gyms worldwide.

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL + PostGIS)
- **Leaflet** + react-leaflet + marker clusters
- **Vercel** for deployment

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

3. Run the schema in Supabase SQL editor — copy the contents of `supabase/schema.sql` and execute it.

### 3. Import club data

```bash
npm install -D tsx dotenv
npx tsx src/data/import-clubs.ts
```

After import, run this SQL in Supabase to populate the PostGIS location column:

```sql
UPDATE clubs
SET location = ST_MakePoint(lng, lat)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## Project structure

```
src/
  app/
    layout.tsx          -- Global layout (dark theme, Inter font)
    page.tsx            -- Landing page (search + world map)
    LandingMap.tsx      -- Client component for landing map
    search/
      page.tsx          -- Search results wrapper (Suspense)
      SearchContent.tsx -- Search results (list + map + filters)
    club/
      [id]/
        page.tsx        -- Club detail page (SSR, SEO)
  components/
    Map.tsx             -- Leaflet map (client only)
    MapDynamic.tsx      -- Dynamic import wrapper (no SSR)
    ClubCard.tsx        -- Club card in list
    SearchBar.tsx       -- Search input
    FilterBar.tsx       -- Gi/No-Gi/Open Mat/Drop-in filters
    ClubDetail.tsx      -- Full club detail view
  lib/
    supabase.ts         -- Supabase client
    types.ts            -- TypeScript types
  data/
    import-clubs.ts     -- Import script (JSON -> Supabase)
supabase/
  schema.sql            -- Database schema (PostGIS)
```

## Design

- Dark theme (#0f1117 bg, #22d3a7 accent)
- Inter font
- Colored badges: Gi (blue), No-Gi (purple), Open Mat (amber), Drop-in (green)
- Dark Carto basemap tiles
- Marker clustering

## Deploy to Vercel

```bash
npx vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
