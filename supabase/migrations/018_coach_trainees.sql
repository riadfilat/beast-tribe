-- ============================================
-- 018: Coach-Trainee Performance Tracking
-- Body metrics, coach notes, privacy controls
-- Works for both coaches and gyms
-- ============================================

-- Coach-trainee relationships
CREATE TABLE IF NOT EXISTS coach_trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending','active','paused','completed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  goals TEXT,
  notes TEXT,
  UNIQUE(coach_id, trainee_id)
);

-- Body metrics tracking (weight, BMI, measurements, progress photos)
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES profiles(id),
  weight_kg NUMERIC(5,1),
  height_cm NUMERIC(5,1),
  body_fat_pct NUMERIC(4,1),
  bmi NUMERIC(4,1),
  waist_cm NUMERIC(5,1),
  chest_cm NUMERIC(5,1),
  hips_cm NUMERIC(5,1),
  bicep_cm NUMERIC(4,1),
  thigh_cm NUMERIC(5,1),
  calf_cm NUMERIC(4,1),
  neck_cm NUMERIC(4,1),
  notes TEXT,
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Coach notes/feedback on trainees
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_type TEXT DEFAULT 'feedback' CHECK (note_type IN ('feedback','goal','milestone','warning','program')),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Privacy controls — what trainees share with each coach
CREATE TABLE IF NOT EXISTS trainee_privacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  share_workouts BOOLEAN DEFAULT true,
  share_nutrition BOOLEAN DEFAULT true,
  share_habits BOOLEAN DEFAULT true,
  share_body_metrics BOOLEAN DEFAULT true,
  share_photos BOOLEAN DEFAULT false,
  share_on_feed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trainee_id, coach_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coach_trainees_coach ON coach_trainees(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_trainees_trainee ON coach_trainees(trainee_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user ON body_metrics(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_notes_trainee ON coach_notes(trainee_id, created_at DESC);

-- RLS
ALTER TABLE coach_trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainee_privacy ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN CREATE POLICY coach_trainees_read ON coach_trainees FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_trainees_insert ON coach_trainees FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_trainees_update ON coach_trainees FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY body_metrics_own ON body_metrics FOR ALL USING (user_id = auth.uid() OR recorded_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY body_metrics_coach ON body_metrics FOR SELECT USING (
  user_id IN (SELECT trainee_id FROM coach_trainees ct JOIN partners p ON ct.coach_id = p.id WHERE p.user_id = auth.uid())
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY coach_notes_read ON coach_notes FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY coach_notes_insert ON coach_notes FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY trainee_privacy_own ON trainee_privacy FOR ALL USING (trainee_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY trainee_privacy_coach ON trainee_privacy FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Coach-trainee system created!' as status;
