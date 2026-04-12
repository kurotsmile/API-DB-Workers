ALTER TABLE app_Sheep_Gone ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

WITH ordered_levels AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE
          WHEN id GLOB 'L[0-9]*' THEN CAST(SUBSTR(id, 2) AS INTEGER)
          ELSE NULL
        END,
        created_at,
        id
    ) AS next_sort_order
  FROM app_Sheep_Gone
)
UPDATE app_Sheep_Gone
SET sort_order = (
  SELECT next_sort_order
  FROM ordered_levels
  WHERE ordered_levels.id = app_Sheep_Gone.id
)
WHERE sort_order = 0;

CREATE INDEX IF NOT EXISTS idx_app_Sheep_Gone_sort_order ON app_Sheep_Gone(sort_order);
