'use client';

import { WeeklyPlan, ProgressionStore, SetLog } from '@/lib/types';
import { addLog, deleteLog } from '@/lib/progressionUtils';
import ExerciseLogCard from './ExerciseLogCard';

interface Props {
  plan: WeeklyPlan;
  store: ProgressionStore;
  onStoreChange: (store: ProgressionStore) => void;
}

interface ExEntry { id: string; name: string; dayLabel: string; }

export default function ProgressionTracker({ plan, store, onStoreChange }: Props) {
  const seen = new Set<string>();
  const exercises: ExEntry[] = [];

  for (const dayPlan of plan.days) {
    if (!dayPlan.isTrainingDay || !dayPlan.session) continue;
    for (const block of dayPlan.session.blocks) {
      for (const ex of block.exercises) {
        if (!seen.has(ex.exerciseId)) {
          seen.add(ex.exerciseId);
          exercises.push({
            id: ex.exerciseId,
            name: ex.exerciseName,
            dayLabel: `${dayPlan.day.charAt(0).toUpperCase() + dayPlan.day.slice(1)} — ${dayPlan.session.label}`,
          });
        }
      }
    }
  }

  const readyCount = exercises.filter((ex) => {
    const logs = store[ex.id];
    return logs?.length > 0 && logs[logs.length - 1].sets.every(s => s.reps !== null);
  }).length;

  const grouped = new Map<string, ExEntry[]>();
  for (const ex of exercises) {
    const g = grouped.get(ex.dayLabel) ?? [];
    g.push(ex);
    grouped.set(ex.dayLabel, g);
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="border p-4" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
          Double Progression
        </p>
        <p className="text-xs" style={{ color: 'var(--foreground)' }}>
          Increase reps each session until both sets hit the top of the rep range, then add weight.
        </p>
        {readyCount > 0 && (
          <div className="mt-3 border px-3 py-2 flex items-center gap-2" style={{ borderColor: 'var(--foreground)' }}>
            <span className="text-sm">↑</span>
            <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
              {readyCount} exercise{readyCount > 1 ? 's' : ''} ready to progress
            </p>
          </div>
        )}
      </div>

      {/* Per session */}
      {Array.from(grouped.entries()).map(([sessionLabel, exList]) => (
        <div key={sessionLabel} className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            {sessionLabel}
          </h3>
          {exList.map((ex) => (
            <ExerciseLogCard
              key={ex.id}
              exerciseId={ex.id}
              exerciseName={ex.name}
              logs={store[ex.id] ?? []}
              goal={plan.userInputs.goal}
              onAddLog={(sets: SetLog[]) => onStoreChange(addLog(store, ex.id, sets))}
              onDeleteLog={(date: string) => onStoreChange(deleteLog(store, ex.id, date))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
