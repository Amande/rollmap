-- RollMap — Suivi des clics envoyes aux clubs (2026-10-14)
-- A lancer une fois dans Supabase > SQL Editor ("Run and enable RLS" si demande).
-- Les insertions passent par /api/click (cle service) ; aucune lecture publique.

CREATE TABLE IF NOT EXISTS club_clicks (
  id BIGSERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  target TEXT NOT NULL CHECK (target IN ('website', 'instagram', 'phone', 'email', 'directions')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS club_clicks_club_id_idx ON club_clicks (club_id, created_at);

ALTER TABLE club_clicks ENABLE ROW LEVEL SECURITY;
-- Pas de policy : seule la cle service (API) peut lire/ecrire.

-- Exemple de rapport par club (30 derniers jours) :
-- SELECT c.id, c.name, c.city, k.target, count(*)
-- FROM club_clicks k JOIN clubs c ON c.id = k.club_id
-- WHERE k.created_at > now() - interval '30 days'
-- GROUP BY 1, 2, 3, 4 ORDER BY count(*) DESC;
