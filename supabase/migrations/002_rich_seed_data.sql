-- Beast Tribe — Rich Seed Data
-- Adds goal_templates table and seeds workouts, events, quests, and pack challenges

-- ============================================
-- GOAL_TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID NOT NULL REFERENCES sports(id),
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  target_unit TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  suggested_months INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Goal templates are public" ON goal_templates;
CREATE POLICY "Goal templates are public" ON goal_templates FOR SELECT USING (true);

-- ============================================
-- SEED: Goal Templates
-- ============================================

-- Running
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'Run a sub-30 min 5K', 'Build up your endurance to finish 5 km in under 30 minutes', 30, 'minutes', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'Run a sub-25 min 5K', 'Push your pace to complete 5 km in under 25 minutes', 25, 'minutes', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'Complete a 10K race', 'Train for and finish a 10 km race event', 10, 'km', 'intermediate', 5),
  ((SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'Run a half marathon', 'Prepare for and complete 21.1 km', 21.1, 'km', 'advanced', 6) ON CONFLICT DO NOTHING;

-- Gym
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'Bench press 80 kg', 'Build your chest strength to bench 80 kg for one rep', 80, 'kg', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'Bench press 100 kg', 'Reach the milestone of a 100 kg bench press', 100, 'kg', 'intermediate', 5),
  ((SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'Deadlift 150 kg', 'Develop full-body power with a 150 kg deadlift', 150, 'kg', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'Complete 100 gym sessions', 'Show up consistently and log 100 gym workouts', 100, 'sessions', 'advanced', 6) ON CONFLICT DO NOTHING;

-- Cycling
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'Complete a 25 km ride', 'Build your cycling endurance to finish a 25 km ride', 25, 'km', 'beginner', 2),
  ((SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'Complete a 50 km ride', 'Train to ride 50 km in a single session', 50, 'km', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'Average 30 km/h on a 20 km ride', 'Improve speed and power for a fast 20 km effort', 30, 'km/h', 'advanced', 5) ON CONFLICT DO NOTHING;

-- CrossFit
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'Complete 30 WODs', 'Build a solid CrossFit foundation with 30 Workouts of the Day', 30, 'WODs', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'Achieve a muscle-up', 'Master the rings or bar muscle-up skill', 1, 'rep', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'Complete a CrossFit competition', 'Sign up for and finish a local CrossFit throwdown', 1, 'event', 'advanced', 6) ON CONFLICT DO NOTHING;

-- Swimming
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'Swim 1 km non-stop', 'Build aquatic endurance to complete 1 km without stopping', 1, 'km', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'Swim 2 km in under 45 min', 'Improve technique and stamina for a fast 2 km swim', 45, 'minutes', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'Complete an open water swim event', 'Train for and finish an open water race', 1, 'event', 'advanced', 6) ON CONFLICT DO NOTHING;

-- Hyrox
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'Complete 50 Hyrox-style workouts', 'Build your hybrid fitness with 50 functional training sessions', 50, 'workouts', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'Finish a Hyrox race', 'Train for and cross the finish line at a Hyrox event', 1, 'event', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'Finish Hyrox under 90 min', 'Race-ready conditioning to break the 90-minute barrier', 90, 'minutes', 'advanced', 6) ON CONFLICT DO NOTHING;

