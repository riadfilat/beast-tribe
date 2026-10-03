-- 062 Animated demonstrations for exercises.
-- demo_id is ExerciseDB's id for the matching exercise. Only the reference is kept here: ExerciseDB's
-- terms do not allow storing their media, so the app loads the animation from ExerciseDB each time.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS demo_id TEXT CHECK (demo_id IS NULL OR demo_id ~ '^[A-Za-z0-9]{4,16}$');
