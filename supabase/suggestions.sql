-- Table for community suggestions / edits on clubs
CREATE TABLE IF NOT EXISTS club_suggestions (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Suggested info
  kids_friendly BOOLEAN,
  adults_only BOOLEAN,
  schedule_notes TEXT,
  drop_in_price TEXT,
  gi BOOLEAN,
  nogi BOOLEAN,
  open_mat BOOLEAN,
  drop_in BOOLEAN,
  website TEXT,
  instagram TEXT,
  comment TEXT,

  -- Meta
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public inserts (anyone can suggest)
ALTER TABLE club_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert suggestions"
  ON club_suggestions FOR INSERT
  WITH CHECK (true);

-- Only service role can read/update (for admin review)
CREATE POLICY "Service role can manage suggestions"
  ON club_suggestions FOR ALL
  USING (auth.role() = 'service_role');

-- Also add kids/schedule columns to clubs table for when suggestions are approved
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS kids_friendly BOOLEAN;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS schedule_notes TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS drop_in_price TEXT;
