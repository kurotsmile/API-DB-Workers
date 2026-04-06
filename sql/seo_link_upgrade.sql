ALTER TABLE seo_link ADD COLUMN status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'awaiting_confirmation'));
UPDATE seo_link SET status = 'live' WHERE status IS NULL OR TRIM(status) = '';
CREATE INDEX IF NOT EXISTS idx_seo_link_status ON seo_link(status);
