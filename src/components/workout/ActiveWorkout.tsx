'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ActiveWorkout, ProgressionStore, SetLog, ExerciseBlock, Goal, LiveSetLog, CompletedWorkout } from '@/lib/types';
import { addLog } from '@/lib/progressionUtils';
import RestTimer from './RestTimer';

const REST_SECONDS: Record<Goal, number> = {
  strength: 180,
  hypertrophy: 75,
  muscular_endurance: 45,
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

interface Props {
  workout: ActiveWorkout;
  store: ProgressionStore;
  progressionKey: string;
  historyKey: string;
  workoutKey: string;
  onStoreChange: (store: ProgressionStore) => void;
}

interface RestState {
  exerciseId: string;
  setIdx: 0 | 1;
}

export default function ActiveWorkoutView({
  workout,
  store,
  progressionKey,
  historyKey,
  workoutKey,
  onStoreChange,
}: Props) {
  const router = useRouter();
  const { session } = workout;
  const goal: Goal = session.blocks[0]?.exercises[0] ? 'hypertrophy' : 'hypertrophy';

  // Flatten all exercises in order
  const allExercises = session.blocks.flatMap((b) =>
    b.exercises.map((ex) => ({ ...ex, blockType: b.type, blockLabel: b.label }))
  );

  // Live set state: exerciseId → [set1, set2]
  const [sets, setSets] = useState<Record<string, [LiveSetLog, LiveSetLog]>>(() => {
    const init: Record<string, [LiveSetLog, LiveSetLog]> = {};
    for (const ex of allExercises) {
      const prev = store[ex.exerciseId];
      const lastSet = prev?.[prev.length - 1]?.sets;
      const prefill = lastSet?.[0]?.weight?.toString() ?? '';
      init[ex.exerciseId] = [
        { weight: prefill, reps: '', logged: false },
        { weight: prefill, reps: '', logged: false },
      ];
    }
    return init;
  });

  const [resting, setResting] = useState<RestState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  // Workout timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function elapsedStr() {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function updateSet(exerciseId: string, setIdx: 0 | 1, field: 'weight' | 'reps', val: string) {
    setSets((prev) => {
      const pair = [...prev[exerciseId]] as [LiveSetLog, LiveSetLog];
      pair[setIdx] = { ...pair[setIdx], [field]: val };
      return { ...prev, [exerciseId]: pair };
    });
  }

  function logSet(exerciseId: string, setIdx: 0 | 1) {
    setSets((prev) => {
      const pair = [...prev[exerciseId]] as [LiveSetLog, LiveSetLog];
      pair[setIdx] = { ...pair[setIdx], logged: true };
      // Pre-fill set 2 weight if logging set 1
      if (setIdx === 0 && pair[1].weight === '') {
        pair[1] = { ...pair[1], weight: pair[0].weight };
      }
      return { ...prev, [exerciseId]: pair };
    });
    setResting({ exerciseId, setIdx });
  }

  const restDone = useCallback(() => setResting(null), []);

  const maxReps = workout.session.blocks[0]?.exercises[0]?.repRange?.[1] ?? 12;
  const inferredGoal: Goal = maxReps <= 6 ? 'strength' : maxReps <= 12 ? 'hypertrophy' : 'muscular_endurance';
  const restSecs = REST_SECONDS[inferredGoal];

  const allLogged = allExercises.every((ex) => {
    const pair = sets[ex.exerciseId];
    return pair[0].logged && pair[1].logged;
  });

  function finishWorkout() {
    // Save all exercise logs to progression store
    let updatedStore = { ...store };
    for (const ex of allExercises) {
      const pair = sets[ex.exerciseId];
      const setLogs: SetLog[] = pair.map((s) => ({
        weight: s.weight !== '' ? Number(s.weight) : null,
        reps: s.reps !== '' ? Number(s.reps) : null,
      }));
      if (setLogs.some((s) => s.reps !== null)) {
        updatedStore = addLog(updatedStore, ex.exerciseId, setLogs);
      }
    }
    onStoreChange(updatedStore);

    // Save to workout history
    const completedAt = new Date().toISOString();
    const completedWorkout: CompletedWorkout = {
      id: `w_${Date.now()}`,
      day: workout.day,
      sessionLabel: workout.session.label,
      sessionType: workout.session.type,
      startedAt: workout.startedAt,
      completedAt,
      durationMinutes: Math.round(elapsed / 60),
      exercises: allExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: sets[ex.exerciseId].map((s) => ({
          weight: s.weight !== '' ? Number(s.weight) : null,
          reps: s.reps !== '' ? Number(s.reps) : null,
        })),
      })),
    };

    try {
      const existing = JSON.parse(localStorage.getItem(historyKey) ?? '{}');
      localStorage.setItem(historyKey, JSON.stringify({ ...existing, [completedWorkout.id]: completedWorkout }));
      localStorage.removeItem(workoutKey);
    } catch { /* ignore storage errors */ }

    setFinished(true);
  }

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: 'var(--background)' }}>
        <p className="text-5xl font-mono">✓</p>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>Workout Done</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {session.label} · {Math.round(elapsed / 60)} min
          </p>
        </div>
        <button
          onClick={() => router.push('/plan')}
          className="px-8 py-3 text-xs font-black uppercase tracking-widest"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          Back to Plan →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--background)', borderBottom: '1px solid var(--divider)' }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            {DAY_LABELS[workout.day]}
          </p>
          <p className="text-lg font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
            {session.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black tabular-nums" style={{ color: 'var(--foreground)' }}>
            {elapsedStr()}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {allExercises.filter((ex) => sets[ex.exerciseId]?.[1]?.logged).length}/{allExercises.length} done
          </p>
        </div>
      </header>

      {/* Rest timer overlay */}
      {resting && (
        <div className="px-4 pt-4">
          <RestTimer seconds={restSecs} onDone={restDone} />
        </div>
      )}

      {/* Exercises */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {session.blocks.map((block) => (
          <WorkoutBlock
            key={block.id}
            block={block}
            sets={sets}
            store={store}
            resting={resting}
            onUpdateSet={updateSet}
            onLogSet={logSet}
          />
        ))}

        {/* Finish */}
        <div className="pt-4 pb-8">
          <button
            onClick={finishWorkout}
            className="w-full py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-95"
            style={{
              background: allLogged ? 'var(--accent)' : 'var(--card)',
              color: allLogged ? 'var(--accent-fg)' : 'var(--muted)',
              border: `1px solid ${allLogged ? 'var(--accent)' : 'var(--card-border)'}`,
            }}
          >
            {allLogged ? 'Finish Workout ✓' : 'Finish Early'}
          </button>
        </div>
      </main>
    </div>
  );
}

