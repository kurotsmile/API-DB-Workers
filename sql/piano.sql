CREATE TABLE IF NOT EXISTS midis (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  speed REAL NOT NULL DEFAULT 0.2,
  data_index TEXT NOT NULL,
  data_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline'
    CHECK (status IN ('offline', 'pending', 'public')),
  date TEXT NOT NULL,
  author TEXT,
  category TEXT,
  buy INTEGER NOT NULL DEFAULT 0 CHECK (buy IN (0, 1)),
  user_id TEXT,
  user_lang TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_midis_status ON midis(status);
CREATE INDEX IF NOT EXISTS idx_midis_category ON midis(category);
CREATE INDEX IF NOT EXISTS idx_midis_user_id ON midis(user_id);
CREATE INDEX IF NOT EXISTS idx_midis_name ON midis(name);

CREATE TABLE IF NOT EXISTS midi_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
