-- RollMap — Nettoyage données 2026-09-30
-- A lancer dans Supabase > SQL Editor. Tout est dans une transaction : si une étape échoue, rien n'est appliqué.

BEGIN;

-- 1. Sauvegarde des lignes touchées (pour pouvoir revenir en arrière)
CREATE TABLE clubs_backup_20260930 AS
SELECT * FROM clubs
WHERE source = 'curated_v2'
   OR city IN ('Lisboa', 'Warszawa')
   OR id IN (1369, 1403, 4203, 5418, 6797, 7678, 8401, 8440, 8886, 9355);

CREATE TABLE club_suggestions_backup_20260930 AS
SELECT * FROM club_suggestions WHERE club_id IN (277, 283, 284);

-- 2. Noms de villes mal encodés
UPDATE clubs SET city = 'Wrocław', address = 'Legnicka 65, Wrocław, Dolnośląskie, Poland' WHERE id = 1369;
UPDATE clubs SET city = 'Velké Přítočno', address = 'Lískovec 170, Velké Přítočno, Czech Republic' WHERE id = 1403;
UPDATE clubs SET city = 'Ilhabela' WHERE id = 4203;
UPDATE clubs SET city = 'Santa Bárbara d''Oeste', address = 'Avenida São Paulo 361, Santa Bárbara d''Oeste, São Paulo, Brasil' WHERE id = 5418;
UPDATE clubs SET city = 'Brasília', address = 'Qnp 28, Conjunto K Casa 04, Ceilândia, Brasília, DF, Brasil' WHERE id = 7678;
UPDATE clubs SET city = 'Świdnik' WHERE id = 9355;

-- 3. Clubs japonais à la ville illisible
UPDATE clubs SET city = NULL, address = NULL WHERE id IN (6797, 8886);
UPDATE clubs SET city = NULL, address = NULL, lat = NULL, lng = NULL, location = NULL WHERE id = 8401; -- coordonnées au Brésil, fausses
UPDATE clubs SET city = 'Tokyo', address = 'Kameari, Katsushika, Tokyo, Japan',
  lat = 35.7662467, lng = 139.8482807,
  location = ST_MakePoint(139.8482807, 35.7662467)::geography
WHERE id = 8440; -- Strapple Kameari, était géolocalisé en Allemagne

-- 4. Une seule page par ville (nom anglais)
UPDATE clubs SET city = 'Lisbon' WHERE city = 'Lisboa';
UPDATE clubs SET city = 'Warsaw' WHERE city = 'Warszawa';

-- 5. Doublons issus de curated_v2 (le vrai club existe déjà via IBJJF)
DELETE FROM clubs WHERE id IN (
  283, -- Atos Lisbon        -> doublon de 2234 Atos Jiu-Jitsu Lisboa
  284, -- Nova Uniao Lisbon  -> doublon de 7274 Nova União - Lisboa
  277  -- Gracie Barra Cascais (rangé à Lisbonne) -> doublon de 9510 Gracie Barra Cascais Centro
);

-- 6. Option 1 : la mention drop-in de curated_v2 n'a jamais été vérifiée -> inconnu
UPDATE clubs SET drop_in = NULL WHERE source = 'curated_v2';

-- Contrôles avant validation
SELECT 'curated_v2 drop_in restants' AS check, count(*) FROM clubs WHERE source = 'curated_v2' AND drop_in IS NOT NULL
UNION ALL SELECT 'clubs Lisboa restants', count(*) FROM clubs WHERE city = 'Lisboa'
UNION ALL SELECT 'clubs Lisbon', count(*) FROM clubs WHERE city = 'Lisbon'
UNION ALL SELECT 'doublons restants', count(*) FROM clubs WHERE id IN (277, 283, 284)
UNION ALL SELECT 'lignes sauvegardées', count(*) FROM clubs_backup_20260930;

COMMIT;
