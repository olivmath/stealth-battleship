CREATE TABLE pending_payments (
  memo TEXT PRIMARY KEY,
  player_pk TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_pending_payments_player ON pending_payments(player_pk);
CREATE INDEX idx_pending_payments_status ON pending_payments(status);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS battle_token_tx_hash TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS memo TEXT;
ALTER TABLE attacks ADD COLUMN IF NOT EXISTS proof BYTEA;
