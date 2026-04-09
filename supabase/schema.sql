-- RollMap — Supabase schema
-- Run this in the Supabase SQL editor to set up the database

-- Enable PostGIS
create extension if not exists postgis;

-- Clubs table
create table clubs (
  id serial primary key,
  name text not null,
  address text,
  city text,
  country text default 'France',
  lat double precision,
  lng double precision,
  location geography(Point, 4326),
  website text,
  instagram text,
  phone text,
  email text,
  drop_in boolean,
  gi boolean default true,
  nogi boolean,
  open_mat boolean,
  price text,
  nb_licencies text,
  source text,
  source_url text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index spatial pour recherche geographique
create index clubs_location_idx on clubs using gist(location);

-- Index sur ville et pays
create index clubs_city_idx on clubs(city);
create index clubs_country_idx on clubs(country);

-- Index full-text sur nom
create index clubs_name_idx on clubs using gin(to_tsvector('simple', name));

-- Fonction pour recherche par proximite
create or replace function nearby_clubs(
  lat double precision,
  lng double precision,
  radius_km double precision default 50
)
returns setof clubs as $$
  select *
  from clubs
  where location is not null
    and ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  order by location <-> ST_MakePoint(lng, lat)::geography;
$$ language sql;

-- Trigger pour auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clubs_updated_at
  before update on clubs
  for each row
  execute function update_updated_at();

-- RLS (Row Level Security) — lecture publique
alter table clubs enable row level security;

create policy "Clubs are publicly readable"
  on clubs for select
  using (true);
