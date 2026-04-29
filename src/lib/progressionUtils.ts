import { ExerciseSessionLog, ProgressionStore, SetLog, Goal } from './types';

export function getTopOfRepRange(goal: Goal): number {
  const map: Record<Goal, number> = {
    strength: 6,
    hypertrophy: 12,
    general_fitness: 15,
  };
  return map[goal];
}

export function isReadyToProgress(
  logs: ExerciseSessionLog[],
  goal: Goal
): boolean {
  if (logs.length === 0) return false;
  const latest = logs[logs.length - 1];
  const top = getTopOfRepRange(goal);
  // All sets must have been logged and each must hit the top of range
  return (
    latest.sets.length >= 2 &&
    latest.sets.every(
      (s) => s.reps !== null && s.reps !== undefined && s.reps >= top
    )
  );
}

export function getLatestLog(
  store: ProgressionStore,
  exerciseId: string
): ExerciseSessionLog | null {
  const logs = store[exerciseId];
  if (!logs || logs.length === 0) return null;
  return logs[logs.length - 1];
}

export function addLog(
  store: ProgressionStore,
  exerciseId: string,
  sets: SetLog[]
): ProgressionStore {
  const existing = store[exerciseId] ?? [];
  const today = new Date().toISOString().split('T')[0];
  // Replace today's log if it exists, otherwise append
  const withoutToday = existing.filter((l) => !l.date.startsWith(today));
  return {
    ...store,
    [exerciseId]: [...withoutToday, { date: today, sets }],
  };
}

export function deleteLog(
  store: ProgressionStore,
  exerciseId: string,
  date: string
): ProgressionStore {
  const existing = store[exerciseId] ?? [];
  return {
    ...store,
    [exerciseId]: existing.filter((l) => l.date !== date),
  };
}

export function getPersonalBest(
  logs: ExerciseSessionLog[]
): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null;
  for (const session of logs) {
    for (const set of session.sets) {
      if (set.weight === null || set.reps === null) continue;
      if (!best || set.weight > best.weight) {
        best = { weight: set.weight, reps: set.reps };
      }
    }
  }
  return best;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
