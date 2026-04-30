'use client';

import { WeeklyPlan, UserInputs, Exercise, Day } from '@/lib/types';
import DayCard from './DayCard';
import RestDayCard from './RestDayCard';

const GOAL_LABELS: Record<UserInputs['goal'], string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  muscular_endurance: 'Muscular Endurance',
};

const EQUIPMENT_LABELS: Record<UserInputs['equipment'], string> = {
  full_gym: 'Full Gym',
  dumbbells: 'Dumbbells',
  bodyweight: 'Bodyweight',
};

const FOCUS_LABELS: Record<string, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms',
  legs: 'Legs', glutes: 'Glutes', full_body: 'Full Body',
};

interface Props {
  plan: WeeklyPlan;
  userId: string;
  workoutStorageKey: string;
  onSwapExercise: (day: Day, blockId: string, oldExerciseId: string, newExercise: Exercise) => void;
}

export default function WeeklyPlanView({ plan, userId, workoutStorageKey, onSwapExercise }: Props) {
  const { userInputs, days } = plan;
  const trainingCount = days.filter((d) => d.isTrainingDay).length;

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex flex-wrap gap-2 pb-2" style={{ borderBottom: '1px solid var(--divider)' }}>
        {[
          userInputs.focusMuscles.map((f) => FOCUS_LABELS[f]).join(' + '),
          GOAL_LABELS[userInputs.goal],
          EQUIPMENT_LABELS[userInputs.equipment],
          `${trainingCount}×/week`,
          `${userInputs.sessionDuration} min`,
        ].map((label) => (
          <span
            key={label}
            className="text-xs px-2 py-1 border font-bold"
            style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--card)' }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Days */}
      {days.map((dayPlan) =>
        dayPlan.isTrainingDay ? (
          <DayCard
            key={dayPlan.day}
            dayPlan={dayPlan}
            goal={userInputs.goal}
            equipment={userInputs.equipment}
            userId={userId}
            workoutStorageKey={workoutStorageKey}
            onSwapExercise={onSwapExercise}
          />
        ) : (
          <RestDayCard key={dayPlan.day} day={dayPlan.day} />
        )
      )}
    </div>
  );
}
