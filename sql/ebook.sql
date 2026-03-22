CREATE TABLE IF NOT EXISTS ebook_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ebook (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  author TEXT DEFAULT '',
  category_id TEXT DEFAULT NULL,
  lang TEXT DEFAULT 'en',
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_free INTEGER NOT NULL DEFAULT 0 CHECK (is_free IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'public')),
  cover TEXT DEFAULT '',
  preview_file TEXT DEFAULT '',
  description TEXT DEFAULT '',
  published_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES ebook_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ebook_store_links (
  id TEXT PRIMARY KEY,
  ebook_id TEXT NOT NULL,
  store_id TEXT DEFAULT '',
  store_name TEXT NOT NULL,
  store_icon TEXT DEFAULT '',
  url TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ebook_id) REFERENCES ebook(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ebook_status ON ebook(status);
CREATE INDEX IF NOT EXISTS idx_ebook_category_id ON ebook(category_id);
CREATE INDEX IF NOT EXISTS idx_ebook_name ON ebook(name);
CREATE INDEX IF NOT EXISTS idx_ebook_author ON ebook(author);
CREATE INDEX IF NOT EXISTS idx_ebook_updated_at ON ebook(updated_at);

CREATE INDEX IF NOT EXISTS idx_ebook_store_links_ebook_id ON ebook_store_links(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_store_links_store_id ON ebook_store_links(store_id);
CREATE INDEX IF NOT EXISTS idx_ebook_store_links_sort_order ON ebook_store_links(sort_order);
