-- Beast Tribe — Rich Seed Data
-- Adds goal_templates table and seeds workouts, events, quests, and pack challenges

-- ============================================
-- GOAL_TEMPLATES
-- ============================================
CREATE TABLE goal_templates (
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
CREATE POLICY "Goal templates are public" ON goal_templates FOR SELECT USING (true);

-- ============================================
-- SEED: Goal Templates
-- ============================================

-- Running
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Running'), 'Run a sub-30 min 5K', 'Build up your endurance to finish 5 km in under 30 minutes', 30, 'minutes', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Running'), 'Run a sub-25 min 5K', 'Push your pace to complete 5 km in under 25 minutes', 25, 'minutes', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Running'), 'Complete a 10K race', 'Train for and finish a 10 km race event', 10, 'km', 'intermediate', 5),
  ((SELECT id FROM sports WHERE name = 'Running'), 'Run a half marathon', 'Prepare for and complete 21.1 km', 21.1, 'km', 'advanced', 6);

-- Gym
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Gym'), 'Bench press 80 kg', 'Build your chest strength to bench 80 kg for one rep', 80, 'kg', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Gym'), 'Bench press 100 kg', 'Reach the milestone of a 100 kg bench press', 100, 'kg', 'intermediate', 5),
  ((SELECT id FROM sports WHERE name = 'Gym'), 'Deadlift 150 kg', 'Develop full-body power with a 150 kg deadlift', 150, 'kg', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Gym'), 'Complete 100 gym sessions', 'Show up consistently and log 100 gym workouts', 100, 'sessions', 'advanced', 6);

-- Cycling
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Cycling'), 'Complete a 25 km ride', 'Build your cycling endurance to finish a 25 km ride', 25, 'km', 'beginner', 2),
  ((SELECT id FROM sports WHERE name = 'Cycling'), 'Complete a 50 km ride', 'Train to ride 50 km in a single session', 50, 'km', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Cycling'), 'Average 30 km/h on a 20 km ride', 'Improve speed and power for a fast 20 km effort', 30, 'km/h', 'advanced', 5);

-- CrossFit
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'CrossFit'), 'Complete 30 WODs', 'Build a solid CrossFit foundation with 30 Workouts of the Day', 30, 'WODs', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'CrossFit'), 'Achieve a muscle-up', 'Master the rings or bar muscle-up skill', 1, 'rep', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'CrossFit'), 'Complete a CrossFit competition', 'Sign up for and finish a local CrossFit throwdown', 1, 'event', 'advanced', 6);

-- Swimming
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Swimming'), 'Swim 1 km non-stop', 'Build aquatic endurance to complete 1 km without stopping', 1, 'km', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Swimming'), 'Swim 2 km in under 45 min', 'Improve technique and stamina for a fast 2 km swim', 45, 'minutes', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Swimming'), 'Complete an open water swim event', 'Train for and finish an open water race', 1, 'event', 'advanced', 6);

-- Hyrox
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Hyrox'), 'Complete 50 Hyrox-style workouts', 'Build your hybrid fitness with 50 functional training sessions', 50, 'workouts', 'beginner', 3),
  ((SELECT id FROM sports WHERE name = 'Hyrox'), 'Finish a Hyrox race', 'Train for and cross the finish line at a Hyrox event', 1, 'event', 'intermediate', 4),
  ((SELECT id FROM sports WHERE name = 'Hyrox'), 'Finish Hyrox under 90 min', 'Race-ready conditioning to break the 90-minute barrier', 90, 'minutes', 'advanced', 6);

-- Yoga
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Yoga'), 'Practice yoga 3x/week for a month', 'Build a consistent yoga habit with three weekly sessions', 12, 'sessions', 'beginner', 1),
  ((SELECT id FROM sports WHERE name = 'Yoga'), 'Hold a headstand for 30 seconds', 'Develop balance and upper body strength for a 30s headstand', 30, 'seconds', 'intermediate', 3),
  ((SELECT id FROM sports WHERE name = 'Yoga'), 'Complete a 30-day yoga challenge', 'Practice every day for a full month', 30, 'days', 'beginner', 1);

