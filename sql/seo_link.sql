CREATE TABLE IF NOT EXISTS seo_link (
    url TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'awaiting_confirmation')),
    checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seo_link_status ON seo_link(status);
