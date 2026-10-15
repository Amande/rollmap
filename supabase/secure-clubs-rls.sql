-- RollMap — Securite : la table clubs etait modifiable avec la cle publique (2026-10-15)
-- PRE-REQUIS : la variable SUPABASE_SERVICE_ROLE_KEY dans Vercel doit contenir la cle "service_role"
-- (Supabase > Project Settings > API), sinon les suggestions d'edition ne fonctionneront plus.

BEGIN;

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le site affiche les clubs avec la cle publique)
DROP POLICY IF EXISTS "Public read clubs" ON clubs;
CREATE POLICY "Public read clubs" ON clubs FOR SELECT USING (true);

-- Aucune policy d'ecriture : INSERT / UPDATE / DELETE reserves a la cle service (API serveur, scripts admin)

COMMIT;

-- Controle : doit renvoyer "true"
SELECT relrowsecurity FROM pg_class WHERE relname = 'clubs';