-- Pilates
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Pilates'), 'Practice Pilates 3x/week for a month', 'Establish a regular Pilates routine with three sessions per week', 12, 'sessions', 'beginner', 1),
  ((SELECT id FROM sports WHERE name = 'Pilates'), 'Master the Pilates hundred', 'Build core endurance to perform the hundred with full control', 100, 'reps', 'intermediate', 2),
  ((SELECT id FROM sports WHERE name = 'Pilates'), 'Complete 50 Pilates sessions', 'Commit to long-term body conditioning with 50 sessions', 50, 'sessions', 'intermediate', 4);

-- Walking
INSERT INTO goal_templates (sport_id, title, description, target_value, target_unit, difficulty, suggested_months) VALUES
  ((SELECT id FROM sports WHERE name = 'Walking'), 'Walk 10K steps daily for 30 days', 'Hit 10,000 steps every day for a full month', 300000, 'steps', 'beginner', 1),
  ((SELECT id FROM sports WHERE name = 'Walking'), 'Walk 300 km total', 'Accumulate 300 km of walking over time', 300, 'km', 'intermediate', 3),
  ((SELECT id FROM sports WHERE name = 'Walking'), 'Complete a 20 km hike', 'Train your legs and endurance for a 20 km trail hike', 20, 'km', 'intermediate', 3);

-- ============================================
-- SEED: Workouts
-- ============================================

-- Running workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Easy 5K Run', 'A comfortable-pace 5K to build your aerobic base', (SELECT id FROM sports WHERE name = 'Running'), 'beginner', 35, 150, '[{"step": 1, "text": "5-minute walk warm-up"}, {"step": 2, "text": "Run at a conversational pace for 25 minutes"}, {"step": 3, "text": "5-minute cool-down walk and stretch"}]'::jsonb),
  ('Interval Sprints', 'High-intensity interval training on the track or treadmill', (SELECT id FROM sports WHERE name = 'Running'), 'intermediate', 30, 200, '[{"step": 1, "text": "5-minute jog warm-up"}, {"step": 2, "text": "Sprint 200m, walk 200m — repeat 8 times"}, {"step": 3, "text": "5-minute jog cool-down"}, {"step": 4, "text": "Static stretching for 5 minutes"}]'::jsonb),
  ('Tempo Run', 'Sustained effort run to improve your lactate threshold', (SELECT id FROM sports WHERE name = 'Running'), 'intermediate', 40, 220, '[{"step": 1, "text": "10-minute easy jog warm-up"}, {"step": 2, "text": "Run at tempo pace (comfortably hard) for 20 minutes"}, {"step": 3, "text": "10-minute easy jog cool-down"}]'::jsonb),
  ('Long Slow Distance', 'Build endurance with a longer run at easy pace', (SELECT id FROM sports WHERE name = 'Running'), 'advanced', 60, 300, '[{"step": 1, "text": "5-minute walk warm-up"}, {"step": 2, "text": "Run at easy pace for 50 minutes — focus on steady breathing"}, {"step": 3, "text": "5-minute cool-down walk and full-body stretch"}]'::jsonb);

-- Gym workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Push Day Basics', 'Chest, shoulders, and triceps for beginners', (SELECT id FROM sports WHERE name = 'Gym'), 'beginner', 45, 180, '[{"step": 1, "text": "5-minute treadmill warm-up"}, {"step": 2, "text": "Bench press — 4 sets of 8-10 reps"}, {"step": 3, "text": "Overhead press — 3 sets of 10 reps"}, {"step": 4, "text": "Tricep pushdowns — 3 sets of 12 reps"}, {"step": 5, "text": "Lateral raises — 3 sets of 15 reps"}]'::jsonb),
  ('Pull Day Power', 'Back and biceps workout for building strength', (SELECT id FROM sports WHERE name = 'Gym'), 'intermediate', 50, 200, '[{"step": 1, "text": "5-minute rowing machine warm-up"}, {"step": 2, "text": "Deadlifts — 4 sets of 6 reps"}, {"step": 3, "text": "Pull-ups — 4 sets to near failure"}, {"step": 4, "text": "Barbell rows — 3 sets of 8 reps"}, {"step": 5, "text": "Barbell curls — 3 sets of 10 reps"}]'::jsonb),
  ('Leg Day Destroyer', 'Heavy compound leg workout', (SELECT id FROM sports WHERE name = 'Gym'), 'advanced', 55, 250, '[{"step": 1, "text": "10-minute bike warm-up"}, {"step": 2, "text": "Back squats — 5 sets of 5 reps (heavy)"}, {"step": 3, "text": "Romanian deadlifts — 4 sets of 8 reps"}, {"step": 4, "text": "Leg press — 3 sets of 12 reps"}, {"step": 5, "text": "Walking lunges — 3 sets of 20 steps"}, {"step": 6, "text": "Calf raises — 4 sets of 15 reps"}]'::jsonb),
  ('Full Body Express', 'A quick full-body session for busy days', (SELECT id FROM sports WHERE name = 'Gym'), 'all_levels', 30, 150, '[{"step": 1, "text": "3-minute jump rope warm-up"}, {"step": 2, "text": "Goblet squats — 3 sets of 12 reps"}, {"step": 3, "text": "Dumbbell bench press — 3 sets of 10 reps"}, {"step": 4, "text": "Dumbbell rows — 3 sets of 10 per arm"}, {"step": 5, "text": "Plank hold — 3 sets of 45 seconds"}]'::jsonb);

