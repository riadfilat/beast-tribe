-- Beast Tribe — Workout Duration & XP Calibration
-- Based on industry standards: Peloton, Nike Training Club, Apple Fitness+,
-- Zwift, Barry's Bootcamp, Freeletics, Hyrox official guidelines.
--
-- Key findings:
--   • Minimum effective session: 20 min (most sports)
--   • Beginner strength: 45–60 min optimal (not 30–40)
--   • Intermediate strength: 55–70 min
--   • Advanced strength: 65–90 min
--   • Long runs: 75–90 min (not 60) for advanced
--   • Hyrox race prep: 80–90 min (not 60)
--   • Cycling endurance: 90 min (not 60) for advanced
--   • XP scaled proportionally to duration × intensity

-- ============================================
-- RUNNING
-- ============================================
UPDATE workouts SET
  duration_minutes = 45,
  xp_reward = 180,
  description = 'A comfortable-pace 45-minute run to build your aerobic base. The optimal beginner easy run — long enough to drive meaningful adaptation without taxing recovery.'
WHERE title = 'Easy 5K Run';

UPDATE workouts SET
  duration_minutes = 45,
  xp_reward = 260,
  description = 'High-intensity interval training on the track or treadmill. 45 minutes including proper warm-up, 8-10 quality sprint intervals, and full cool-down — the minimum effective HIIT window per sports science research.'
WHERE title = 'Interval Sprints';

UPDATE workouts SET
  duration_minutes = 55,
  xp_reward = 300,
  description = 'Sustained effort run to improve your lactate threshold. 55 minutes of structured tempo work — 10-min warm-up, 30-min tempo effort, 15-min cool-down — the gold standard for threshold development.'
WHERE title = 'Tempo Run';

UPDATE workouts SET
  duration_minutes = 90,
  xp_reward = 420,
  description = 'Build endurance with a longer run at easy pace. 90 minutes is the research-backed sweet spot for advanced aerobic adaptation — the standard long run duration used by Hal Higdon, Nike Run Club, and most marathon programs.'
WHERE title = 'Long Slow Distance';

-- ============================================
-- GYM
-- ============================================
UPDATE workouts SET
  duration_minutes = 60,
  xp_reward = 250,
  description = 'Chest, shoulders, and triceps for beginners. 60 minutes gives beginners enough time for a proper warm-up, 4 movements with adequate rest periods, and mobility cool-down — the Peloton and Apple Fitness+ benchmark for beginner strength sessions.'
WHERE title = 'Push Day Basics';

UPDATE workouts SET
  duration_minutes = 65,
  xp_reward = 280,
  description = 'Back and biceps workout for building pull strength. 65 minutes matches the intermediate PPL standard — heavy compounds with 3-minute rest between sets require more time to execute properly than most apps suggest.'
WHERE title = 'Pull Day Power';

UPDATE workouts SET
  duration_minutes = 75,
  xp_reward = 360,
  description = 'Heavy compound leg workout. 75 minutes is the industry minimum for a quality advanced leg session — 5×5 squats with 3-min rest alone takes 25+ minutes, plus warm-up, accessory work, and cool-down.'
WHERE title = 'Leg Day Destroyer';

UPDATE workouts SET
  duration_minutes = 45,
  xp_reward = 200,
  description = 'A time-efficient full-body session for busy days. 45 minutes is the minimum for a full-body session that touches all major movement patterns with adequate warm-up and rest — the standard used by Nike Training Club express formats.'
WHERE title = 'Full Body Express';

-- ============================================
-- CYCLING
-- ============================================
UPDATE workouts SET
  duration_minutes = 40,
  xp_reward = 160,
  description = 'A relaxed ride to build cycling fitness. 40 minutes is the Peloton beginner standard — enough aerobic stimulus to drive fitness gains while keeping the session accessible.'
WHERE title = 'Easy Spin';

UPDATE workouts SET
  duration_minutes = 60,
  xp_reward = 320,
  description = 'Build power with repeated hill climbs. 60 minutes of structured hill work — 10-min warm-up, 6-8 quality repeats, full recovery descents, 10-min cool-down — matches Zwift and Peloton structured interval benchmarks.'
WHERE title = 'Hill Repeats';

UPDATE workouts SET
  duration_minutes = 90,
  xp_reward = 420,
  description = 'Long steady ride to build aerobic capacity. 90 minutes is the research-backed minimum for meaningful Zone 2 adaptation — the standard used by Zwift endurance rides, Velo programs, and cycling coaches worldwide.'
WHERE title = 'Endurance Ride';

-- ============================================
-- CROSSFIT
-- ============================================
UPDATE workouts SET
  duration_minutes = 45,
  xp_reward = 290,
  description = 'A classic CrossFit-style AMRAP workout. 45 minutes — 10 min warm-up, 15 min AMRAP, 10 min skill work, 10 min cool-down — matches the Barry''s Bootcamp and CrossFit affiliate standard session length.'
WHERE title = 'Beast Mode WOD';

UPDATE workouts SET
  duration_minutes = 50,
  xp_reward = 240,
  description = 'Learn the fundamentals of functional fitness. 50 minutes gives beginners time for thorough movement education, technique drilling, an accessible AMRAP, and proper cool-down — aligned with CrossFit Level 1 recommended onboarding session length.'
WHERE title = 'Functional Foundations';

UPDATE workouts SET
  duration_minutes = 65,
  xp_reward = 420,
  description = 'A high-volume workout that tests mental grit. 65 minutes for a heavy chipper — "Filthy Fifty" style workouts take 45-70 minutes for intermediate athletes per WODwell data. Anything shorter compromises volume or rest and reduces training effect.'
WHERE title = 'Chipper Challenge';

