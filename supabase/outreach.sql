-- RollMap — Suivi des prises de contact clubs (2026-10-20)
-- Script unique : a lancer une fois dans Supabase > SQL Editor ("Run and enable RLS" si demande).

CREATE TABLE IF NOT EXISTS outreach (
  id BIGSERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'instagram')),
  step TEXT NOT NULL CHECK (step IN ('j0', 'relance')),
  to_address TEXT,
  lot TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'replied', 'stop', 'bounced', 'cancelled')),
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  message_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_club_idx ON outreach (club_id);
CREATE INDEX IF NOT EXISTS outreach_status_idx ON outreach (status, sent_at);
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;  -- aucune policy : cle service uniquement

-- Historique (depuis growth/outreach-clubs-fr.csv), insere une seule fois
INSERT INTO outreach (club_id, channel, step, to_address, lot, status, sent_at, replied_at, notes)
SELECT club_id, channel, step, to_address, lot, status, sent_at::timestamptz, replied_at::timestamptz, notes FROM (VALUES
  (685, 'email', 'j0', 'info@graciebarra75.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée | Julien Cazier (julien@dixdix.org) a répondu'),
  (685, 'email', 'relance', 'info@graciebarra75.com', '1', 'replied', '2026-10-07 12:00+02', '2026-10-09 12:00+02', 'oui : 30€/jour, 80€/semaine, prévenir avant, open mat 1 samedi/2 15h à Vaugirard ; 2 académies (Champerret + Vaugirard créée id 10513)'),
  (874, 'email', 'j0', 'lecubefightclub@gmail.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée'),
  (874, 'email', 'relance', 'lecubefightclub@gmail.com', '1', 'sent', '2026-10-07 12:00+02', NULL, NULL),
  (865, 'email', 'j0', 'sacamp75019@gmail.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée'),
  (865, 'email', 'relance', 'sacamp75019@gmail.com', '1', 'sent', '2026-10-07 12:00+02', NULL, NULL),
  (787, 'email', 'j0', 'jbarbosabel@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (694, 'email', 'j0', 'akio.rnk@hotmail.fr', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (963, 'email', 'j0', 'archy.hzm@gmail.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée'),
  (963, 'email', 'relance', 'archy.hzm@gmail.com', '1', 'sent', '2026-10-07 12:00+02', NULL, NULL),
  (719, 'email', 'j0', 'nicejiujitsu@gmail.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée'),
  (719, 'email', 'relance', 'nicejiujitsu@gmail.com', '1', 'sent', '2026-10-07 12:00+02', NULL, NULL),
  (899, 'email', 'j0', 'flavien1935@gmail.com', '1', 'replied', '2026-09-30 12:00+02', '2026-10-02 12:00+02', 'oui : 15€/cours, 120€/10 cours, open mats lun-mar-jeu 20h30-21h30 + certains dimanches 16h-18h'),
  (1239, 'email', 'j0', 'jjbhonos@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (721, 'email', 'j0', 'arnaud.piete@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (657, 'email', 'j0', 'efernandez@pythagorejiujitsu.com', '1', 'replied', '2026-09-30 12:00+02', '2026-09-30 12:00+02', 'oui : drop-in gratuit, open mat dimanche, nouvelle adresse'),
  (712, 'email', 'j0', 'adam.33bordeaux@gmail.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'Sébastien Vicentini, enthousiaste (''très bonne initiative'')'),
  (712, 'email', 'relance', 'adam.33bordeaux@gmail.com', '1', 'replied', '2026-10-07 12:00+02', '2026-10-09 12:00+02', 'oui : drop-in 10€/cours (assurance), site mis à jour'),
  (1011, 'email', 'j0', 'fightforjiujitsu@gmail.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée'),
  (1011, 'email', 'relance', 'fightforjiujitsu@gmail.com', '1', 'sent', '2026-10-07 12:00+02', NULL, NULL),
  (796, 'email', 'j0', 'info@gbmarseille.com', '1', 'sent', '2026-09-30 12:00+02', NULL, 'relance J+7 envoyée'),
  (796, 'email', 'relance', 'info@gbmarseille.com', '1', 'sent', '2026-10-07 12:00+02', NULL, NULL),
  (954, 'email', 'j0', 'road2jiujitsu@outlook.fr', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (1277, 'email', 'j0', 'berimbologik@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (807, 'email', 'j0', 'stituli@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (1015, 'email', 'j0', 'metajjb@gmail.com', '2', 'replied', '2026-10-09 12:00+02', '2026-10-09 12:00+02', 'oui : 25€ drop-in, 60€ semaine, 100€ mois, 280€ 3 mois ; pas d''open mat mais sessions libres pour drop-in payants'),
  (741, 'email', 'j0', 'acemattoulouse@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (906, 'email', 'j0', 'warmatjjb@gmail.com', '2', 'sent', '2026-10-09 12:00+02', NULL, NULL),
  (9739, 'instagram', 'j0', NULL, 'abu-dhabi', 'sent', '2026-10-13 12:00+02', NULL, 'Instagram : Palms Sports | lien fiche ouvert (Vercel, referrer Facebook/IG) au 14/10'),
  (3419, 'instagram', 'j0', NULL, 'abu-dhabi', 'sent', '2026-10-13 12:00+02', NULL, 'Instagram : Official Page of Commando Group Team | lien fiche ouvert (Vercel, referrer Facebook/IG) au 14/10'),
  (1632, 'instagram', 'j0', NULL, 'abu-dhabi', 'sent', '2026-10-13 12:00+02', NULL, 'Instagram : Abu Dhabi Martial Arts Academy | lien fiche ouvert (Vercel, referrer Facebook/IG) au 14/10'),
  (5721, 'instagram', 'j0', NULL, 'abu-dhabi', 'sent', '2026-10-13 12:00+02', NULL, 'Instagram : Halavanca Europe (compte Europe, pas Abu Dhabi ?) | lien fiche ouvert (Vercel, referrer Facebook/IG) au 14/10')
) AS v(club_id, channel, step, to_address, lot, status, sent_at, replied_at, notes)
WHERE NOT EXISTS (SELECT 1 FROM outreach);

-- Controle : attendu : rls_active = true / 32 lignes / 5 reponses
SELECT
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'outreach') AS rls_active,
  (SELECT count(*) FROM outreach) AS lignes,
  (SELECT count(*) FROM outreach WHERE status = 'replied') AS reponses;