-- Cycling workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Easy Spin', 'A relaxed ride to build cycling fitness', (SELECT id FROM sports WHERE name = 'Cycling'), 'beginner', 30, 120, '[{"step": 1, "text": "5-minute easy pedal warm-up"}, {"step": 2, "text": "Ride at a moderate pace for 20 minutes"}, {"step": 3, "text": "5-minute cool-down spin"}]'::jsonb),
  ('Hill Repeats', 'Build power with repeated hill climbs', (SELECT id FROM sports WHERE name = 'Cycling'), 'intermediate', 45, 220, '[{"step": 1, "text": "10-minute flat warm-up ride"}, {"step": 2, "text": "Find a moderate hill — ride up hard, easy descent — repeat 6 times"}, {"step": 3, "text": "10-minute easy cool-down ride"}]'::jsonb),
  ('Endurance Ride', 'Long steady ride to build aerobic capacity', (SELECT id FROM sports WHERE name = 'Cycling'), 'advanced', 60, 280, '[{"step": 1, "text": "10-minute progressive warm-up"}, {"step": 2, "text": "Ride at steady zone 2 effort for 40 minutes"}, {"step": 3, "text": "10-minute cool-down with light spinning"}]'::jsonb);

-- CrossFit workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Beast Mode WOD', 'A classic CrossFit-style AMRAP workout', (SELECT id FROM sports WHERE name = 'CrossFit'), 'intermediate', 30, 200, '[{"step": 1, "text": "5-minute dynamic warm-up: jumping jacks, arm circles, leg swings"}, {"step": 2, "text": "15-minute AMRAP: 10 burpees, 15 kettlebell swings, 20 box jumps"}, {"step": 3, "text": "5-minute cool-down and mobility"}]'::jsonb),
  ('Functional Foundations', 'Learn the fundamentals of functional fitness', (SELECT id FROM sports WHERE name = 'CrossFit'), 'beginner', 40, 170, '[{"step": 1, "text": "10-minute warm-up: rowing + dynamic stretches"}, {"step": 2, "text": "Technique practice: air squats, push-ups, ring rows — 3 sets of 10 each"}, {"step": 3, "text": "10-minute AMRAP: 5 push-ups, 10 air squats, 15 sit-ups"}, {"step": 4, "text": "5-minute cool-down stretch"}]'::jsonb),
  ('Chipper Challenge', 'A high-volume workout that tests mental grit', (SELECT id FROM sports WHERE name = 'CrossFit'), 'advanced', 45, 280, '[{"step": 1, "text": "5-minute jog and dynamic warm-up"}, {"step": 2, "text": "For time: 50 wall balls, 40 cal row, 30 toes-to-bar, 20 clean and jerks (60 kg), 10 muscle-ups"}, {"step": 3, "text": "10-minute cool-down and foam rolling"}]'::jsonb);

