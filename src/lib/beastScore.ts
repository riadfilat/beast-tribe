// Beast Score — consistency-based ranking system

export const BEAST_SCORE_WEIGHTS = {
  workout: 0.30,
  nutrition: 0.25,
  steps: 0.25,
  streakMax: 20,
  eventMax: 15,
} as const;

export interface BeastScoreData {
  workoutDaysActual: number;
  workoutDaysTarget: number;
  nutritionDaysLogged: number;
  totalDays: number;
  stepGoalDaysMet: number;
  currentStreak: number;
  eventsAttended: number;
}

export interface BeastScoreBreakdown {
  score: number;
  workoutConsistency: number;
  nutritionConsistency: number;
  stepConsistency: number;
  streakBonus: number;
  eventBonus: number;
}

export function calculateBeastScore(data: BeastScoreData): BeastScoreBreakdown {
  const { workout, nutrition, steps, streakMax, eventMax } = BEAST_SCORE_WEIGHTS;

  const workoutConsistency = data.workoutDaysTarget > 0
    ? Math.min(100, (data.workoutDaysActual / data.workoutDaysTarget) * 100)
    : 0;

  const nutritionConsistency = data.totalDays > 0
    ? Math.min(100, (data.nutritionDaysLogged / data.totalDays) * 100)
    : 0;

  const stepConsistency = data.totalDays > 0
    ? Math.min(100, (data.stepGoalDaysMet / data.totalDays) * 100)
    : 0;

  const streakBonus = Math.min(data.currentStreak * 2, streakMax);
  const eventBonus = Math.min(data.eventsAttended * 5, eventMax);

  const score =
    (workoutConsistency * workout) +
    (nutritionConsistency * nutrition) +
    (stepConsistency * steps) +
    streakBonus +
    eventBonus;

  return {
    score: Math.round(score * 10) / 10,
    workoutConsistency: Math.round(workoutConsistency),
    nutritionConsistency: Math.round(nutritionConsistency),
    stepConsistency: Math.round(stepConsistency),
    streakBonus: Math.round(streakBonus * 10) / 10,
    eventBonus: Math.round(eventBonus * 10) / 10,
  };
}
