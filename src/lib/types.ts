export type Goal = 'strength' | 'hypertrophy' | 'muscular_endurance';
export type Equipment = 'full_gym' | 'dumbbells' | 'bodyweight';
export type FocusMuscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'glutes'
  | 'full_body';
export type FocusPriority = 'equal' | 'primary_secondary';
export type Day =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
export type MovementPattern =
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'accessory';
export type Muscle =
  | 'chest'
  | 'front_delt'
  | 'side_delt'
  | 'rear_delt'
  | 'triceps'
  | 'biceps'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'traps';

export type AccessoryCategory =
  | 'biceps'
  | 'triceps'
  | 'side_delt'
  | 'rear_delt'
  | 'core'
  | 'calves'
  | 'glute_iso'
  | 'chest_iso'
  | 'back_iso';

export type SessionType =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full_body';

export interface UserInputs {
  focusMuscles: FocusMuscle[];
  focusPriority: FocusPriority;
  sessionDuration: 30 | 45 | 60 | 75 | 90;
  trainingFrequency: 2 | 3 | 4 | 5;
  trainingDays: Day[];
  goal: Goal;
  equipment: Equipment;
}

export interface Exercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  accessoryCategory?: AccessoryCategory;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  isCompound: boolean;
}

export interface BlockExercise {
  exerciseId: string;
  exerciseName: string;
  pattern: MovementPattern;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  sets: 2;
  repRange: [number, number];
  isCompound: boolean;
}

export interface ExerciseBlock {
  id: string;
  type: 'straight' | 'superset' | 'triset';
  label: string;
  exercises: BlockExercise[];
  restSeconds: number;
}

export interface Session {
  label: string;
  type: SessionType;
  blocks: ExerciseBlock[];
  estimatedDurationMinutes: number;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
}

export interface DayPlan {
  day: Day;
  isTrainingDay: boolean;
  session: Session | null;
}

export interface WeeklyPlan {
  id: string;
  userInputs: UserInputs;
  days: DayPlan[];
  createdAt: string;
}

export interface SetLog {
  weight: number | null;
  reps: number | null;
}

export interface ExerciseSessionLog {
  date: string;
  sets: SetLog[];
}

export interface ProgressionStore {
  [exerciseId: string]: ExerciseSessionLog[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// ─── Active Workout ───────────────────────────────────────────────────────────

export interface LiveSetLog {
  weight: string;
  reps: string;
  logged: boolean;
}

export interface ActiveWorkout {
  userId: string;
  day: Day;
  session: Session;
  startedAt: string;
  sets: Record<string, [LiveSetLog, LiveSetLog]>; // exerciseId → [set1, set2]
}

// ─── Workout History ──────────────────────────────────────────────────────────

export interface CompletedWorkout {
  id: string;
  day: Day;
  sessionLabel: string;
  sessionType: SessionType;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: SetLog[];
  }[];
}

export interface WorkoutHistory {
  [id: string]: CompletedWorkout;
}