-- Swimming workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Learn to Lap Swim', 'A beginner-friendly session to build pool confidence', (SELECT id FROM sports WHERE name = 'Swimming'), 'beginner', 30, 130, '[{"step": 1, "text": "5-minute easy freestyle warm-up"}, {"step": 2, "text": "4 x 50m freestyle with 30 seconds rest"}, {"step": 3, "text": "4 x 25m kick drill with kickboard"}, {"step": 4, "text": "200m easy cool-down mixing backstroke and freestyle"}]'::jsonb),
  ('Endurance Swim', 'Build your distance swimming capacity', (SELECT id FROM sports WHERE name = 'Swimming'), 'intermediate', 45, 200, '[{"step": 1, "text": "200m mixed stroke warm-up"}, {"step": 2, "text": "6 x 100m freestyle on 2-minute intervals"}, {"step": 3, "text": "4 x 50m sprint with 20 seconds rest"}, {"step": 4, "text": "200m easy cool-down"}]'::jsonb),
  ('Speed & Technique', 'Refine your stroke and build speed', (SELECT id FROM sports WHERE name = 'Swimming'), 'advanced', 50, 250, '[{"step": 1, "text": "300m progressive warm-up"}, {"step": 2, "text": "8 x 50m drill work: catch-up, fingertip drag"}, {"step": 3, "text": "6 x 100m descending (each faster than the last)"}, {"step": 4, "text": "4 x 25m all-out sprint"}, {"step": 5, "text": "200m easy cool-down"}]'::jsonb);

-- Hyrox workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Hyrox Simulation', 'Simulate a Hyrox race with running and functional stations', (SELECT id FROM sports WHERE name = 'Hyrox'), 'intermediate', 50, 250, '[{"step": 1, "text": "5-minute jog warm-up"}, {"step": 2, "text": "1 km run then 50 cal ski erg"}, {"step": 3, "text": "1 km run then 50m sled push"}, {"step": 4, "text": "1 km run then 50m farmers carry"}, {"step": 5, "text": "1 km run then 100m lunges"}, {"step": 6, "text": "5-minute cool-down walk and stretch"}]'::jsonb),
  ('Hyrox Foundations', 'Build the fitness base needed for Hyrox racing', (SELECT id FROM sports WHERE name = 'Hyrox'), 'beginner', 35, 170, '[{"step": 1, "text": "5-minute warm-up jog"}, {"step": 2, "text": "3 rounds: 400m run, 20 wall balls, 15 cal row"}, {"step": 3, "text": "5-minute cool-down and stretch"}]'::jsonb),
  ('Hyrox Race Prep', 'Advanced workout mimicking full race intensity', (SELECT id FROM sports WHERE name = 'Hyrox'), 'advanced', 60, 300, '[{"step": 1, "text": "10-minute progressive warm-up"}, {"step": 2, "text": "8 rounds: 1 km run + 1 station (rotate: ski erg, sled push, sled pull, burpee broad jumps, rowing, farmers carry, sandbag lunges, wall balls)"}, {"step": 3, "text": "10-minute cool-down jog and full stretch"}]'::jsonb);

-- Yoga workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Morning Flow', 'A gentle vinyasa flow to start your day with energy', (SELECT id FROM sports WHERE name = 'Yoga'), 'beginner', 25, 100, '[{"step": 1, "text": "3 minutes seated breathing and intention setting"}, {"step": 2, "text": "Sun salutation A — 5 rounds"}, {"step": 3, "text": "Standing balance poses: tree, warrior III — hold 30s each side"}, {"step": 4, "text": "Seated forward folds and twists"}, {"step": 5, "text": "5-minute savasana"}]'::jsonb),
  ('Power Yoga', 'A strength-focused yoga session for experienced practitioners', (SELECT id FROM sports WHERE name = 'Yoga'), 'intermediate', 45, 180, '[{"step": 1, "text": "5 minutes pranayama breathing"}, {"step": 2, "text": "Sun salutation B — 5 rounds"}, {"step": 3, "text": "Flow sequence: chair, warrior I, warrior II, extended side angle — hold each 5 breaths"}, {"step": 4, "text": "Arm balance practice: crow pose attempts"}, {"step": 5, "text": "Hip openers and cool-down stretches"}, {"step": 6, "text": "5-minute savasana"}]'::jsonb),
  ('Stretch & Restore', 'A relaxing restorative session for recovery days', (SELECT id FROM sports WHERE name = 'Yoga'), 'all_levels', 30, 100, '[{"step": 1, "text": "5 minutes mindful breathing"}, {"step": 2, "text": "Supported child''s pose — 3 minutes"}, {"step": 3, "text": "Reclined butterfly — 3 minutes"}, {"step": 4, "text": "Supine twist — 3 minutes each side"}, {"step": 5, "text": "Legs up the wall — 5 minutes"}, {"step": 6, "text": "Final relaxation — 5 minutes"}]'::jsonb);

