'use client';

import { WeeklyPlan, UserInputs } from '@/lib/types';
import DayCard from './DayCard';
import RestDayCard from './RestDayCard';

const GOAL_LABELS: Record<UserInputs['goal'], string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  general_fitness: 'General Fitness',
};

const EQUIPMENT_LABELS: Record<UserInputs['equipment'], string> = {
  full_gym: 'Full Gym',
  dumbbells: 'Dumbbells',
  bodyweight: 'Bodyweight',
};

const FOCUS_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  full_body: 'Full Body',
};

interface Props {
  plan: WeeklyPlan;
}

export default function WeeklyPlanView({ plan }: Props) {
  const { userInputs, days } = plan;
  const trainingDays = days.filter((d) => d.isTrainingDay);

  return (
    <div className="space-y-4">
      {/* Plan summary chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          label={userInputs.focusMuscles.map((f) => FOCUS_LABELS[f]).join(' + ')}
          icon="🎯"
        />
        <Chip label={GOAL_LABELS[userInputs.goal]} icon="📈" />
        <Chip label={EQUIPMENT_LABELS[userInputs.equipment]} icon="🏋️" />
        <Chip label={`${trainingDays.length}×/week`} icon="📅" />
        <Chip label={`${userInputs.sessionDuration} min`} icon="⏱️" />
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {days.map((dayPlan) =>
          dayPlan.isTrainingDay ? (
            <DayCard
              key={dayPlan.day}
              dayPlan={dayPlan}
              goal={userInputs.goal}
            />
          ) : (
            <RestDayCard key={dayPlan.day} day={dayPlan.day} />
          )
        )}
      </div>
    </div>
  );
}

function Chip({ label, icon }: { label: string; icon: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        background: 'var(--muted-bg)',
        color: 'var(--foreground)',
        border: '1px solid var(--card-border)',
      }}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}
