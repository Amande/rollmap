-- RollMap — Suppression des doublons de clubs (2026-10-22)
-- Script unique a lancer dans Supabase > SQL Editor ("Run and enable RLS" si demande).
-- 17 doublons surs (meme adresse, ou meme club present dans 2 sources)
-- + 39 fiches curated_v2 (generees par IA, sans aucun contact) qui doublonnent un vrai club de la meme ville.
-- Garde-fous : on ne supprime jamais un club verifie ni un club qui a un historique (emails, suggestions, clics).

BEGIN;

CREATE TEMP TABLE dedupe_pairs (delete_id INTEGER PRIMARY KEY, keep_id INTEGER NOT NULL) ON COMMIT DROP;
INSERT INTO dedupe_pairs (delete_id, keep_id) VALUES
  (5288, 1240),
  (5654, 635),
  (2744, 2743),
  (6955, 1928),
  (9482, 5319),
  (10401, 10398),
  (2703, 2702),
  (6144, 950),
  (7309, 944),
  (5446, 5149),
  (6374, 753),
  (376, 231),
  (2686, 715),
  (3167, 995),
  (5536, 2651),
  (2531, 1319),
  (1618, 712),
  (272, 5390),
  (273, 3259),
  (278, 2234),
  (303, 182),
  (315, 253),
  (325, 8069),
  (326, 7157),
  (329, 188),
  (346, 6681),
  (351, 7873),
  (352, 1881),
  (353, 8101),
  (359, 7627),
  (361, 199),
  (366, 2352),
  (367, 7272),
  (368, 2810),
  (369, 247),
  (371, 3768),
  (372, 8332),
  (375, 265),
  (408, 9169),
  (419, 5182),
  (424, 9122),
  (434, 5218),
  (438, 147),
  (444, 4847),
  (450, 8265),
  (478, 4483),
  (485, 5268),
  (487, 3287),
  (489, 6264),
  (516, 5414),
  (534, 5332),
  (542, 5263),
  (548, 162),
  (549, 7823),
  (550, 5872),
  (552, 8764);

-- Garde-fous : retirer de la liste tout club protege
DELETE FROM dedupe_pairs p
WHERE EXISTS (SELECT 1 FROM clubs c WHERE c.id = p.delete_id AND c.verified)
   OR EXISTS (SELECT 1 FROM outreach o WHERE o.club_id = p.delete_id)
   OR EXISTS (SELECT 1 FROM club_suggestions s WHERE s.club_id = p.delete_id)
   OR EXISTS (SELECT 1 FROM club_clicks k WHERE k.club_id = p.delete_id);

-- 1. Sauvegarde
CREATE TABLE IF NOT EXISTS clubs_backup_20261022 AS SELECT * FROM clubs WHERE false;
ALTER TABLE clubs_backup_20261022 ENABLE ROW LEVEL SECURITY;
INSERT INTO clubs_backup_20261022 SELECT c.* FROM clubs c JOIN dedupe_pairs p ON p.delete_id = c.id;

-- 2. Recuperer les infos utiles du doublon si la fiche gardee ne les a pas
UPDATE clubs k SET
  website   = COALESCE(k.website, d.website),
  instagram = COALESCE(k.instagram, d.instagram),
  email     = COALESCE(k.email, d.email),
  phone     = COALESCE(k.phone, d.phone),
  lat       = COALESCE(k.lat, d.lat),
  lng       = COALESCE(k.lng, d.lng),
  location  = COALESCE(k.location, d.location)
FROM dedupe_pairs p JOIN clubs d ON d.id = p.delete_id
WHERE k.id = p.keep_id;

-- 3. Suppression
DELETE FROM clubs c USING dedupe_pairs p WHERE c.id = p.delete_id;

-- Controle : attendu = 56 sauvegardees (un peu moins si des clubs ont ete proteges) / 0 restantes / RLS backup = true
SELECT
  (SELECT count(*) FROM clubs_backup_20261022) AS sauvegardees,
  (SELECT count(*) FROM clubs WHERE id IN (SELECT delete_id FROM dedupe_pairs)) AS restantes,
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'clubs_backup_20261022') AS rls_backup;

COMMIT;