-- Pilates workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Core Foundations', 'Essential Pilates exercises for core activation', (SELECT id FROM sports WHERE name = 'Pilates'), 'beginner', 30, 120, '[{"step": 1, "text": "5-minute breathing and pelvic floor warm-up"}, {"step": 2, "text": "The hundred — 5 sets of 10 breaths (modify as needed)"}, {"step": 3, "text": "Single leg stretch — 10 reps each side"}, {"step": 4, "text": "Roll-ups — 8 reps"}, {"step": 5, "text": "Side-lying leg series — 10 reps each side"}, {"step": 6, "text": "5-minute stretch and cool-down"}]'::jsonb),
  ('Pilates Sculpt', 'Intermediate full-body Pilates session', (SELECT id FROM sports WHERE name = 'Pilates'), 'intermediate', 40, 170, '[{"step": 1, "text": "5-minute warm-up: articulating bridge, cat-cow"}, {"step": 2, "text": "The hundred — full version"}, {"step": 3, "text": "Double leg stretch — 10 reps"}, {"step": 4, "text": "Swan dive — 8 reps"}, {"step": 5, "text": "Side plank — hold 30s each side"}, {"step": 6, "text": "Teaser — 5 reps"}, {"step": 7, "text": "5-minute cool-down stretch"}]'::jsonb),
  ('Mat Power Hour', 'Challenging mat Pilates for advanced practitioners', (SELECT id FROM sports WHERE name = 'Pilates'), 'advanced', 50, 230, '[{"step": 1, "text": "5-minute progressive warm-up"}, {"step": 2, "text": "Classical Pilates mat sequence: hundred, roll-up, rollover, leg circles"}, {"step": 3, "text": "Spine stretch forward, open leg rocker, corkscrew"}, {"step": 4, "text": "Swimming, leg pull front, leg pull back"}, {"step": 5, "text": "Control balance and push-up series"}, {"step": 6, "text": "5-minute stretch and relaxation"}]'::jsonb);

-- Walking workouts
INSERT INTO workouts (title, description, sport_id, difficulty, duration_minutes, xp_reward, instructions) VALUES
  ('Brisk Walk 30', 'A steady 30-minute brisk walk to stay active', (SELECT id FROM sports WHERE name = 'Walking'), 'beginner', 30, 100, '[{"step": 1, "text": "5-minute easy pace warm-up walk"}, {"step": 2, "text": "Walk at a brisk pace (you can talk but not sing) for 20 minutes"}, {"step": 3, "text": "5-minute gentle cool-down walk and calf stretches"}]'::jsonb),
  ('Incline Power Walk', 'Use hills or treadmill incline for extra challenge', (SELECT id FROM sports WHERE name = 'Walking'), 'intermediate', 40, 160, '[{"step": 1, "text": "5-minute flat warm-up walk"}, {"step": 2, "text": "Walk on a steep incline (10-15%) for 3 minutes, flat for 2 minutes — repeat 5 times"}, {"step": 3, "text": "5-minute flat cool-down walk"}]'::jsonb),
  ('Exploration Walk', 'A longer walk to explore your neighbourhood or a new area', (SELECT id FROM sports WHERE name = 'Walking'), 'all_levels', 60, 180, '[{"step": 1, "text": "5-minute easy warm-up walk"}, {"step": 2, "text": "Walk at a comfortable pace for 50 minutes — pick a new route or trail"}, {"step": 3, "text": "5-minute cool-down walk and light stretching"}]'::jsonb);

-- ============================================
-- SEED: Events (June–August 2026, Riyadh & Jeddah)
-- ============================================
INSERT INTO events (title, description, event_type, sport_id, location_name, location_city, starts_at, ends_at, max_capacity, coach_name, gym_name, is_women_only) VALUES
  (
    'Beast Tribe Community Run',
    'Join fellow tribe members for an early morning 5K around King Fahd Park. All paces welcome.',
    'community_run',
    (SELECT id FROM sports WHERE name = 'Running'),
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
    (SELECT id FROM sports WHERE name = 'Running'),
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
    (SELECT id FROM sports WHERE name = 'Gym'),
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
    (SELECT id FROM sports WHERE name = 'CrossFit'),
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
    (SELECT id FROM sports WHERE name = 'Yoga'),
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
    (SELECT id FROM sports WHERE name = 'Swimming'),
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
    (SELECT id FROM sports WHERE name = 'Cycling'),
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
    (SELECT id FROM sports WHERE name = 'Hyrox'),
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
    (SELECT id FROM sports WHERE name = 'Pilates'),
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
    (SELECT id FROM sports WHERE name = 'Running'),
    'King Fahd Stadium',
    'Riyadh',
    '2026-08-28 05:30:00+03',
    '2026-08-28 09:00:00+03',
    500,
    'Coach Ali',
    NULL,
    FALSE
  );

