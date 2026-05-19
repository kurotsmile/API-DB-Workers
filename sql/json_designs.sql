CREATE TABLE IF NOT EXISTS json_designs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  describe TEXT DEFAULT '',
  code TEXT NOT NULL,
  code_type TEXT NOT NULL DEFAULT 'json',
  code_theme TEXT NOT NULL DEFAULT 'docco.min.css',
  user_id TEXT DEFAULT '',
  user_lang TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'public', 'private', 'blocked')),
  view_count INTEGER NOT NULL DEFAULT 0,
  date TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_json_designs_status ON json_designs(status);
CREATE INDEX IF NOT EXISTS idx_json_designs_user_id ON json_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_json_designs_user_lang ON json_designs(user_lang);
CREATE INDEX IF NOT EXISTS idx_json_designs_name ON json_designs(name);
CREATE INDEX IF NOT EXISTS idx_json_designs_updated_at ON json_designs(updated_at);