-- Yoga
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'Practice yoga 3x/week for a month', 'Build a consistent yoga habit with three weekly sessions', 12, 'sessions', 'beginner', 1),
  ((SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'Hold a headstand for 30 seconds', 'Develop balance and upper body strength for a 30s headstand', 30, 'seconds', 'intermediate', 3),
  ((SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'Complete a 30-day yoga challenge', 'Practice every day for a full month', 30, 'days', 'beginner', 1) ON CONFLICT DO NOTHING;

-- Pilates
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'Practice Pilates 3x/week for a month', 'Establish a regular Pilates routine with three sessions per week', 12, 'sessions', 'beginner', 1),
  ((SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'Master the Pilates hundred', 'Build core endurance to perform the hundred with full control', 100, 'reps', 'intermediate', 2),
  ((SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'Complete 50 Pilates sessions', 'Commit to long-term body conditioning with 50 sessions', 50, 'sessions', 'intermediate', 4) ON CONFLICT DO NOTHING;

-- Walking
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'Walk 10K steps daily for 30 days', 'Hit 10,000 steps every day for a full month', 300000, 'steps', 'beginner', 1),
  ((SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'Walk 300 km total', 'Accumulate 300 km of walking over time', 300, 'km', 'intermediate', 3),
  ((SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'Complete a 20 km hike', 'Train your legs and endurance for a 20 km trail hike', 20, 'km', 'intermediate', 3) ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Workouts
-- ============================================

-- Running workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Easy 5K Run', 'A comfortable-pace 5K to build your aerobic base', (SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'beginner', 45, 180, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Walk at natural pace. Focus: relax shoulders, easy arm swing, let heart rate climb gradually."}, {"step": 2, "title": "Main Run (25 min)", "text": "Run at conversational pace (160-170 BPM cadence). Form: relaxed shoulders, midfoot strike, engage core lightly. Breathing: 4-count in, 3-count out. Scaling: walk-run if needed (2 min run, 1 min walk × 8). Focus: consistency over speed."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Easy walk. Stretch: quads, hamstrings, calves, hip flexors (30s each). Breathing: return to normal, deep belly breathing."}]'::jsonb),
  ('Interval Sprints', 'High-intensity interval training on the track or treadmill', (SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'intermediate', 45, 260, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Easy jog + arm circles + high knees (2 × 10). Focus: wake up nervous system, prepare for speed."}, {"step": 2, "title": "Main Set (16 min)", "text": "8 × (200m sprint + 200m walk recovery). Sprint form: drive knees, powerful arm drive, land lightly. Breathing: sharp 2-count breathing on sprints. Rest: 200m walk (complete recovery). Scaling: reduce to 6 × or use 150m sprints. Focus: acceleration and form, not just speed."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Easy jog to bring HR down. Static stretching: calves, hamstrings, quads, IT band (30-45s each)."}]'::jsonb),
  ('Tempo Run', 'Sustained effort run to improve your lactate threshold', (SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'intermediate', 55, 300, '[{"step": 1, "title": "Warm-Up (10 min)", "text": "Easy jog + dynamic stretches: leg swings (10 each), walking lunges (10 each). Form: natural posture, relaxed arms."}, {"step": 2, "title": "Main Tempo (20 min)", "text": "Comfortably hard pace (just below max sustainable speed). Form: slight forward lean, strong core, controlled arm drive. Breathing: 3-count in, 2-count out (rapid but controlled). Scaling: reduce to 15 min for beginners, or 4 × 5min with 1min easy jog between. Focus: maintain pace discipline despite fatigue."}, {"step": 3, "title": "Cool-Down (10 min)", "text": "Easy jog, then full stretching: all major leg muscles, back, chest (45s each)."}]'::jsonb),
  ('Long Slow Distance', 'Build endurance with a longer run at easy pace', (SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'advanced', 90, 420, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Walk or easy jog. Mentally prepare for long effort. Form: relaxed everything."}, {"step": 2, "title": "Main Run (50 min)", "text": "Easy conversational pace. Form: efficient, upright posture, minimal waste. Breathing: 4-count in, 4-count out (steady rhythm). Fueling: take water/electrolytes every 15 min if available. Scaling: reduce to 35-40 min for beginners. Focus: patience, steady effort, enjoy the movement. Common mistakes: starting too fast, holding tension."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Easy walk. Full-body stretch: calves, hamstrings, quads, glutes, back (45-60s each). Deep breathing to aid recovery."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Gym workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Push Day Basics', 'Chest, shoulders, and triceps for beginners', (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'beginner', 60, 250, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Light treadmill jog or arm circles + 2 sets of 5 push-ups with light weight. Prepare shoulders and chest."}, {"step": 2, "title": "Bench Press (12 min)", "text": "4 sets × 8-10 reps. Rest: 90 seconds between sets. Form: full ROM, chest to bar, shoulder blades back. Breathing: exhale on press, inhale on lower. Scaling: use dumbbells or reduce weight. Avoid: bouncing bar, uneven pressing."}, {"step": 3, "title": "Overhead Press (9 min)", "text": "3 sets × 10 reps. Rest: 75 seconds. Form: core tight, legs engaged, press straight up. Breathing: explosive exhale up. Scaling: use dumbbells or lighter weight."}, {"step": 4, "title": "Tricep Pushdowns (6 min)", "text": "3 sets × 12 reps. Rest: 60 seconds. Form: elbows locked to sides, full extension. Breathing: exhale on push. Scaling: lighter weight or resistance band."}, {"step": 5, "title": "Lateral Raises (6 min)", "text": "3 sets × 15 reps. Rest: 60 seconds. Form: slight bend in elbows, lead with elbows not hands. Breathing: exhale on raise. Focus: shoulder isolation, control on eccentric (lower)."}]'::jsonb),
  ('Pull Day Power', 'Back and biceps workout for building strength', (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'intermediate', 65, 280, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "5 min rowing machine (light). Then: band pull-aparts × 15, dead hangs × 3 × 20s. Activate back."}, {"step": 2, "title": "Deadlifts (12 min)", "text": "4 sets × 6 reps (heavy). Rest: 2-3 min between sets. Form: neutral spine, shoulders over bar, drive through heels. Breathing: big breath at top, hold during lift. Scaling: reduce reps or weight. Avoid: rounding lower back."}, {"step": 3, "title": "Pull-Ups (12 min)", "text": "4 sets to near failure. Rest: 90 seconds. Form: full ROM (dead hang to chin over bar), lats engaged. Breathing: exhale on pull. Scaling: assisted pull-ups, bands, or negatives. Focus: control, no kipping."}, {"step": 4, "title": "Barbell Rows (10 min)", "text": "3 sets × 8 reps. Rest: 90 seconds. Form: lats packed, chest to bar, neutral spine. Breathing: exhale on pull. Scaling: lighter weight if needed."}, {"step": 5, "title": "Barbell Curls (8 min)", "text": "3 sets × 10 reps. Rest: 60 seconds. Form: elbows tucked, full ROM. Breathing: exhale on curl. Avoid: swinging, using legs."}]'::jsonb),
  ('Leg Day Destroyer', 'Heavy compound leg workout', (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'advanced', 75, 360, '[{"step": 1, "title": "Warm-Up (10 min)", "text": "Bike or light jog + leg swings (20 each leg) + air squats × 15 × 2 + band pull-aparts. Prepare legs thoroughly."}, {"step": 2, "title": "Back Squats (15 min)", "text": "5 sets × 5 reps (heavy). Rest: 3 min between sets. Form: depth (parallel or below), chest up, knees tracking toes. Breathing: air at top, hold during descent, exhale coming up. Scaling: reduce weight or reps. Common mistakes: knees caving, forward lean."}, {"step": 3, "title": "Romanian Deadlifts (12 min)", "text": "4 sets × 8 reps. Rest: 90 seconds. Form: slight knee bend, hinge at hips, feel hamstring stretch. Breathing: inhale on lower, exhale on drive. Focus: posterior chain engagement."}, {"step": 4, "title": "Leg Press (8 min)", "text": "3 sets × 12 reps. Rest: 75 seconds. Form: full ROM, don''t lock knees at top. Breathing: exhale on press. Scaling: reduce depth if knee-sensitive."}, {"step": 5, "title": "Walking Lunges (6 min)", "text": "3 sets × 20 steps (10 each leg). Rest: 60 seconds. Form: vertical torso, back knee to ground, front knee over ankle. Breathing: rhythmic. Scaling: bodyweight or add light weight."}, {"step": 6, "title": "Calf Raises (6 min)", "text": "4 sets × 15 reps. Rest: 45 seconds. Form: full ROM, rise on balls of feet, squeeze at top. Breathing: exhale on rise. Focus: complete calf engagement."}]'::jsonb),
  ('Full Body Express', 'A quick full-body session for busy days', (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'all_levels', 45, 200, '[{"step": 1, "title": "Warm-Up (3 min)", "text": "Jump rope or jog in place + arm circles + 5 push-ups. Get heart rate up fast."}, {"step": 2, "title": "Goblet Squats (6 min)", "text": "3 sets × 12 reps. Rest: 60 seconds. Form: full depth, chest up, core tight. Breathing: exhale on rise. Scaling: bodyweight or lighter kettlebell. Focus: maintain quality under time pressure."}, {"step": 3, "title": "Dumbbell Bench Press (6 min)", "text": "3 sets × 10 reps. Rest: 60 seconds. Form: full ROM, chest engaged, controlled eccentric. Breathing: exhale on press. Scaling: lighter weight."}, {"step": 4, "title": "Dumbbell Rows (6 min)", "text": "3 sets × 10 per arm. Rest: 60 seconds. Form: lats engaged, row to hip, full extension. Breathing: exhale on row. Scaling: lighter weight."}, {"step": 5, "title": "Plank Hold (5 min)", "text": "3 sets × 45 seconds. Rest: 45 seconds. Form: neutral spine, core engaged, shoulders over wrists. Breathing: steady breathing, don''t hold breath. Scaling: knee plank or shorter holds. Focus: core integrity, not duration."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Cycling workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Easy Spin', 'A relaxed ride to build cycling fitness', (SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'beginner', 40, 160, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Easy pedaling, gradually increase cadence. Form: relaxed shoulders, grip light, seat position comfortable. Cadence: 90-100 RPM."}, {"step": 2, "title": "Main Ride (20 min)", "text": "Moderate pace (conversational effort). Cadence: 85-95 RPM. Form: upright posture, smooth pedal strokes. Breathing: rhythmic, controlled. Focus: relaxation and consistency. Scaling: reduce to 15 min if tired."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Very easy spin, low resistance. Breathing: return to normal. Post-ride: gentle stretching (quads, hamstrings, calves, hip flexors)."}]'::jsonb),
  ('Hill Repeats', 'Build power with repeated hill climbs', (SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'intermediate', 60, 320, '[{"step": 1, "title": "Warm-Up (10 min)", "text": "Flat ride on easy gear. Gradually increase cadence and effort. Cadence: 90 RPM easy. Form: get blood flowing, prepare muscles for power."}, {"step": 2, "title": "Hill Repeats (6 × hill)", "text": "Find a moderate hill (2-4 min climb). Seated climbs: 80-90 RPM, steady power. Out-of-saddle briefly (30s) for extra power. Breathing: controlled, rhythmic. Rest: easy descent (2-3 min) to recover. Repeat 6 times. Scaling: 4 repeats or shorter hill. Focus: power development, form maintenance under fatigue."}, {"step": 3, "title": "Cool-Down (10 min)", "text": "Easy spin on flat ground. Very low resistance. Stretching: full leg and hip stretching."}]'::jsonb),
  ('Endurance Ride', 'Long steady ride to build aerobic capacity', (SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'advanced', 90, 420, '[{"step": 1, "title": "Warm-Up (10 min)", "text": "Progressive warm-up: start easy, gradually build to zone 2 effort. Cadence: 85-95 RPM. Form: relaxed, efficient pedaling."}, {"step": 2, "title": "Main Effort (40 min)", "text": "Steady zone 2 pace (sustainable effort, can speak but not sing). Cadence: 85-90 RPM. Form: efficient, minimal waste. Nutrition: hydrate every 15 min. Breathing: steady, deep belly breathing. Scaling: reduce to 30-35 min for building base. Focus: energy conservation, enjoy pace."}, {"step": 3, "title": "Cool-Down (10 min)", "text": "Very light spin, minimal resistance. Complete full-body stretching: quads, hamstrings, glutes, back, shoulders."}]'::jsonb) ON CONFLICT DO NOTHING;

-- CrossFit workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Beast Mode WOD', 'A classic CrossFit-style AMRAP workout', (SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'intermediate', 45, 260, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Jumping jacks × 20, arm circles × 10 each direction, leg swings × 10 each leg, light jog. Get heart rate elevated."}, {"step": 2, "title": "AMRAP 15 (15 min)", "text": "As Many Rounds As Possible of: 10 burpees (form: explosive, chest to ground, full extension), 15 KB swings (form: hip drive, full swing to shoulder height), 20 box jumps (form: land softly, stick landing). Scaling: 8 burpees, 12 KB swings, 15 box jumps or use lower box. Breathing: rhythmic, reset breaths between movements. Focus: pace yourself, maintain form, push hard but sustainable."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Walk-around breathing recovery. Mobility: shoulder circles, hip circles, downward dog stretch. Hydrate well."}]'::jsonb),
  ('Functional Foundations', 'Learn the fundamentals of functional fitness', (SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'beginner', 50, 240, '[{"step": 1, "title": "Warm-Up (10 min)", "text": "2 min easy row, then dynamic stretching: arm circles, leg swings, cat-cow, inchworms. Prepare joints."}, {"step": 2, "title": "Technique Practice (15 min)", "text": "3 rounds of: Air squats × 10 (form: full depth, chest up, knees tracking toes), Push-ups × 10 (form: full ROM, chest to ground), Ring rows × 10 (form: lats engaged, full pull). Focus: perfect form over speed. Rest: 2 min between rounds."}, {"step": 3, "title": "AMRAP 10 (10 min)", "text": "As Many Rounds: 5 push-ups (focus on form), 10 air squats, 15 sit-ups. Scaling: knee push-ups, limited depth squats. Focus: consistency, build confidence."}, {"step": 4, "title": "Cool-Down (5 min)", "text": "Easy stretching: chest, shoulders, legs. Breathing recovery."}]'::jsonb),
  ('Chipper Challenge', 'A high-volume workout that tests mental grit', (SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'advanced', 65, 420, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Light jog 2 min, then dynamic warm-up: arm circles, leg swings, cat-cow, jump rope 30s. Prime nervous system."}, {"step": 2, "title": "Chipper For Time (25-35 min)", "text": "Complete all reps in order (no rounds): 50 wall balls (form: squat clean, explosive press, full extension), 40 cal row (form: drive legs first, straight arms, controlled drive), 30 toes-to-bar (form: hanging, full ROM), 20 clean & jerks 60kg (form: explosive, full ROM), 10 muscle-ups (form: transition smooth, full dip and pull). Scaling: 35 wall balls, 30 cal row, 20 toes-to-bar, 15 cleans, 5 muscle-ups or assisted. Pacing: conservative start, push mid-workout, mental toughness finish. Breathing: reset when needed. Focus: break sets strategically, avoid complete failure."}, {"step": 3, "title": "Cool-Down (10 min)", "text": "Walk to bring HR down. Foam roll: quads, lats, hamstrings. Stretch all major muscles. Hydrate and refuel."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Swimming workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Learn to Lap Swim', 'A beginner-friendly session to build pool confidence', (SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'beginner', 40, 200, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "200-300m easy freestyle. Form: relax, find rhythm, 2-beat kick. Breathing: bilateral (every 3 strokes). Focus: build confidence in water."}, {"step": 2, "title": "Main Set (16 min)", "text": "4 × 50m freestyle (30s rest between). Form: high elbow catch, rotate from hips, relaxed kick. Breathing: every 3 strokes (or breathe every 2 if needed). Scaling: take longer rest (45s) or reduce to 3 × 50m. Focus: consistency, controlled pace."}, {"step": 3, "title": "Kick Drill (6 min)", "text": "4 × 25m kick with kickboard (45s rest). Form: 2-beat kick (or 6-beat if more comfortable), drive from hips. Focus: kick propulsion."}, {"step": 4, "title": "Cool-Down (5 min)", "text": "200m easy mixed strokes (freestyle + backstroke). Breathing: relaxed, enjoy the water."}]'::jsonb),
  ('Endurance Swim', 'Build your distance swimming capacity', (SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'intermediate', 60, 290, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "200m mixed strokes (freestyle 100m, backstroke 100m). Form: warm muscles, steady rhythm."}, {"step": 2, "title": "Main Set (30 min)", "text": "6 × 100m freestyle on 2-minute intervals (rest 20s between). Form: high elbow, efficient kick, rotational breathing. Pace: steady, sustainable. Breathing: every 3 strokes (rhythmic). Scaling: 4 × 100m or 5 × 75m. Focus: build aerobic capacity, maintain technique."}, {"step": 3, "title": "Sprint Finisher (5 min)", "text": "4 × 50m sprint (20s rest). Go faster than main set. Form: still controlled, powerful kick."}, {"step": 4, "title": "Cool-Down (5 min)", "text": "200m very easy mixed strokes. Full recovery breathing."}]'::jsonb),
  ('Speed & Technique', 'Refine your stroke and build speed', (SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'advanced', 70, 380, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "300m progressive warm-up: 100m easy, 100m build, 100m steady. Form: prepare for intensity."}, {"step": 2, "title": "Drill Set (10 min)", "text": "8 × 50m technical drills: alternate catch-up drill (pause at extension, focus on catch), fingertip drag (fingers drag on recovery, high elbow). Form: deliberate, controlled. Rest: 30s between. Focus: stroke refinement."}, {"step": 3, "title": "Main Set (20 min)", "text": "6 × 100m descending (each one faster than previous). Pace: start at 75% effort, finish at 90%+. Form: maintain technique under speed. Rest: 45s between. Breathing: potentially switch to every 2 strokes on fast ones. Focus: speed development with control."}, {"step": 4, "title": "Sprint (5 min)", "text": "4 × 25m all-out sprint (60s rest). Max effort, full recovery breathing. Explosive, powerful."}, {"step": 5, "title": "Cool-Down (5 min)", "text": "200m very easy, mixed strokes. Breathing: deep, recovery."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Hyrox workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Hyrox Simulation', 'Simulate a Hyrox race with running and functional stations', (SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'intermediate', 70, 380, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Easy jog, arm circles, leg swings. Prepare body for run-station combo work."}, {"step": 2, "title": "Station Circuit (40 min)", "text": "Complete 4 rounds of: 1 km run (controlled pace, ~4:30-5:30), then immediately: Ski Erg 50 cal (form: drive legs first, extend arms, controlled slide back). Rest: 1 min between station and next run. Scaling: 800m run or 40 cal ski. Breathing: rapid transitions, controlled breathing during efforts."}, {"step": 3, "title": "Alternative: Varied Stations", "text": "Round 2: 1 km run → Sled Push 50m (form: explosive drive, low body angle). Round 3: 1 km run → Farmers Carry 50m (form: upright, tight grip, shoulders back). Round 4: 1 km run → Sled Pull 50m (form: controlled, strong pull). Focus: pacing between run and station, movement efficiency."}, {"step": 4, "title": "Cool-Down (5 min)", "text": "Easy walk, full-body stretching, deep breathing, hydration."}]'::jsonb),
  ('Hyrox Foundations', 'Build the fitness base needed for Hyrox racing', (SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'beginner', 55, 280, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Easy jog + dynamic warm-up (arm circles, leg swings)."}, {"step": 2, "title": "Main Rounds (3 rounds)", "text": "400m run (controlled pace, ~2-2:30). Form: relaxed, steady rhythm. Then immediately: 20 wall balls (form: squat clean, explosive press, full extension). Form: hip drive, complete extension. Then: 15 cal row (form: drive legs, controlled slide, pull through). Rest: 2 min between rounds. Scaling: 300m run or 15 wall balls. Focus: build hybrid fitness base, practice transitions, develop mental toughness."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Easy walk. Stretch: quads, hamstrings, glutes, shoulders. Breathing recovery."}]'::jsonb),
  ('Hyrox Race Prep', 'Advanced workout mimicking full race intensity', (SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'advanced', 90, 420, '[{"step": 1, "title": "Warm-Up (10 min)", "text": "Progressive warm-up: easy jog 3 min, build effort jog 3 min, dynamic stretches 4 min. Prepare for high intensity."}, {"step": 2, "title": "8-Round Station Circuit (40 min)", "text": "Complete: 1 km run, then rotate through stations (each ~50m or target reps). Rest 60-90s between run and station. Stations: (1) Ski Erg 50 cal, (2) Sled Push 50m, (3) Sled Pull 50m, (4) Burpee Broad Jumps 8 reps, (5) Rowing 40 cal, (6) Farmers Carry 50m, (7) Sandbag Lunges 20 steps, (8) Wall Balls 25 reps. Station form: explosive, controlled transitions, technique under fatigue. Run pace: stay consistent despite fatigue. Breathing: reset between efforts. Pacing: conservative early rounds, push final 2 rounds."}, {"step": 3, "title": "Cool-Down (10 min)", "text": "Easy jog to bring HR down 3-5 min. Full-body foam rolling and stretching. Hydrate and refuel well."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Yoga workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Morning Flow', 'A gentle vinyasa flow to start your day with energy', (SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'beginner', 35, 130, '[{"step": 1, "title": "Intention & Breathing (3 min)", "text": "Seated comfortable position (cross-legs or hero pose). Close eyes. 3-minute pranayama: inhale 4-count, hold 4-count, exhale 4-count. Set intention for day. Focus: arrive on the mat mentally."}, {"step": 2, "title": "Sun Salutation A (10 min)", "text": "5 rounds of Sun Salutation A. Form: fluid transitions, sync breath and movement. Breathing: inhale on upward movements, exhale on folds. Scaling: modify downward dog (hands wider) or skip pushup. Focus: warm body, build energy."}, {"step": 3, "title": "Standing Poses (8 min)", "text": "Balance poses: Tree pose (30s each side, form: foot high on inner thigh, hands at heart), Warrior III (30s each side, form: hinge at hip, engaged core). Breathing: steady, grounding. Scaling: hands on blocks or wall for support. Focus: balance, stability."}, {"step": 4, "title": "Stretching (2 min)", "text": "Seated forward folds (30s), gentle twists (30s each side). Form: relax, breathe into stretch. Do not force."}, {"step": 5, "title": "Savasana (2 min)", "text": "Lying on back, legs extended, arms to sides (palms up). Eyes closed. Full relaxation, deep breathing. Bring day energy down."}]'::jsonb),
  ('Power Yoga', 'A strength-focused yoga session for experienced practitioners', (SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'intermediate', 55, 230, '[{"step": 1, "title": "Pranayama (5 min)", "text": "Seated. Alternate nostril breathing: 4-count in (right), 4-count hold, 4-count out (left). Build internal heat and focus."}, {"step": 2, "title": "Sun Salutation B (12 min)", "text": "5 rounds. This is more vigorous than A (includes chair pose, warrior poses). Form: powerful, controlled transitions. Breathing: match breath to movement. Core engaged throughout. Focus: build heat, strength, stamina."}, {"step": 3, "title": "Flow Sequence (15 min)", "text": "5 breaths per pose: Chair Pose (hold 5 breaths, form: chest up, weight in heels), Warrior I (each side, form: front knee over ankle, square hips), Warrior II (each side, form: stack shoulders, active legs), Extended Side Angle (each side, form: forearm to thigh or block, extend top arm). Transitions: smooth, controlled. Breathing: full breath, steady. Scaling: modify poses with blocks. Focus: strength, alignment."}, {"step": 4, "title": "Arm Balance Practice (8 min)", "text": "Crow pose attempts: 3 sets. Form: hands shoulder-width, look forward, knees to upper arms. Don''t worry about flying. Modifications: practice on ground, build progressively. Focus: playfulness, not perfection."}, {"step": 5, "title": "Cool-Down (3 min)", "text": "Hip openers: pigeon pose each side, figure-4 stretch. Deep breathing, slow transitions to calm nervous system."}, {"step": 6, "title": "Savasana (2 min)", "text": "Full relaxation. Feel energy settled."}]'::jsonb),
  ('Stretch & Restore', 'A relaxing restorative session for recovery days', (SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'all_levels', 50, 150, '[{"step": 1, "title": "Mindful Breathing (5 min)", "text": "Seated or lying. 5 minutes deep belly breathing. 4-count in, 6-count out (extended exhale calms nervous system). Let tensions release."}, {"step": 2, "title": "Supported Child''s Pose (3 min)", "text": "Knees wide, big toes together, forehead to block or pillow. Arms extended or at sides. Let weight sink down. Breathing: slow, deep. Feel spine lengthen."}, {"step": 3, "title": "Reclined Butterfly (3 min)", "text": "Lying on back, soles of feet together, knees open. Support with pillow under back if needed. Opening for hips. Breathe into the stretch. No forcing."}, {"step": 4, "title": "Supine Twists (6 min)", "text": "Lying on back: 3 min twist right side (form: one leg crossed, shoulder to mat), 3 min twist left. Breathing: relax deeper with each exhale. Gentle rotation for spine."}, {"step": 5, "title": "Legs Up the Wall (5 min)", "text": "Lie perpendicular to wall, legs up (90° angle at hips/knees, or straight up). Calm nervous system, reduce inflammation, recovery. Close eyes, let go."}, {"step": 6, "title": "Final Relaxation (5 min)", "text": "Return to lying on back (savasana). Full body relaxation. Eyes closed. Let all effort go. Return to stillness."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Pilates workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Core Foundations', 'Essential Pilates exercises for core activation', (SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'beginner', 40, 160, '[{"step": 1, "title": "Breathing & Warm-Up (5 min)", "text": "Lying on back, knees bent. Pelvic floor breathing: 4-count inhale, engage core, 4-count exhale. Articulating bridge: roll spine up and down slowly (5 reps). Prepare core."}, {"step": 2, "title": "The Hundred (5 min)", "text": "5 sets of 10 breaths (total ~50 pulses). Form: head/shoulders lifted, imprinted spine, legs tabletop or extended (modify as needed). Arms pulse. Breathing: inhale 5 pulses, exhale 5 pulses. Focus: core engagement throughout. Scaling: lower legs or keep knees bent."}, {"step": 3, "title": "Single Leg Stretch (4 min)", "text": "10 reps each side. Form: head lifted, one leg extended, opposite knee to chest. Alternate. Breathing: exhale on pull. Core tight. Scaling: head down, smaller movements."}, {"step": 4, "title": "Roll-Ups (3 min)", "text": "8 reps. Form: sit, slowly roll spine down one vertebra at a time, reach toward toes, reverse. Breathing: exhale down, inhale up. Articulate. Scaling: bend knees or hold behind legs for support."}, {"step": 5, "title": "Side-Lying Leg Series (8 min)", "text": "Each side: 10 reps front leg (lift forward), 10 reps side leg (lift up), 10 reps back leg (lift behind). Form: stack hips, core engaged, controlled. Breathing: exhale on lift. Focus: lean stabilization, glute/hip strength."}, {"step": 6, "title": "Cool-Down Stretch (5 min)", "text": "Full-body stretching: spine twist, hip opener, quad stretch."}]'::jsonb),
  ('Pilates Sculpt', 'Intermediate full-body Pilates session', (SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'intermediate', 55, 250, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Articulating bridge (8 reps): slow, controlled spine articulation. Cat-cow (8 reps): flowing movement, breathe into stretches. Wake up nervous system."}, {"step": 2, "title": "The Hundred (5 min)", "text": "Full version: head/shoulders lifted, legs extended long, arms pulsing. Form: imprinted spine, core tight. 100 total pulses (10 pulses per 5 breaths, 10 sets). Focus: sustained core engagement. Breathing: rhythmic, controlled."}, {"step": 3, "title": "Double Leg Stretch (3 min)", "text": "10 reps. Form: both legs extended, pull knees to chest, hug, extend back. Head lifted. Breathing: exhale on pull. Scaling: keep feet on ground for support."}, {"step": 4, "title": "Swan Dive (3 min)", "text": "8 reps. Form: prone, hands by chest, press chest up (gentle backbend), fold forward. Breathing: inhale on press, exhale on fold. Mobility work for spine."}, {"step": 5, "title": "Side Plank (4 min)", "text": "Each side: 30 seconds. Form: stack hips, shoulders over wrist, core engaged. Strong line. Breathing: steady. Scaling: knee down or elbow plank."}, {"step": 6, "title": "Teaser (4 min)", "text": "5 reps. Form: lying, legs extended, roll spine up while lifting legs (V-shape), control back down. Advanced! Breathing: exhale on roll up. Scaling: bend knees or do partial version."}, {"step": 7, "title": "Cool-Down Stretch (5 min)", "text": "Full-body stretching, breathing, relaxation."}]'::jsonb),
  ('Mat Power Hour', 'Challenging mat Pilates for advanced practitioners', (SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'advanced', 70, 360, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Progressive warm-up: breathing (2 min) → articulating bridge (3 min). Build awareness and movement flow."}, {"step": 2, "title": "Classical Sequence Part 1 (15 min)", "text": "The Hundred (100 pulses, 2 min). Roll-up (8 reps, 2 min): full spine articulation. Rollover (5 reps, 2 min): advanced spinal flexion/extension. Leg Circles (8 reps each leg, 2 min): controlled, core stabilized. Focus: precision, control, breathing sync."}, {"step": 3, "title": "Classical Sequence Part 2 (15 min)", "text": "Spine Stretch Forward (8 reps, 2 min): articulate spine, reach. Open Leg Rocker (5 reps, 2 min): balance, spinal articulation, challenging! Corkscrew (5 reps, 2 min): complex spinal rotation. Swimming (10 reps each arm, 2 min): core stability, arm/leg opposition. Leg Pull Front (5 reps each side, 2 min): plank + leg lift, advanced. Leg Pull Back (5 reps each side, 2 min): prone leg pulls."}, {"step": 4, "title": "Advanced Finisher (10 min)", "text": "Control Balance (5 reps each side, 3 min): sitting balance pose, challenging! Push-up Series (5 reps, 3 min): move from lie down to push-up, return. Advanced! Full integration, breath and movement. Scaling: modify as needed."}, {"step": 5, "title": "Cool-Down (5 min)", "text": "Stretch and relaxation. Full-body appreciation."}]'::jsonb) ON CONFLICT DO NOTHING;

-- Walking workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Brisk Walk 30', 'A steady 30-minute brisk walk to stay active', (SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'beginner', 40, 130, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Easy-paced walk. Form: head neutral, shoulders relaxed, natural arm swing. Let body warm up gradually."}, {"step": 2, "title": "Main Brisk Walk (20 min)", "text": "Brisk pace: can talk but not sing (conversational threshold). Form: upright posture, strong core, arms swing naturally 90°. Cadence: 110-120 steps/min. Breathing: rhythmic, 2-3 steps per breath. Focus: steady, sustainable pace. No strain. Scaling: reduce to 15 min if needed."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Gentle pace back to resting HR. Stretching: calf raises (hold 20s each leg), hamstring stretch, quad stretch (30s each). Deep breathing."}]'::jsonb),
  ('Incline Power Walk', 'Use hills or treadmill incline for extra challenge', (SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'intermediate', 50, 210, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Flat, easy-paced walk. Prepare legs for incline work."}, {"step": 2, "title": "Incline Intervals (30 min)", "text": "Repeat 5 times: 3 min steep incline (10-15% grade, brisk pace), 2 min flat easy recovery. Form on incline: lean slightly forward from ankles, powerful glute drive, controlled breathing. Breathing: slightly faster than flat. Form on flat: recover, easy pace. Focus: glute and quad strength. Scaling: reduce incline to 8% or reduce work time to 2 min. Common mistakes: holding onto treadmill (reduces effectiveness)."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Flat, gentle walk to bring HR down. Full-leg stretching, focus on glutes and calves (30-45s each)."}]'::jsonb),
  ('Exploration Walk', 'A longer walk to explore your neighbourhood or a new area', (SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'all_levels', 75, 230, '[{"step": 1, "title": "Warm-Up (5 min)", "text": "Easy-paced walk around home/start point. Wake up body, settle mind. Prepare for longer effort."}, {"step": 2, "title": "Main Exploration (50 min)", "text": "Comfortable pace — not racing, enjoying the movement. Form: relaxed posture, natural gait, look around (be present!). Cadence: 100-110 steps/min. Breathing: natural, conversational. Hydration: sip water if carrying bottle. Mental: use time for thinking, meditation, or socializing. Route: explore new neighborhoods, parks, or trails. Scaling: reduce to 40 min if building endurance. Focus: joy, discovery, mental health benefit."}, {"step": 3, "title": "Cool-Down (5 min)", "text": "Slow walk, return to starting point. Light stretching of legs, back, shoulders. Deep breathing."}]'::jsonb) ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Events (June–August 2026, Riyadh & Jeddah)
-- ============================================
INSERT INTO events (title, description, event_type, sport_id, location_name, location_city, starts_at, ends_at, max_capacity, coach_name, gym_name, is_women_only) VALUES
  (
    'Beast Tribe Community Run',
    'Join fellow tribe members for an early morning 5K around King Fahd Park. All paces welcome.',
    'community_run',
    (SELECT id FROM sports WHERE name = 'Running' LIMIT 1),
    'King Fahd Park',
    'Riyadh',
    '2026-06-05 06:00:00+03',
    '2026-06-05 08:00:00+03',
    200,
    'Coach Ali',
    NULL,
    FALSE
  ),
  (
    'Friday Night Run — Riyadh Boulevard',
    'A social 3K fun run through the illuminated Boulevard district followed by refreshments.',
    'community_run',
    (SELECT id FROM sports WHERE name = 'Running' LIMIT 1),
    'Riyadh Boulevard',
    'Riyadh',
    '2026-06-12 21:00:00+03',
    '2026-06-12 23:00:00+03',
    150,
    'Coach Faisal',
    NULL,
    FALSE
  ),
  (
    'Women''s Strength Workshop',
    'An empowering strength training workshop focused on barbell fundamentals for women.',
    'workshop',
    (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1),
    'Leejam Fitness — Al Olaya',
    'Riyadh',
    '2026-06-20 17:00:00+03',
    '2026-06-20 19:00:00+03',
    30,
    'Coach Sara',
    'Leejam Fitness',
    TRUE
  ),
  (
    'CrossFit Throwdown',
    'A friendly in-house CrossFit competition. Scaled and Rx divisions available.',
    'competition',
    (SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1),
    'Fitness Time — Al Hamra',
    'Jeddah',
    '2026-07-03 07:00:00+03',
    '2026-07-03 12:00:00+03',
    60,
    'Coach Ali',
    'Fitness Time',
    FALSE
  ),
  (
    'Sunrise Yoga by the Sea',
    'A calming outdoor yoga session on the Jeddah Corniche at sunrise.',
    'class',
    (SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1),
    'Jeddah Corniche',
    'Jeddah',
    '2026-07-10 05:30:00+03',
    '2026-07-10 07:00:00+03',
    40,
    'Coach Nora',
    NULL,
    FALSE
  ),
  (
    'Ladies Swim Hour',
    'A women-only coached swimming session to improve technique and endurance.',
    'class',
    (SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1),
    'Gold''s Gym — Al Rawdah',
    'Jeddah',
    '2026-07-17 18:00:00+03',
    '2026-07-17 19:30:00+03',
    20,
    'Coach Sara',
    'Gold''s Gym',
    TRUE
  ),
  (
    'Riyadh Cycling Group Ride',
    'A 40 km group ride along the Wadi Hanifah route. Intermediate pace.',
    'group_ride',
    (SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1),
    'Wadi Hanifah — South Entrance',
    'Riyadh',
    '2026-07-24 05:00:00+03',
    '2026-07-24 08:00:00+03',
    80,
    'Coach Faisal',
    NULL,
    FALSE
  ),
  (
    'Hyrox Training Camp',
    'A two-day Hyrox prep camp covering all eight race stations and running strategy.',
    'workshop',
    (SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1),
    'Fitness Time — King Abdullah Rd',
    'Riyadh',
    '2026-08-07 06:00:00+03',
    '2026-08-08 12:00:00+03',
    50,
    'Coach Ali',
    'Fitness Time',
    FALSE
  ),
  (
    'Women''s Pilates in the Park',
    'A serene outdoor Pilates class for all levels at King Abdullah Park.',
    'class',
    (SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1),
    'King Abdullah Park',
    'Riyadh',
    '2026-08-14 06:00:00+03',
    '2026-08-14 07:30:00+03',
    35,
    'Coach Nora',
    NULL,
    TRUE
  ),
  (
    'Beast Tribe Summer 10K',
    'The signature Beast Tribe 10K race through Riyadh. Timed event with prizes for top finishers.',
    'competition',
    (SELECT id FROM sports WHERE name = 'Running' LIMIT 1),
    'King Fahd Stadium',
    'Riyadh',
    '2026-08-28 05:30:00+03',
    '2026-08-28 09:00:00+03',
    500,
    'Coach Ali',
    NULL,
    FALSE
  ) ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Additional Quests (sport-specific)
-- ============================================
INSERT INTO quests (title, description, sport_id, quest_type, xp_reward) VALUES
  -- Running
  ('Run 5K today', 'Complete a 5K run at any pace', (SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'daily', 180),
  ('Log 3 runs this week', 'Complete three running workouts this week', (SELECT id FROM sports WHERE name = 'Running' LIMIT 1), 'weekly', 400),

  -- Gym
  ('Lift for 45 minutes', 'Complete a 45-minute strength training session', (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'daily', 170),
  ('Hit the gym 4 times this week', 'Log four gym workouts this week', (SELECT id FROM sports WHERE name = 'Gym' LIMIT 1), 'weekly', 450),

  -- Cycling
  ('Ride 10 km today', 'Complete a 10 km cycling ride', (SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'daily', 160),
  ('Cycle 50 km this week', 'Accumulate 50 km of riding this week', (SELECT id FROM sports WHERE name = 'Cycling' LIMIT 1), 'weekly', 420),

  -- CrossFit
  ('Crush a WOD', 'Complete any Workout of the Day', (SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'daily', 190),
  ('3 WODs this week', 'Complete three CrossFit workouts this week', (SELECT id FROM sports WHERE name = 'CrossFit' LIMIT 1), 'weekly', 430),

  -- Swimming
  ('Swim 500m today', 'Complete a 500m swim session', (SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'daily', 150),
  ('Swim 3 times this week', 'Log three swim sessions this week', (SELECT id FROM sports WHERE name = 'Swimming' LIMIT 1), 'weekly', 380),

  -- Hyrox
  ('Complete a Hyrox-style workout', 'Finish a functional fitness workout combining running and stations', (SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'daily', 200),
  ('Train Hyrox 3 times this week', 'Complete three Hyrox preparation workouts', (SELECT id FROM sports WHERE name = 'Hyrox' LIMIT 1), 'weekly', 450),

  -- Yoga
  ('Flow for 20 minutes', 'Complete a 20-minute yoga session', (SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'daily', 100),
  ('Practice yoga 3 times this week', 'Hit the mat three times this week', (SELECT id FROM sports WHERE name = 'Yoga' LIMIT 1), 'weekly', 300),

  -- Pilates
  ('Do a Pilates session', 'Complete any Pilates workout', (SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'daily', 110),
  ('3 Pilates sessions this week', 'Complete three Pilates workouts this week', (SELECT id FROM sports WHERE name = 'Pilates' LIMIT 1), 'weekly', 320),

  -- Walking
  ('Walk 8K steps today', 'Hit at least 8,000 steps', (SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'daily', 100),
  ('Walk 50K steps this week', 'Accumulate 50,000 steps over the week', (SELECT id FROM sports WHERE name = 'Walking' LIMIT 1), 'weekly', 350) ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Pack Challenge
-- ============================================
INSERT INTO pack_challenges (pack_a_id, pack_b_id, title, pack_a_xp, pack_b_xp, starts_at, ends_at) VALUES
  (
    (SELECT id FROM packs WHERE name = 'Wolf Pack' LIMIT 1),
    (SELECT id FROM packs WHERE name = 'Tiger Squad' LIMIT 1),
    'Summer Showdown',
    12400,
    9800,
    NOW() - INTERVAL '4 days',
    NOW() + INTERVAL '3 days'
  ) ON CONFLICT DO NOTHING;
