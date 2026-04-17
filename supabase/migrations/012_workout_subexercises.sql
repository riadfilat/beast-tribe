-- Beast Tribe — Workout Sub-Exercises
-- Adds per-exercise granularity to all 29 workouts.
-- Each instruction step gains:
--   is_warmup          boolean
--   sets               integer  (how many times to repeat the exercises array)
--   rest_between_sets  integer  (seconds between set repeats)
--   rest_seconds       integer  (seconds after final set, before next step)
--   exercises          jsonb[]  [{name, duration?, reps?, cues?}]
--
-- The session screen reads these fields to build a flat, ordered exercise list
-- that the athlete taps through one item at a time.

-- ──────────────────────────────────────────────────────────────────────────────
-- RUNNING
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Light jog", "duration": "3 min", "cues": "Easy pace — you should hold a full conversation"},
          {"name": "Leg swings", "duration": "30 sec each leg", "cues": "Hold a wall, controlled forward and back arc"},
          {"name": "Ankle circles", "duration": "30 sec each ankle", "cues": "Full range, both directions"},
          {"name": "High knees", "duration": "30 sec", "cues": "Drive knees to hip height, stay on balls of feet"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy aerobic run", "duration": "37 min", "cues": "Stay at conversational pace — nose-breathe if possible. Land mid-foot, lean slightly forward from ankles"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy walk", "duration": "2 min", "cues": "Let heart rate drop below 110 bpm"},
          {"name": "Quad stretch", "duration": "45 sec each leg", "cues": "Stand on one leg, pull heel to glute"},
          {"name": "Hamstring stretch", "duration": "45 sec each leg", "cues": "Heel on a ledge, hinge forward until mild pull"},
          {"name": "Calf stretch", "duration": "30 sec each side", "cues": "Heel flat, toes elevated on a wall"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Easy 5K Run';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy jog", "duration": "5 min", "cues": "Build from walk to easy jog over the first minute"},
          {"name": "Leg swings", "duration": "30 sec each leg"},
          {"name": "Butt kicks", "duration": "30 sec", "cues": "Heels to glutes, stay light on feet"},
          {"name": "Build-up strides", "reps": "3 × 20 sec", "cues": "Accelerate to 90% effort, walk back recovery"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 8, "rest_between_sets": 90, "rest_seconds": 60,
        "exercises": [
          {"name": "Sprint interval", "duration": "30 sec", "cues": "95–100% effort. Drive arms, full extension, stay tall. Walk/jog the recovery"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy jog", "duration": "4 min", "cues": "Gradually slow to a walk"},
          {"name": "Hip flexor stretch", "duration": "45 sec each side"},
          {"name": "Calf stretch", "duration": "30 sec each side"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Interval Sprints';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy jog", "duration": "8 min", "cues": "Zone 1 — fully aerobic, very comfortable"},
          {"name": "Dynamic drills", "duration": "2 min", "cues": "High knees, butt kicks, A-skips. Prepare the neuromuscular system for faster running"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Tempo run", "duration": "30 min", "cues": "Comfortably hard — 7/10 effort. You can speak in short phrases only. Aim for a pace 30–40 sec/km slower than 5K race pace"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy jog", "duration": "5 min"},
          {"name": "Standing quad stretch", "duration": "45 sec each"},
          {"name": "Seated hamstring stretch", "duration": "45 sec each"},
          {"name": "Hip flexor stretch", "duration": "45 sec each"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Tempo Run';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Brisk walk", "duration": "3 min"},
          {"name": "Easy jog", "duration": "5 min", "cues": "Build gently — heart rate below 130 bpm"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Long easy run", "duration": "77 min", "cues": "Zone 2 the entire time — you must be able to hold a conversation. Slower is fine. Fuel with water every 20 min"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Walk", "duration": "3 min"},
          {"name": "Full leg stretch sequence", "duration": "7 min", "cues": "Quads, hamstrings, calves, hip flexors — hold each 45 sec"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Long Slow Distance';

-- ──────────────────────────────────────────────────────────────────────────────
-- GYM
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Band pull-aparts", "reps": "15 reps", "cues": "Arms straight, squeeze shoulder blades together at the peak"},
          {"name": "Shoulder circles", "duration": "30 sec each direction", "cues": "Controlled rotation, gradually increase range"},
          {"name": "Scapular push-ups", "reps": "10 reps", "cues": "Arms locked, only move shoulder blades — retract and protract"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 4, "rest_between_sets": 90, "rest_seconds": 75,
        "exercises": [
          {"name": "Barbell bench press", "reps": "10 reps", "cues": "Grip just outside shoulder width. Arch naturally, feet flat. Lower to touch chest, press through and slightly back"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 3, "rest_between_sets": 75, "rest_seconds": 60,
        "exercises": [
          {"name": "Incline DB press", "reps": "12 reps", "cues": "30° bench. Elbows at 45° to torso. Full range — feel the stretch at the bottom"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 3, "rest_between_sets": 60, "rest_seconds": 60,
        "exercises": [
          {"name": "DB lateral raises", "reps": "15 reps", "cues": "Lead with elbows, slight forward lean. Raise to shoulder height only — above that is trap territory"}
        ]}'::jsonb
      WHEN 5 THEN '{
        "sets": 3, "rest_between_sets": 60, "rest_seconds": 60,
        "exercises": [
          {"name": "Tricep pushdowns", "reps": "15 reps", "cues": "Elbows pinned at sides, full extension, squeeze at bottom"}
        ]}'::jsonb
      WHEN 6 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Chest doorway stretch", "duration": "45 sec each side"},
          {"name": "Tricep overhead stretch", "duration": "30 sec each arm"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Push Day Basics';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Band pull-aparts", "reps": "15 reps"},
          {"name": "Cat-cow", "duration": "45 sec", "cues": "Breathe in on cow, out on cat"},
          {"name": "Dead hang", "duration": "30 sec", "cues": "Passive hang from bar — decompress spine, open lats"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 4, "rest_between_sets": 90, "rest_seconds": 75,
        "exercises": [
          {"name": "Barbell bent-over row", "reps": "8 reps", "cues": "Hinge to 45°, bar to lower rib, lead with elbows. 3-sec eccentric"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 3, "rest_between_sets": 120, "rest_seconds": 90,
        "exercises": [
          {"name": "Pull-ups", "reps": "6 reps", "cues": "Full hang to chin over bar. Depress scapulae before pulling. Use band if needed"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 3, "rest_between_sets": 75, "rest_seconds": 60,
        "exercises": [
          {"name": "Seated cable row", "reps": "12 reps", "cues": "Chest tall, row to sternum, elbows trace body — no shrugging"}
        ]}'::jsonb
      WHEN 5 THEN '{
        "sets": 3, "rest_between_sets": 60, "rest_seconds": 60,
        "exercises": [
          {"name": "Face pulls", "reps": "15 reps", "cues": "Rope to face, elbows flared out and back. External rotation focus"}
        ]}'::jsonb
      WHEN 6 THEN '{
        "sets": 3, "rest_between_sets": 60, "rest_seconds": 60,
        "exercises": [
          {"name": "Barbell bicep curls", "reps": "12 reps", "cues": "Supinate wrists fully, elbows stay back, 2-sec lower"}
        ]}'::jsonb
      WHEN 7 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Lat stretch", "duration": "45 sec each side", "cues": "Hang from bar one-handed or reach overhead"},
          {"name": "Bicep wall stretch", "duration": "30 sec each arm"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Pull Day Power';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Hip circles", "duration": "30 sec each direction", "cues": "Wide stance, hands on hips, max range of motion"},
          {"name": "Leg swings", "duration": "30 sec each leg"},
          {"name": "Bodyweight squats", "reps": "20 reps", "cues": "Full depth, knees track toes, upright torso"},
          {"name": "Glute bridges", "reps": "15 reps", "cues": "Drive through heels, squeeze glutes at top for 1 sec"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 5, "rest_between_sets": 180, "rest_seconds": 90,
        "exercises": [
          {"name": "Back squat", "reps": "5 reps", "cues": "Bar on upper traps, brace core, break parallel. Drive knees out throughout. 3-sec descent"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 4, "rest_between_sets": 120, "rest_seconds": 90,
        "exercises": [
          {"name": "Romanian deadlift", "reps": "8 reps", "cues": "Soft knee bend, hinge from hips, bar traces legs down. Feel hamstring stretch, then squeeze glutes to return"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 3, "rest_between_sets": 90, "rest_seconds": 75,
        "exercises": [
          {"name": "Leg press", "reps": "12 reps", "cues": "Feet shoulder-width, mid platform. Full range without rounding lower back"}
        ]}'::jsonb
      WHEN 5 THEN '{
        "sets": 3, "rest_between_sets": 75, "rest_seconds": 60,
        "exercises": [
          {"name": "Walking lunges", "reps": "12 reps each leg", "cues": "Long stride, back knee near floor, front shin vertical"}
        ]}'::jsonb
      WHEN 6 THEN '{
        "sets": 3, "rest_between_sets": 60, "rest_seconds": 60,
        "exercises": [
          {"name": "Lying leg curls", "reps": "15 reps", "cues": "Full range, 2-sec peak contraction, 2-sec eccentric"}
        ]}'::jsonb
      WHEN 7 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Pigeon stretch", "duration": "60 sec each side"},
          {"name": "Quad stretch", "duration": "45 sec each side"},
          {"name": "Hamstring stretch", "duration": "45 sec each side"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Leg Day Destroyer';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 45,
        "exercises": [
          {"name": "Jumping jacks", "duration": "30 sec", "cues": "Full arm extension overhead"},
          {"name": "Arm circles", "duration": "30 sec each direction"},
          {"name": "Bodyweight squats", "reps": "10 reps"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 3, "rest_between_sets": 60, "rest_seconds": 60,
        "exercises": [
          {"name": "Push-ups", "reps": "10 reps", "cues": "Straight body, chest to floor, full lockout"},
          {"name": "Dumbbell rows", "reps": "10 reps each arm", "cues": "Hinge 45°, row to hip, squeeze at top"},
          {"name": "Goblet squats", "reps": "15 reps", "cues": "Cup DB at chest, elbows inside knees at bottom"},
          {"name": "Plank", "duration": "30 sec", "cues": "Straight line head to heel, breathe steadily"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Chest stretch", "duration": "30 sec each side"},
          {"name": "Hip flexor stretch", "duration": "30 sec each side"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Full Body Express';

-- ──────────────────────────────────────────────────────────────────────────────
-- CYCLING
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Easy spin", "duration": "5 min", "cues": "High cadence (80–90 rpm), low resistance — loosen joints"},
          {"name": "Leg circles drill", "duration": "30 sec each leg", "cues": "Unclip one foot, pedal one-legged — smooth circles"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Steady aerobic ride", "duration": "32 min", "cues": "Zone 2 — heart rate 60–70% max. Comfortable, sustainable. Cadence 80+ rpm"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy spin cool-down", "duration": "3 min", "cues": "Drop resistance to zero, let heart rate fall"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Easy Spin';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy spin", "duration": "10 min", "cues": "Build from Zone 1 to Zone 2. Legs should feel warm before first climb"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 6, "rest_between_sets": 120, "rest_seconds": 60,
        "exercises": [
          {"name": "Hill climb effort", "duration": "3 min", "cues": "Add resistance to simulate 6–8% grade. Zone 4 — laboured breathing, stay seated"},
          {"name": "Recovery descent", "duration": "2 min", "cues": "Drop resistance, high cadence, breathe down"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy spin cool-down", "duration": "10 min", "cues": "Gradually reduce effort, stretch calves on bike"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Hill Repeats';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy spin", "duration": "10 min", "cues": "Stay in Zone 1–2, allow aerobic system to prime"},
          {"name": "Build to Zone 2", "duration": "5 min", "cues": "Gradually increase watts or resistance to target Zone 2"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Zone 2 steady ride", "duration": "65 min", "cues": "Heart rate 60–70% max the ENTIRE time. Aerobic fat-burning zone. Hydrate every 20 min. If HR drifts above Zone 2, reduce effort immediately"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy spin cool-down", "duration": "10 min", "cues": "Drop power gradually, no stopping abruptly"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Endurance Ride';

-- ──────────────────────────────────────────────────────────────────────────────
-- CROSSFIT
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 2, "rest_between_sets": 30, "rest_seconds": 60,
        "exercises": [
          {"name": "Jumping jacks", "duration": "1 min", "cues": "Full arm extension overhead, light on feet"},
          {"name": "Arm circles", "duration": "30 sec each direction", "cues": "Progress from small to large"},
          {"name": "Leg swings", "duration": "30 sec each leg", "cues": "Hold wall, controlled forward-back arc"},
          {"name": "Hip circles", "duration": "30 sec each direction", "cues": "Hands on hips, max range"},
          {"name": "High knees", "duration": "30 sec", "cues": "Drive knees to hip height, stay on balls of feet"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Burpees", "reps": "10 reps", "cues": "Chest to floor, explosive jump, clap overhead. Scale: step-out burpee"},
          {"name": "Kettlebell swings", "reps": "15 reps", "cues": "Hip hinge, not a squat. Drive hips forward explosively. Bell at eye level"},
          {"name": "Box jumps", "reps": "20 reps", "cues": "Land softly, absorb with hips and knees. Step down each rep. Scale: step-ups"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Skill work — double-unders", "duration": "10 min", "cues": "3× jump height, tight wrists. Sub: 50 single-unders per attempted double-under set"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Hip flexor stretch", "duration": "45 sec each side"},
          {"name": "Hamstring stretch", "duration": "30 sec each side"},
          {"name": "Thoracic rotation", "duration": "30 sec each side", "cues": "Seated, rotate from mid-back"},
          {"name": "Child''s pose", "duration": "1 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Beast Mode WOD';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Light jog", "duration": "3 min"},
          {"name": "Arm swings", "duration": "30 sec each direction"},
          {"name": "Hip hinge drill", "duration": "30 sec", "cues": "Hinge at hips, maintain neutral spine — intro to deadlift pattern"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Air squat technique", "reps": "20 reps", "cues": "Focus on depth, knees tracking toes, upright chest"},
          {"name": "Deadlift hinge practice", "reps": "15 reps", "cues": "PVC or empty bar — crease hips back, bar traces shins"},
          {"name": "Push-up form drill", "reps": "10 reps", "cues": "Hollow body position, elbows at 45°"},
          {"name": "Hollow body hold", "duration": "20 sec", "cues": "Lower back pressed to floor, legs and arms extended"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Air squats — AMRAP 10 min", "reps": "10 reps per round", "cues": "Move at a sustainable pace, log your total rounds"},
          {"name": "Push-ups — AMRAP 10 min", "reps": "5 reps per round"},
          {"name": "Sit-ups — AMRAP 10 min", "reps": "10 reps per round"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Forward fold", "duration": "45 sec"},
          {"name": "Hip stretch", "duration": "30 sec each side"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Functional Foundations';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Row or bike", "duration": "5 min", "cues": "Easy pace, all joints warm"},
          {"name": "Dynamic mobility", "duration": "5 min", "cues": "Leg swings, hip circles, shoulder rolls, inchworms"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Pull-ups", "reps": "50 reps", "cues": "Chip away — break into sets of 5–10. Scale: ring rows"},
          {"name": "Deadlifts 135/95 lb", "reps": "50 reps", "cues": "Flat back every rep. Drop from top if needed"},
          {"name": "Box jumps 24/20 in", "reps": "50 reps", "cues": "Step down every rep to protect knees at fatigue"},
          {"name": "Push-ups", "reps": "50 reps", "cues": "Scale to knee push-ups to maintain form"},
          {"name": "Kettlebell swings", "reps": "50 reps", "cues": "American (overhead) or Russian — maintain hip hinge"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Full mobility cool-down", "duration": "10 min", "cues": "Hips, thoracic, shoulders, hamstrings"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Chipper Challenge';

-- ──────────────────────────────────────────────────────────────────────────────
-- SWIMMING
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Gentle freestyle", "reps": "4 × 25m", "cues": "Focus on breathing rhythm. Breathe every 3 strokes"},
          {"name": "Kick drill with board", "reps": "4 × 25m", "cues": "Flutter kick, ankles relaxed, small amplitude"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 2, "rest_between_sets": 30, "rest_seconds": 60,
        "exercises": [
          {"name": "Freestyle", "reps": "4 × 50m", "cues": "Rest 20 sec between each 50m. Maintain technique — don''t let form break down when tired"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy backstroke", "reps": "4 × 25m", "cues": "Full rotation, look straight up at ceiling"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Learn to Lap Swim';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Mixed stroke warm-up", "reps": "400m", "cues": "100m each: freestyle, backstroke, breaststroke, freestyle"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Steady freestyle", "reps": "1200m", "cues": "Aerobic pace — you should be able to sustain this. Aim for consistent split times on each 100m"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 2, "rest_between_sets": 30, "rest_seconds": 60,
        "exercises": [
          {"name": "Catch-up drill", "reps": "50m", "cues": "One arm waits fully extended while the other completes a full stroke cycle"},
          {"name": "Fingertip drag drill", "reps": "50m", "cues": "Drag fingertips along the surface on the recovery — keeps elbow high"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy choice cool-down", "reps": "200m", "cues": "Any stroke, very easy, let heart rate come down"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Endurance Swim';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy freestyle warm-up", "reps": "400m", "cues": "No rush, feel water on hands"},
          {"name": "Drill set", "reps": "200m", "cues": "100m catch-up, 100m fingertip drag"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 3, "rest_between_sets": 20, "rest_seconds": 60,
        "exercises": [
          {"name": "Catch-up drill", "reps": "50m"},
          {"name": "Single-arm drill", "reps": "50m", "cues": "Other arm at side, full rotation"},
          {"name": "Fingertip drag", "reps": "50m"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 5, "rest_between_sets": 20, "rest_seconds": 60,
        "exercises": [
          {"name": "Sprint freestyle", "reps": "100m", "cues": "Descend effort — set 5 should be fastest. Track split time"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 6, "rest_between_sets": 15, "rest_seconds": 60,
        "exercises": [
          {"name": "All-out sprint", "reps": "25m", "cues": "Maximum effort — this is race pace and above. Turn technique focus: open turn or flip turn"}
        ]}'::jsonb
      WHEN 5 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy backstroke cool-down", "reps": "200m"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Speed & Technique';

-- ──────────────────────────────────────────────────────────────────────────────
-- HYROX
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Light jog", "duration": "5 min"},
          {"name": "Dynamic mobility", "duration": "3 min", "cues": "Hip circles, leg swings, inchworms, shoulder rolls"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 2, "rest_between_sets": 90, "rest_seconds": 60,
        "exercises": [
          {"name": "Run", "reps": "500m", "cues": "Moderate effort — you''ll work harder at stations"},
          {"name": "Sled push", "reps": "30m", "cues": "Low hips, drive through legs. Simulate race weight"},
          {"name": "Burpee broad jumps", "reps": "10 reps", "cues": "Chest to floor, jump forward as far as possible, land soft"},
          {"name": "Ski erg", "reps": "250m", "cues": "Hinge from hips, arms straight on pull, full extension"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Walk", "duration": "3 min"},
          {"name": "Full body stretch", "duration": "5 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Hyrox Foundations';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy jog", "duration": "5 min"},
          {"name": "Movement prep", "duration": "3 min", "cues": "Inchworms, leg swings, shoulder circles"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Run", "reps": "1 km", "cues": "Race pace — this is how you should feel in competition"},
          {"name": "Ski erg", "reps": "1000m", "cues": "Consistent pull power, don''t sprint"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Sled push", "reps": "50m", "cues": "Race-weight sled. Low body position"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Burpee broad jumps", "reps": "80m", "cues": "Chip away — steady rhythm wins"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Wall balls", "reps": "100 reps", "cues": "9/6 kg to 10/9 ft target. Squat depth, throw on the way up"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Walk", "duration": "5 min"},
          {"name": "Stretch", "duration": "5 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Hyrox Simulation';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Easy jog", "duration": "5 min"},
          {"name": "Race-pace strides", "reps": "5 × 100m", "cues": "Accelerate to race effort, walk back"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 60,
        "exercises": [
          {"name": "Run", "reps": "1 km"},
          {"name": "Ski erg", "reps": "1000m"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Sled push", "reps": "50m"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Sled pull", "reps": "50m", "cues": "Walk backwards, upright posture"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Burpee broad jumps", "reps": "80m"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Row", "reps": "1000m", "cues": "Drive legs first, then lean, then arms — reverse on recovery"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Farmer''s carry", "reps": "200m", "cues": "Upright posture, small quick steps, don''t set down"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Sandbag lunges", "reps": "100m", "cues": "Alternate legs, bag on shoulder"},
          {"name": "Run", "reps": "1 km"},
          {"name": "Wall balls", "reps": "100 reps"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Walk", "duration": "5 min"},
          {"name": "Full body stretch", "duration": "10 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Hyrox Race Prep';

-- ──────────────────────────────────────────────────────────────────────────────
-- YOGA
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 0,
        "exercises": [
          {"name": "Child''s pose", "duration": "1 min", "cues": "Arms long, breathe into the back body"},
          {"name": "Cat-cow", "duration": "30 sec", "cues": "Inhale cow, exhale cat. Slow and deliberate"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 5, "rest_between_sets": 15, "rest_seconds": 30,
        "exercises": [
          {"name": "Mountain pose", "duration": "10 sec", "cues": "Ground through all four corners of feet"},
          {"name": "Forward fold", "duration": "10 sec", "cues": "Soft knees, let spine hang"},
          {"name": "Half lift", "duration": "10 sec", "cues": "Flat back, fingertips to shins"},
          {"name": "Plank", "duration": "15 sec", "cues": "Straight line, breathe"},
          {"name": "Upward dog", "duration": "10 sec", "cues": "Press tops of feet, lift sternum"},
          {"name": "Downward dog", "duration": "20 sec", "cues": "Heels toward floor, pedal feet"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1, "rest_seconds": 0,
        "exercises": [
          {"name": "Warrior I", "duration": "30 sec each side"},
          {"name": "Tree pose", "duration": "30 sec each side", "cues": "Foot above or below knee — never on joint"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Seated forward fold", "duration": "1 min"},
          {"name": "Savasana", "duration": "3 min", "cues": "Total stillness. Let the practice integrate"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Morning Flow';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 0,
        "exercises": [
          {"name": "Child''s pose", "duration": "1 min"},
          {"name": "Cat-cow", "duration": "1 min"},
          {"name": "Downward dog", "duration": "1 min", "cues": "Walk the dog, bend alternating knees"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 5, "rest_between_sets": 15, "rest_seconds": 30,
        "exercises": [
          {"name": "Chair pose", "duration": "30 sec", "cues": "Thighs toward parallel, arms overhead"},
          {"name": "Warrior I", "duration": "30 sec each side"},
          {"name": "Warrior II", "duration": "30 sec each side", "cues": "Gaze over front hand, hips square to the side"},
          {"name": "High lunge", "duration": "30 sec each side"},
          {"name": "Plank", "duration": "30 sec"},
          {"name": "Chaturanga", "reps": "1 rep", "cues": "Elbows track back at 45° — do not flare"},
          {"name": "Upward dog", "duration": "10 sec"},
          {"name": "Downward dog", "duration": "20 sec"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Crow pose", "duration": "1 min attempt", "cues": "Knees on upper triceps, lean forward, look ahead"},
          {"name": "Side plank", "duration": "30 sec each side"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Pigeon pose", "duration": "2 min each side"},
          {"name": "Supine twist", "duration": "1 min each side"},
          {"name": "Savasana", "duration": "5 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Power Yoga';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "sets": 1, "rest_seconds": 0,
        "exercises": [
          {"name": "Butterfly", "duration": "4 min", "cues": "Let inner thighs release, no bouncing"},
          {"name": "Dragon pose", "duration": "3 min each side", "cues": "Deep lunge, back knee down. Breathe into the hip flexor"},
          {"name": "Sleeping swan", "duration": "3 min each side", "cues": "Yin pigeon — let the floor hold you"},
          {"name": "Supported fish", "duration": "4 min", "cues": "Block under thoracic, open chest. Breathe"},
          {"name": "Legs up the wall", "duration": "5 min", "cues": "Passive inversion — feel venous return"},
          {"name": "Supine twist", "duration": "2 min each side"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Savasana", "duration": "5 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Stretch & Restore';

-- ──────────────────────────────────────────────────────────────────────────────
-- PILATES
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Breathing foundation", "duration": "2 min", "cues": "Inhale wide into ribs, exhale draw navel to spine"},
          {"name": "Pelvic tilts", "duration": "30 sec", "cues": "Imprint and neutral — find the range"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "The Hundred", "duration": "2 min", "cues": "5 inhale pumps, 5 exhale pumps. Legs at 45°, curl up"},
          {"name": "Single leg stretch", "duration": "1 min", "cues": "Pull knee to chest, switch, exhale on each pull"},
          {"name": "Double leg stretch", "duration": "1 min", "cues": "Circle arms, extend legs, draw in on exhale"},
          {"name": "Scissors", "duration": "1 min each leg"},
          {"name": "Criss-cross", "duration": "1 min", "cues": "Rotate thoracic — don''t pull neck"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Single leg circles", "duration": "30 sec each leg", "cues": "Stable pelvis — only the leg moves"},
          {"name": "Bridging", "duration": "1 min", "cues": "Articulate spine up and down, one vertebra at a time"},
          {"name": "Side-lying series", "duration": "1 min each side", "cues": "Front kick, back kick, circles"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Swan prep", "duration": "30 sec", "cues": "Press through hands, lift sternum, keep abdominals engaged"},
          {"name": "Child''s pose", "duration": "1 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Core Foundations';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "The Hundred", "reps": "100 beats", "cues": "5 inhale/5 exhale pumps × 10 — legs extended"},
          {"name": "Roll-up", "reps": "5 reps", "cues": "Articulate through every vertebra, slow and controlled"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Single leg circles", "reps": "10 each leg"},
          {"name": "Rolling like a ball", "reps": "10 reps", "cues": "C-curve, balance on sit-bones"},
          {"name": "Single leg stretch", "reps": "10 each leg"},
          {"name": "Double leg stretch", "reps": "10 reps"},
          {"name": "Scissors", "reps": "10 each leg"},
          {"name": "Lower and lift", "reps": "10 reps", "cues": "Legs together, imprint lumbar"},
          {"name": "Criss-cross", "reps": "20 reps"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Standing side kicks", "reps": "10 each side", "cues": "One hand on wall, leg stays in hip socket"},
          {"name": "Relevés", "reps": "10 reps", "cues": "Rise on balls of feet, controlled lowering"},
          {"name": "Balance work", "duration": "1 min", "cues": "Standing on one leg, eyes open then closed"}
        ]}'::jsonb
      WHEN 4 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Spine stretch", "reps": "5 reps", "cues": "Sit tall, exhale round forward"},
          {"name": "Seal", "reps": "5 reps", "cues": "Hold ankles, rock back and forward, balance at top"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Pilates Sculpt';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Full roll-up sequence", "reps": "5 reps", "cues": "Slow articulation — feel every vertebra"},
          {"name": "Spine articulation", "duration": "2 min", "cues": "Cat-cow in seated position"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "The Hundred", "reps": "100 beats"},
          {"name": "Roll-up", "reps": "10 reps"},
          {"name": "Leg circles", "reps": "10 each leg"},
          {"name": "Rolling like a ball", "reps": "10 reps"},
          {"name": "Leg stretch series", "reps": "10 each"},
          {"name": "Spine stretch forward", "reps": "5 reps"},
          {"name": "Open leg rocker", "reps": "8 reps", "cues": "Balance at top, hold ankles"},
          {"name": "Corkscrew", "reps": "5 each direction"},
          {"name": "Saw", "reps": "5 each side"},
          {"name": "Swan", "reps": "5 reps"},
          {"name": "Neck pull", "reps": "5 reps"},
          {"name": "Shoulder bridge", "reps": "5 reps"},
          {"name": "Spine twist", "reps": "10 each side"},
          {"name": "Jackknife", "reps": "5 reps", "cues": "Advanced — support lower back with hands if needed"},
          {"name": "Side kicks", "reps": "10 each side"},
          {"name": "Teaser", "reps": "5 reps", "cues": "Hold V at top, breathe"},
          {"name": "Hip circles", "reps": "3 each direction"},
          {"name": "Swimming", "duration": "1 min", "cues": "Flutter arms and legs, opposite limbs"},
          {"name": "Leg pull front", "reps": "5 reps"},
          {"name": "Boomerang", "reps": "5 reps"},
          {"name": "Seal", "reps": "8 reps"},
          {"name": "Push-up series", "reps": "3 sets 5 reps", "cues": "Walk hands out, perform push-ups, walk back"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Forward fold", "duration": "1 min"},
          {"name": "Child''s pose", "duration": "1 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Mat Power Hour';

-- ──────────────────────────────────────────────────────────────────────────────
-- WALKING
-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Easy stroll", "duration": "3 min", "cues": "Let joints warm naturally"},
          {"name": "Leg swings", "duration": "30 sec each leg"},
          {"name": "Ankle circles", "duration": "30 sec each ankle"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Brisk pace walk", "duration": "35 min", "cues": "3–4 mph. Arms swing naturally, purposeful stride. You should feel your heart rate elevated but not breathless"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy walk cool-down", "duration": "2 min"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Brisk Walk 30';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Flat warm-up walk", "duration": "5 min", "cues": "Start at 0% incline, gradually increase to working grade"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "12-3-30 protocol", "duration": "30 min", "cues": "Treadmill: 12% incline, 3 mph. Do NOT hold the rails — that negates the calorie burn. If you must rest, reduce incline not speed"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Flat cool-down walk", "duration": "5 min"},
          {"name": "Calf stretch", "duration": "30 sec each side", "cues": "Your calves work hard on incline — give them attention"},
          {"name": "Hip flexor stretch", "duration": "30 sec each side"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Incline Power Walk';

-- ──────────────────────────────────────────────────────────────────────────────

UPDATE workouts SET instructions = (
  SELECT jsonb_agg(
    elem || CASE (elem->>'step')::int
      WHEN 1 THEN '{
        "is_warmup": true, "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Easy stroll", "duration": "5 min", "cues": "No destination — just move"}
        ]}'::jsonb
      WHEN 2 THEN '{
        "sets": 1, "rest_seconds": 30,
        "exercises": [
          {"name": "Exploration walk", "duration": "65 min", "cues": "Brisk pace, explore new streets or trails. Vary terrain when possible — hills add natural intensity. Stay off your phone and engage with the environment"}
        ]}'::jsonb
      WHEN 3 THEN '{
        "sets": 1,
        "exercises": [
          {"name": "Easy stroll", "duration": "5 min", "cues": "Bring heart rate down, breathe normally"}
        ]}'::jsonb
      ELSE '{}'::jsonb
    END
    ORDER BY (elem->>'step')::int
  )
  FROM jsonb_array_elements(instructions) elem
)
WHERE title = 'Exploration Walk';