-- ============================================
-- SEED: Additional Quests (sport-specific)
-- ============================================
INSERT INTO quests (title, description, sport_id, quest_type, xp_reward) VALUES
  -- Running
  ('Run 5K today', 'Complete a 5K run at any pace', (SELECT id FROM sports WHERE name = 'Running'), 'daily', 180),
  ('Log 3 runs this week', 'Complete three running workouts this week', (SELECT id FROM sports WHERE name = 'Running'), 'weekly', 400),

  -- Gym
  ('Lift for 45 minutes', 'Complete a 45-minute strength training session', (SELECT id FROM sports WHERE name = 'Gym'), 'daily', 170),
  ('Hit the gym 4 times this week', 'Log four gym workouts this week', (SELECT id FROM sports WHERE name = 'Gym'), 'weekly', 450),

  -- Cycling
  ('Ride 10 km today', 'Complete a 10 km cycling ride', (SELECT id FROM sports WHERE name = 'Cycling'), 'daily', 160),
  ('Cycle 50 km this week', 'Accumulate 50 km of riding this week', (SELECT id FROM sports WHERE name = 'Cycling'), 'weekly', 420),

  -- CrossFit
  ('Crush a WOD', 'Complete any Workout of the Day', (SELECT id FROM sports WHERE name = 'CrossFit'), 'daily', 190),
  ('3 WODs this week', 'Complete three CrossFit workouts this week', (SELECT id FROM sports WHERE name = 'CrossFit'), 'weekly', 430),

  -- Swimming
  ('Swim 500m today', 'Complete a 500m swim session', (SELECT id FROM sports WHERE name = 'Swimming'), 'daily', 150),
  ('Swim 3 times this week', 'Log three swim sessions this week', (SELECT id FROM sports WHERE name = 'Swimming'), 'weekly', 380),

  -- Hyrox
  ('Complete a Hyrox-style workout', 'Finish a functional fitness workout combining running and stations', (SELECT id FROM sports WHERE name = 'Hyrox'), 'daily', 200),
  ('Train Hyrox 3 times this week', 'Complete three Hyrox preparation workouts', (SELECT id FROM sports WHERE name = 'Hyrox'), 'weekly', 450),

  -- Yoga
  ('Flow for 20 minutes', 'Complete a 20-minute yoga session', (SELECT id FROM sports WHERE name = 'Yoga'), 'daily', 100),
  ('Practice yoga 3 times this week', 'Hit the mat three times this week', (SELECT id FROM sports WHERE name = 'Yoga'), 'weekly', 300),

  -- Pilates
  ('Do a Pilates session', 'Complete any Pilates workout', (SELECT id FROM sports WHERE name = 'Pilates'), 'daily', 110),
  ('3 Pilates sessions this week', 'Complete three Pilates workouts this week', (SELECT id FROM sports WHERE name = 'Pilates'), 'weekly', 320),

  -- Walking
  ('Walk 8K steps today', 'Hit at least 8,000 steps', (SELECT id FROM sports WHERE name = 'Walking'), 'daily', 100),
  ('Walk 50K steps this week', 'Accumulate 50,000 steps over the week', (SELECT id FROM sports WHERE name = 'Walking'), 'weekly', 350);

-- ============================================
-- SEED: Pack Challenge
-- ============================================
INSERT INTO pack_challenges (pack_a_id, pack_b_id, title, pack_a_xp, pack_b_xp, starts_at, ends_at) VALUES
  (
    (SELECT id FROM packs WHERE name = 'Wolf Pack'),
    (SELECT id FROM packs WHERE name = 'Tiger Squad'),
    'Summer Showdown',
    12400,
    9800,
    NOW() - INTERVAL '4 days',
    NOW() + INTERVAL '3 days'
  );
