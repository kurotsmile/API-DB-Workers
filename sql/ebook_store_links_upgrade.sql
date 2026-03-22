ALTER TABLE ebook_store_links ADD COLUMN store_name TEXT DEFAULT '';
ALTER TABLE ebook_store_links ADD COLUMN store_icon TEXT DEFAULT '';
ALTER TABLE ebook_store_links ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE ebook_store_links
SET store_name = CASE
    WHEN store_name IS NOT NULL AND TRIM(store_name) <> '' THEN store_name
    WHEN store_id = 'gumroad' THEN 'Gumroad'
    WHEN store_id = 'payhip' THEN 'Payhip'
    WHEN store_id = 'ko-fi' THEN 'Ko-fi'
    WHEN store_id IS NOT NULL AND TRIM(store_id) <> '' THEN store_id
    ELSE 'Store'
END;

UPDATE ebook_store_links
SET store_icon = CASE
    WHEN store_icon IS NOT NULL AND TRIM(store_icon) <> '' THEN store_icon
    WHEN store_id = 'gumroad' THEN 'fa-brands fa-gumroad'
    WHEN store_id = 'payhip' THEN 'fa-solid fa-credit-card'
    WHEN store_id = 'ko-fi' THEN 'fa-solid fa-mug-hot'
    ELSE ''
END;

CREATE INDEX IF NOT EXISTS idx_ebook_store_links_sort_order ON ebook_store_links(sort_order);
