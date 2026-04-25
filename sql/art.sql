CREATE TABLE IF NOT EXISTS art (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  buy INTEGER NOT NULL DEFAULT 0 CHECK (buy IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'public' CHECK (status IN ('draft', 'public')),
  tags TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_art_status ON art(status);
CREATE INDEX IF NOT EXISTS idx_art_buy ON art(buy);
CREATE INDEX IF NOT EXISTS idx_art_sort_order ON art(sort_order);
CREATE INDEX IF NOT EXISTS idx_art_name ON art(name);
