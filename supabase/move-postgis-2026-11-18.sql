-- RollMap — Deplacer PostGIS hors du schema public (2026-11-18)
-- Corrige l'alerte "RLS Disabled in Public Entity: public.spatial_ref_sys" : la table systeme
-- de PostGIS appartient a supabase_admin (RLS impossible a activer) et etait modifiable via l'API.
-- La colonne clubs.location est recalculee depuis lat/lng : aucune perte de donnees.
-- Script unique, en une transaction : si une etape echoue, rien n'est applique.

BEGIN;

-- 1. Objets qui dependent de PostGIS
DROP FUNCTION IF EXISTS public.nearby_clubs(double precision, double precision, double precision);
DROP INDEX IF EXISTS public.clubs_location_idx;
ALTER TABLE public.clubs DROP COLUMN IF EXISTS location;

-- Tables de sauvegarde (clubs_backup_*, clubs_removed...) : leurs colonnes PostGIS sont
-- recalculables depuis lat/lng, qu'elles conservent. On retire toute colonne geography/geometry
-- restante dans public pour que PostGIS puisse etre deplace.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND udt_name IN ('geography', 'geometry')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', c.table_name, c.column_name);
    RAISE NOTICE 'Colonne retiree : %.%', c.table_name, c.column_name;
  END LOOP;
END $$;

-- 2. Reinstaller PostGIS dans le schema "extensions" (non expose par l'API)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS postgis;            -- sans CASCADE : echoue proprement s'il reste une dependance
CREATE EXTENSION postgis WITH SCHEMA extensions;

-- 3. Recreer la colonne et l'index, recalcules depuis lat/lng
ALTER TABLE public.clubs ADD COLUMN location extensions.geography(Point, 4326);
UPDATE public.clubs
SET location = extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography
WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX clubs_location_idx ON public.clubs USING gist (location);

-- 4. Recreer nearby_clubs (et corriger le bug des parametres masques par les colonnes lat/lng)
CREATE OR REPLACE FUNCTION public.nearby_clubs(p_lat double precision, p_lng double precision, p_radius_km double precision DEFAULT 50)
RETURNS SETOF public.clubs
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT *
  FROM public.clubs
  WHERE location IS NOT NULL
    AND extensions.ST_DWithin(location, extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography, p_radius_km * 1000)
  ORDER BY location OPERATOR(extensions.<->) extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography;
$$;

COMMIT;

-- Controle : attendu = postgis dans "extensions", plus de spatial_ref_sys dans public,
-- autant de clubs avec location que de clubs avec lat/lng, nearby_clubs autour de Lisbonne > 0
SELECT
  (SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'postgis') AS schema_postgis,
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spatial_ref_sys') AS spatial_ref_sys_dans_public,
  (SELECT count(*) FROM public.clubs WHERE lat IS NOT NULL AND lng IS NOT NULL) AS clubs_avec_gps,
  (SELECT count(*) FROM public.clubs WHERE location IS NOT NULL) AS clubs_avec_location,
  (SELECT count(*) FROM public.nearby_clubs(38.7223, -9.1393, 15)) AS clubs_proches_lisbonne;
