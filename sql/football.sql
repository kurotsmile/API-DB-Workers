CREATE TABLE IF NOT EXISTS football (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tip TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  ball_force INTEGER NOT NULL DEFAULT 0,
  ball_control INTEGER NOT NULL DEFAULT 0,
  ball_cutting INTEGER NOT NULL DEFAULT 0,
  playing_position INTEGER NOT NULL DEFAULT 0 CHECK (playing_position IN (0, 1, 2, 3)),
  buy INTEGER NOT NULL DEFAULT 0 CHECK (buy IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'public' CHECK (status IN ('draft', 'public')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  sync_status INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_football_name ON football(name);
CREATE INDEX IF NOT EXISTS idx_football_playing_position ON football(playing_position);
CREATE INDEX IF NOT EXISTS idx_football_buy ON football(buy);
CREATE INDEX IF NOT EXISTS idx_football_status ON football(status);
CREATE INDEX IF NOT EXISTS idx_football_sort_order ON football(sort_order);