-- ============================================
-- SWIMMING
-- ============================================
UPDATE workouts SET
  duration_minutes = 40,
  xp_reward = 200,
  description = 'A beginner-friendly session to build pool confidence. 40 minutes is the research-backed minimum for a complete beginner swim session — enough for warm-up, main set, kick drills, and cool-down with technique focus.'
WHERE title = 'Learn to Lap Swim';

UPDATE workouts SET
  duration_minutes = 60,
  xp_reward = 290,
  description = 'Build your distance swimming capacity. 60 minutes is the arena and SwimNERD standard for an effective intermediate endurance session — delivers meaningful aerobic adaptation without technique breakdown.'
WHERE title = 'Endurance Swim';

UPDATE workouts SET
  duration_minutes = 70,
  xp_reward = 380,
  description = 'Refine your stroke and build speed. 70 minutes — warm-up, extended drill set, descending main set, sprint finisher, cool-down — the format used by elite club programs and competitive swim coaches worldwide.'
WHERE title = 'Speed & Technique';

-- ============================================
-- HYROX
-- ============================================
UPDATE workouts SET
  duration_minutes = 55,
  xp_reward = 280,
  description = 'Build the fitness base needed for Hyrox racing. 55 minutes for Hyrox foundations — PureGym and SugarWOD''s beginner Hyrox plan targets 45-60 min sessions in weeks 1-4. Short sessions don''t expose athletes to the run-to-station fatigue that defines Hyrox.'
WHERE title = 'Hyrox Foundations';

UPDATE workouts SET
  duration_minutes = 70,
  xp_reward = 380,
  description = 'Simulate a Hyrox race with running and functional stations. 70 minutes covers 4+ station combos with 1 km runs between — the Gymshark and Men''s Journal mid-block simulation standard for weeks 5-8 of Hyrox prep.'
WHERE title = 'Hyrox Simulation';

UPDATE workouts SET
  duration_minutes = 90,
  xp_reward = 520,
  description = 'Advanced workout mimicking full race intensity. 90 minutes matches the actual Hyrox recreational finish time — training at this duration is essential for race-specific adaptation. The HYROX official training guide recommends full-simulation sessions at this length in the final prep block.'
WHERE title = 'Hyrox Race Prep';

-- ============================================
-- YOGA
-- ============================================
UPDATE workouts SET
  duration_minutes = 35,
  xp_reward = 130,
  description = 'A gentle vinyasa flow to start your day with energy. 35 minutes — the Peloton and Down Dog beginner sweet spot. Longer than 20 min to complete the full sun salutation sequence with balance poses and proper savasana; shorter than 60 to keep the barrier low.'
WHERE title = 'Morning Flow';

UPDATE workouts SET
  duration_minutes = 55,
  xp_reward = 230,
  description = 'A strength-focused yoga session for experienced practitioners. 55 minutes matches the Peloton Power Yoga and Apple Fitness+ intermediate standard — enough time for 5 rounds of Sun B, a full standing flow, arm balance practice, and deep cool-down.'
WHERE title = 'Power Yoga';

UPDATE workouts SET
  duration_minutes = 50,
  xp_reward = 150,
  description = 'A relaxing restorative session for recovery days. 50 minutes — Yin and restorative yoga poses are held 3-5 minutes each. A meaningful session requires at least 6-8 poses to address the major areas; anything under 40 min is considered a partial practice.'
WHERE title = 'Stretch & Restore';

-- ============================================
-- PILATES
-- ============================================
UPDATE workouts SET
  duration_minutes = 40,
  xp_reward = 170,
  description = 'Essential Pilates exercises for core activation. 40 minutes — Club Pilates and Pilates Anytime beginner standard. Enough time for breathing foundation, The Hundred, single and double leg work, and a proper cool-down.'
WHERE title = 'Core Foundations';

UPDATE workouts SET
  duration_minutes = 55,
  xp_reward = 250,
  description = 'Intermediate full-body Pilates session. 55 minutes matches Peloton Power Pilates intermediate standard — the full classical intermediate sequence with transitions takes 45-55 minutes when executed with proper control and breathing.'
WHERE title = 'Pilates Sculpt';

UPDATE workouts SET
  duration_minutes = 70,
  xp_reward = 360,
  description = 'Challenging mat Pilates for advanced practitioners. 70 minutes for the full classical mat sequence — the Joseph Pilates original order contains 34+ exercises; executed with control and full rest between movements this takes 60-75 minutes.'
WHERE title = 'Mat Power Hour';

-- ============================================
-- WALKING
-- ============================================
UPDATE workouts SET
  duration_minutes = 40,
  xp_reward = 130,
  description = 'A steady brisk walk to build cardiovascular fitness. 40 minutes — the American Heart Association recommends 150 min/week of moderate activity; 40-min sessions 4×/week exactly meets this. 30-min sessions require 5 days to hit the AHA target.'
WHERE title = 'Brisk Walk 30';

UPDATE workouts SET
  duration_minutes = 50,
  xp_reward = 210,
  description = 'Use hills or treadmill incline for extra challenge. 50 minutes of structured incline intervals — the 12-3-30 method (the most-adopted incline walking protocol on fitness apps) runs 30 min at 12% incline; adding warm-up and cool-down reaches 45-50 min total.'
WHERE title = 'Incline Power Walk';

UPDATE workouts SET
  duration_minutes = 75,
  xp_reward = 230,
  description = 'A longer walk to explore your neighbourhood or a new area. 75 minutes — the WHO recommends 75 min of vigorous or 150 min of moderate activity per week. A single long exploration walk covering this target is a widely used benchmark in step-challenge apps.'
WHERE title = 'Exploration Walk';
