-- 063 Stable keys for Operation Beast library workouts (scripts/library), so re-running the build
-- updates each workout in place: saves, logs and plans keep pointing at the same row.
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS library_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_library_key ON workouts (library_key) WHERE library_key IS NOT NULL;
