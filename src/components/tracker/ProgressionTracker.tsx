'use client';

import { WeeklyPlan, ProgressionStore, SetLog } from '@/lib/types';
import { addLog, deleteLog } from '@/lib/progressionUtils';
import ExerciseLogCard from './ExerciseLogCard';

interface Props {
  plan: WeeklyPlan;
  store: ProgressionStore;
  onStoreChange: (store: ProgressionStore) => void;
}

interface ExerciseEntry {
  id: string;
  name: string;
  dayLabel: string;
}

export default function ProgressionTracker({ plan, store, onStoreChange }: Props) {
  // Collect all unique exercises across the plan (maintain order)
  const seen = new Set<string>();
  const exercises: ExerciseEntry[] = [];

  for (const dayPlan of plan.days) {
    if (!dayPlan.isTrainingDay || !dayPlan.session) continue;
    const { session } = dayPlan;
    for (const block of session.blocks) {
      for (const ex of block.exercises) {
        if (!seen.has(ex.exerciseId)) {
          seen.add(ex.exerciseId);
          exercises.push({
            id: ex.exerciseId,
            name: ex.exerciseName,
            dayLabel: `${dayPlan.day.charAt(0).toUpperCase() + dayPlan.day.slice(1)} — ${session.label}`,
          });
        }
      }
    }
  }

  const readyCount = exercises.filter((ex) =>
    store[ex.id] &&
    store[ex.id].length > 0 &&
    store[ex.id][store[ex.id].length - 1].sets.every(
      (s) => s.reps !== null
    )
  ).length;

  // Group exercises by session label
  const grouped = new Map<string, ExerciseEntry[]>();
  for (const ex of exercises) {
    const group = grouped.get(ex.dayLabel) ?? [];
    group.push(ex);
    grouped.set(ex.dayLabel, group);
  }

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'var(--muted-bg)',
          border: '1px solid var(--card-border)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
          Double Progression
        </p>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Increase reps each session until you hit the top of the rep range across{' '}
          <strong>both sets</strong>, then increase the weight.
        </p>
        {readyCount > 0 && (
          <div
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}
          >
            <span style={{ color: 'var(--accent)' }}>⬆</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {readyCount} exercise{readyCount > 1 ? 's' : ''} ready to progress
            </span>
          </div>
        )}
      </div>

      {/* Per-session groups */}
      {Array.from(grouped.entries()).map(([sessionLabel, exList]) => (
        <div key={sessionLabel} className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            {sessionLabel}
          </h3>
          {exList.map((ex) => (
            <ExerciseLogCard
              key={ex.id}
              exerciseId={ex.id}
              exerciseName={ex.name}
              logs={store[ex.id] ?? []}
              goal={plan.userInputs.goal}
              onAddLog={(sets: SetLog[]) =>
                onStoreChange(addLog(store, ex.id, sets))
              }
              onDeleteLog={(date: string) =>
                onStoreChange(deleteLog(store, ex.id, date))
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
