-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'waiting',
  grid_size INTEGER NOT NULL DEFAULT 10,
  player1_pk TEXT NOT NULL,
  player2_pk TEXT,
  winner_pk TEXT,
  reason TEXT,
  turn_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Attacks table
CREATE TABLE attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  attacker_pk TEXT NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  result TEXT,
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attacks_match ON attacks(match_id);

-- Proof logs table
CREATE TABLE proof_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  player_pk TEXT NOT NULL,
  circuit TEXT NOT NULL,
  proof_size_bytes INTEGER,
  generation_time_ms REAL,
  verification_time_ms REAL,
  valid BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proof_logs_match ON proof_logs(match_id);
CREATE INDEX idx_proof_logs_player ON proof_logs(player_pk);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_pk TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  amount_xlm NUMERIC(18,7) NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_player ON payments(player_pk);

-- Player stats table
CREATE TABLE player_stats (
  player_pk TEXT PRIMARY KEY,
  display_name TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Recruit',
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