function WorkoutBlock({
  block,
  sets,
  store,
  resting,
  onUpdateSet,
  onLogSet,
}: {
  block: ExerciseBlock;
  sets: Record<string, [LiveSetLog, LiveSetLog]>;
  store: ProgressionStore;
  resting: RestState | null;
  onUpdateSet: (id: string, setIdx: 0 | 1, field: 'weight' | 'reps', val: string) => void;
  onLogSet: (id: string, setIdx: 0 | 1) => void;
}) {
  const isGrouped = block.type !== 'straight';
  const typeLabel = block.type === 'superset' ? 'Superset' : block.type === 'triset' ? 'Triset' : null;

  return (
    <div className="border" style={{ borderColor: isGrouped ? 'var(--foreground)' : 'var(--card-border)', background: 'var(--card)' }}>
      {isGrouped && (
        <div className="px-4 py-2" style={{ background: 'var(--foreground)' }}>
          <p className="text-xs font-black tracking-widest" style={{ color: 'var(--background)' }}>
            {block.label} · {typeLabel}
          </p>
        </div>
      )}
      {block.exercises.map((ex, i) => {
        const pair = sets[ex.exerciseId];
        const prev = store[ex.exerciseId];
        const lastLog = prev?.[prev.length - 1];
        return (
          <div
            key={ex.exerciseId}
            style={{ borderTop: i > 0 ? '1px solid var(--divider)' : undefined }}
          >
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>
                    {ex.exerciseName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Target: 2 × {ex.repRange[0]}–{ex.repRange[1]}
                    {lastLog && (
                      <> · Prev: {lastLog.sets.map(s => s.weight !== null ? `${s.weight}kg×${s.reps}` : `${s.reps}r`).join(', ')}</>
                    )}
                  </p>
                </div>
                {pair?.[0].logged && pair?.[1].logged && (
                  <span className="text-sm font-mono flex-shrink-0" style={{ color: 'var(--muted)' }}>✓</span>
                )}
              </div>
            </div>

            {/* Set rows */}
            {([0, 1] as const).map((setIdx) => {
              const s = pair?.[setIdx];
              if (!s) return null;
              const isResting = resting?.exerciseId === ex.exerciseId && resting?.setIdx === setIdx;
              const prevSetDone = setIdx === 1 && !pair?.[0].logged;
              return (
                <div
                  key={setIdx}
                  className="px-4 py-2 flex items-center gap-2"
                  style={{
                    background: s.logged ? 'var(--muted-bg)' : 'transparent',
                    opacity: prevSetDone ? 0.4 : 1,
                  }}
                >
                  <span className="text-xs font-bold w-10 flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    Set {setIdx + 1}
                  </span>
                  <input
                    type="number" inputMode="decimal" placeholder="kg"
                    value={s.weight}
                    disabled={s.logged || prevSetDone}
                    onChange={(e) => onUpdateSet(ex.exerciseId, setIdx, 'weight', e.target.value)}
                    className="flex-1 px-2 py-2 text-sm text-center border font-mono focus:outline-none disabled:opacity-50"
                    style={{ background: 'var(--background)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>×</span>
                  <input
                    type="number" inputMode="numeric" placeholder="reps"
                    value={s.reps}
                    disabled={s.logged || prevSetDone}
                    onChange={(e) => onUpdateSet(ex.exerciseId, setIdx, 'reps', e.target.value)}
                    className="flex-1 px-2 py-2 text-sm text-center border font-mono focus:outline-none disabled:opacity-50"
                    style={{ background: 'var(--background)', borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                  />
                  {!s.logged ? (
                    <button
                      onClick={() => onLogSet(ex.exerciseId, setIdx)}
                      disabled={s.reps === '' || prevSetDone}
                      className="px-3 py-2 text-xs font-black border transition-all active:scale-95 disabled:opacity-30"
                      style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }}
                    >
                      Log
                    </button>
                  ) : (
                    <span className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--muted)' }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
