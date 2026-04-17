-- ============================================
-- 019: Coach Workout Programming
-- Coaches create workout templates and assign to trainees
-- ============================================

-- Workout programs (templates created by coaches)
CREATE TABLE IF NOT EXISTS workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER,
  exercises JSONB, -- [{name, sets, reps, weight, rest, notes}]
  image_url TEXT,
  is_template BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false, -- visible to community
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assigned programs (coach assigns program to trainee)
CREATE TABLE IF NOT EXISTS program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES workout_programs(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(program_id, trainee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_programs_coach ON workout_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_public ON workout_programs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_program_assignments_trainee ON program_assignments(trainee_id);

-- RLS
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY wp_read ON workout_programs FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY wp_insert ON workout_programs FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY wp_update ON workout_programs FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY wp_delete ON workout_programs FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY pa_read ON program_assignments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY pa_insert ON program_assignments FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Workout programming system created!' as status;
