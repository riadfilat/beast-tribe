// Badminton: explosive lunges to the net, jumps for the smash, rapid changes of direction, overhead
// shoulders that stay healthy, and calves and ankles that take the load. 4 beginner, 4 intermediate, 4 advanced.
const { item, block, reps, sets, secs, mins, meters, perSide, WARM, MAIN, COOL } = require('../kit');

const warmCourt = (minutes = 6) => block(WARM, 'flow', { minutes }, [
  item('jumping_jack', secs(45)),
  item('arm_circles', secs(30)),
  item('ankle_mobility', perSide(['8', '8'])),
  item('reverse_lunge', perSide(['5', '5'])),
  item('quick_feet', secs(20)),
]);
const coolLegs = block(COOL, 'flow', { minutes: 5 }, [
  item('quad_stretch', perSide(secs(30))),
  item('hip_flexor_stretch', perSide(secs(30))),
  item('hamstring_stretch', perSide(secs(30))),
  item('calf_stretch', perSide(secs(45))),
]);
const coolUpper = block(COOL, 'flow', { minutes: 4 }, [
  item('lat_stretch', perSide(secs(30))),
  item('chest_stretch', secs(30)),
  item('childs_pose', secs(45)),
]);

module.exports = [
  // ───── Beginner ─────
  {
    key: 'badminton-net-lunge-basics', level: 'beginner', format: 'rounds', minutes: 22, equipment: [],
    title: ['Net Lunge Basics', 'أساسيات الطعن نحو الشبكة'],
    desc: ['Learn a strong, stable lunge for reaching the net, and push back out of it. Bodyweight only.', 'تعلّم طعنًا قويًا وثابتًا للوصول إلى الشبكة، ثم ادفع للعودة منه. بوزن الجسم فقط.'],
    blocks: [
      warmCourt(5),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('split_squat', perSide(['8', '8']), ['Front knee tracks over the toes', 'الركبة الأمامية فوق أصابع القدم']),
        item('reverse_lunge', perSide(['8', '8'])),
        item('glute_bridge', reps('12')),
        item('calf_raise', reps('15')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'badminton-spring-ankles', level: 'beginner', format: 'rounds', minutes: 18, equipment: [],
    title: ['Spring Ankles', 'كاحلان نابضان'],
    desc: ['Calves and ankles that can take hundreds of quick pushes and landings. Simple and low impact.', 'سمانة وكاحلان يتحمّلان مئات الدفعات والهبوطات السريعة. بسيط وقليل الضغط على المفاصل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('ankle_mobility', perSide(['10', '10'])), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'rounds', { rounds: 3, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('calf_raise', reps('15'), ['Up fast, down slowly', 'اصعد بسرعة وانزل ببطء']),
        item('single_leg_calf_raise', perSide(['8', '8']), ['Hold a wall for balance', 'استند إلى حائط للتوازن']),
        item('quick_feet', secs(20)),
        item('wall_sit', secs(30)),
      ]),
      block(COOL, 'flow', { minutes: 4 }, [item('calf_stretch', perSide(secs(45))), item('quad_stretch', perSide(secs(30)))]),
    ],
  },
  {
    key: 'badminton-overhead-care', level: 'beginner', format: 'rounds', minutes: 16, equipment: ['band', 'dumbbells'],
    title: ['Overhead Shoulder Care', 'العناية بالكتف للضربات العلوية'],
    desc: ['Keeps the shoulder happy for clears and smashes. Light and slow; good before play or on rest days.', 'يحافظ على صحة الكتف في الضربات الخلفية والساحقة. خفيف وبطيء، مناسب قبل اللعب أو في أيام الراحة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 3 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('cat_cow', reps('6'))]),
      block(MAIN, 'rounds', { rounds: 2, note: ['Light band and weights · rest 60 s between rounds', 'شريط وأوزان خفيفة · راحة 60 ث بين الجولات'] }, [
        item('band_pull_apart', reps('15')),
        item('lateral_raise', reps('10'), ['Stop at shoulder height', 'توقف عند مستوى الكتف']),
        item('thoracic_rotation', perSide(['6', '6'])),
        item('knee_plank', secs(30)),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'badminton-corner-footwork', level: 'beginner', format: 'intervals', minutes: 18, equipment: [],
    title: ['Corner Footwork Start', 'بداية التنقل بين الزوايا'],
    desc: ['Forward to the net, sideways across the court, back to the centre. Short bursts at an easy pace.', 'إلى الأمام نحو الشبكة، ثم جانبًا عبر الملعب، ثم العودة إلى المنتصف. دفعات قصيرة بإيقاع سهل.'],
    blocks: [
      block(WARM, 'flow', { minutes: 4 }, [item('march', mins(1)), item('step_jack', secs(45)), item('leg_swings', perSide(['8', '8']))]),
      block(MAIN, 'intervals', { rounds: 5, note: ['Easy pace; walk to recover', 'إيقاع سهل، وامشِ للاستشفاء'] }, [
        item('shuttle_run', secs(15)),
        item('lateral_shuffle', secs(15)),
        item('walk', secs(45)),
      ]),
      coolLegs,
    ],
  },

  // ───── Intermediate ─────
  {
    key: 'badminton-lunge-recover', level: 'intermediate', format: 'rounds', minutes: 30, equipment: [],
    title: ['Lunge and Recover', 'اطعن وعُد'],
    desc: ['Deep lunges forward and to the side, then a fast push back to the middle, round after round.', 'طعن عميق إلى الأمام والجانب، ثم دفع سريع للعودة إلى المنتصف، جولة بعد جولة.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 60 s between rounds', 'راحة 60 ث بين الجولات'] }, [
        item('walking_lunge', perSide(['10', '10'])),
        item('lateral_lunge', perSide(['8', '8']), ['Push back hard to standing', 'ادفع بقوة للعودة إلى الوقوف']),
        item('skater_jump', perSide(['6', '6'])),
        item('single_leg_calf_raise', perSide(['12', '12'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'badminton-smash-jumps', level: 'intermediate', format: 'rounds', minutes: 30, equipment: ['box', 'med_ball'],
    title: ['Smash Jumps', 'قفزات الضربة الساحقة'],
    desc: ['Jump high, reach overhead, land softly. Builds the spring and the landing behind a jump smash.', 'اقفز عاليًا، وامتد فوق رأسك، واهبط بنعومة. يبني النابض والهبوط اللذين يقفان خلف الضربة الساحقة بالقفز.'],
    blocks: [
      block(WARM, 'flow', { minutes: 6 }, [item('jumping_jack', secs(45)), item('arm_circles', secs(30)), item('air_squat', reps('10')), item('calf_raise', reps('12'))]),
      block(MAIN, 'rounds', { rounds: 4, note: ['Rest 90 s between rounds · quality jumps only', 'راحة 90 ث بين الجولات · قفزات جيدة فقط'] }, [
        item('box_jump', reps('5'), ['Step down', 'انزل خطوة خطوة']),
        item('med_ball_slam', reps('8'), ['Reach high like a smash', 'امتد عاليًا مثل الساحقة']),
        item('jump_squat', reps('6'), ['Land quietly', 'اهبط بهدوء']),
        item('single_leg_calf_raise', perSide(['10', '10'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'badminton-overhead-strength', level: 'intermediate', format: 'strength', minutes: 38, equipment: ['dumbbells', 'cable', 'bench'],
    title: ['Overhead Strength', 'قوة الضربات العلوية'],
    desc: ['Balanced strength for pushing and pulling overhead, so clears and smashes stay strong late in the match.', 'قوة متوازنة للدفع والسحب فوق الرأس، لتبقى الضربات الخلفية والساحقة قوية حتى آخر المباراة.'],
    blocks: [
      block(WARM, 'flow', { minutes: 5 }, [item('shoulder_rolls', secs(30)), item('arm_circles', secs(30)), item('thoracic_rotation', perSide(['6', '6'])), item('incline_push_up', reps('8'))]),
      block(MAIN, 'strength', {}, [
        item('overhead_press', sets(3, '8'), ['2 reps left in the tank · rest 90 s', 'اترك تكرارين · راحة 90 ث']),
        item('lat_pulldown', sets(3, '10'), ['Rest 60 s', 'راحة 60 ث']),
        item('dumbbell_row', sets(3, '10 / side'), ['Rest 60 s', 'راحة 60 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      block(['Core', 'الجذع'], 'rounds', { rounds: 2, note: ['Rest 30 s between rounds', 'راحة 30 ث بين الجولات'] }, [
        item('side_plank', perSide(secs(30))),
      ]),
      coolUpper,
    ],
  },
  {
    key: 'badminton-footwork-intervals', level: 'intermediate', format: 'intervals', minutes: 28, equipment: ['jump_rope'],
    title: ['Footwork Intervals', 'فترات حركة القدمين'],
    desc: ['Rope for light, springy feet, then sharp changes of direction. For players who feel slow to the shuttle.', 'الحبل لقدمين خفيفتين ونابضتين، ثم تغييرات حادة في الاتجاه. للاعبين الذين يشعرون بالبطء نحو الريشة.'],
    blocks: [
      warmCourt(),
      block(MAIN, 'intervals', { rounds: 8, note: ['Walk to recover between rounds', 'امشِ للاستشفاء بين الجولات'] }, [
        item('jump_rope', secs(40)),
        item('shuttle_run', secs(20)),
        item('walk', secs(40)),
      ]),
      coolLegs,
    ],
  },

  // ───── Advanced ─────
  {
    key: 'badminton-rally-minutes', level: 'advanced', format: 'emom', minutes: 36, equipment: [],
    title: ['Rally Minutes', 'دقائق التبادل'],
    desc: ['Twenty-four minutes, a new move every minute: lunges, jumps and shuttles, the way a hard rally feels.', 'أربع وعشرون دقيقة، حركة جديدة كل دقيقة: طعن وقفز وجري مكوكي، كما يبدو تبادل صعب.'],
    blocks: [
      warmCourt(7),
      block(MAIN, 'emom', { minutes: 24, note: ['Finish the work, rest what is left of the minute', 'أنهِ الحركة وارتح ما تبقّى من الدقيقة'] }, [
        item('lunge_jump', perSide(['6', '6'])),
        item('shuttle_run', secs(30)),
        item('jump_squat', reps('10')),
        item('lateral_shuffle', secs(30)),
        item('burpee', reps('8')),
        item('skater_jump', perSide(['8', '8'])),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'badminton-jump-strength', level: 'advanced', format: 'strength', minutes: 55, equipment: ['box', 'barbell', 'rack', 'dumbbells'],
    title: ['Jump Strength', 'قوة القفز'],
    desc: ['Jumps while fresh, then heavy squats and step-ups. Higher smashes, faster pushes off the back foot.', 'قفزات وأنت نشيط، ثم سكوات وصعود بأوزان ثقيلة. ضربات ساحقة أعلى ودفع أسرع من القدم الخلفية.'],
    blocks: [
      block(WARM, 'flow', { minutes: 8 }, [item('easy_jog', mins(3)), item('leg_swings', perSide(['10', '10'])), item('air_squat', reps('10')), item('skips', meters(20))]),
      block(['Power', 'القوة الانفجارية'], 'strength', { note: ['Full rest: every jump should be your best', 'راحة كاملة: كل قفزة يجب أن تكون أفضل ما لديك'] }, [
        item('box_jump', sets(5, '3'), ['Step down · rest 90 s', 'انزل خطوة خطوة · راحة 90 ث']),
        item('skater_jump', sets(3, '5 / side'), ['Stick each landing · rest 60 s', 'ثبّت كل هبوط · راحة 60 ث']),
      ]),
      block(['Strength', 'القوة'], 'strength', {}, [
        item('back_squat', sets(4, '5'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('step_up', sets(3, '6 / side'), ['Hold dumbbells · rest 90 s', 'احمل الدمبل · راحة 90 ث']),
        item('single_leg_calf_raise', sets(3, '15 / side'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'badminton-deciding-game', level: 'advanced', format: 'for_time', minutes: 36, equipment: ['jump_rope', 'wall_ball'],
    title: ['Deciding Game', 'الشوط الحاسم'],
    desc: ['Five rounds against the clock. Lunge, jump and reach overhead with tired legs, like the end of the third game.', 'خمس جولات ضد الوقت. اطعن واقفز وامتد فوق رأسك بساقين متعبتين، كما في نهاية الشوط الثالث.'],
    blocks: [
      warmCourt(7),
      block(['For time', 'ضد الوقت'], 'for_time', { minutes: 20, rounds: 5, note: ['5 rounds, 20 min cap. Write down your time.', '5 جولات، الحد 20 د. سجّل وقتك.'] }, [
        item('shuttle_run', meters(60)),
        item('lunge_jump', perSide(['6', '6'])),
        item('jump_rope', secs(45)),
        item('wall_ball', reps('10')),
      ]),
      coolLegs,
    ],
  },
  {
    key: 'badminton-smash-shoulder-strength', level: 'advanced', format: 'strength', minutes: 50, equipment: ['band', 'pull_up_bar', 'dumbbells', 'barbell', 'cable'],
    title: ['Smash Shoulder Strength', 'قوة كتف الساحقة'],
    desc: ['Heavy pulling and pressing with shoulder-care work, so you can smash hard all season without pain.', 'سحب ودفع بأوزان ثقيلة مع حركات للعناية بالكتف، لتضرب بقوة طوال الموسم دون ألم.'],
    blocks: [
      block(WARM, 'flow', { minutes: 7 }, [item('jumping_jack', mins(1)), item('band_pull_apart', reps('15')), item('thoracic_rotation', perSide(['6', '6'])), item('pike_push_up', reps('6'))]),
      block(MAIN, 'strength', {}, [
        item('pull_up', sets(4, '5–8'), ['Rest 2 min', 'راحة 2 د']),
        item('push_press', sets(4, '6'), ['1–2 reps left in the tank · rest 2 min', 'اترك تكرارًا أو اثنين · راحة 2 د']),
        item('barbell_row', sets(3, '8'), ['Rest 90 s', 'راحة 90 ث']),
        item('face_pull', sets(3, '15'), ['Rest 45 s', 'راحة 45 ث']),
      ]),
      block(['Finisher', 'الختام'], 'rounds', { rounds: 3, note: ['Rest 45 s between rounds', 'راحة 45 ث بين الجولات'] }, [
        item('hanging_knee_raise', reps('10')),
        item('hollow_hold', secs(30)),
      ]),
      coolUpper,
    ],
  },
];
