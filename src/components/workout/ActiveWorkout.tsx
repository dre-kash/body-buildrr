'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActiveWorkout,
  ProgressionStore,
  SetLog,
  ExerciseBlock,
  BlockExercise,
  Goal,
  LiveSetLog,
  CompletedWorkout,
  Session,
  Equipment,
  Exercise,
  AccessoryCategory,
  WeeklyPlan,
} from '@/lib/types';
import { addLog } from '@/lib/progressionUtils';
import { getExerciseById } from '@/lib/exercises';
import RestTimer from './RestTimer';
import ExercisePicker from '@/components/shared/ExercisePicker';

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
  planKey: string;
  equipment: Equipment;
  onStoreChange: (store: ProgressionStore) => void;
}

interface RestState {
  exerciseId: string;
  setIdx: 0 | 1;
}

interface SwapRecord {
  originalExId: string;
  newExercise: Exercise;
  blockId: string;
}

interface PickerTarget {
  blockId: string;
  exerciseId: string;
  pattern: BlockExercise['pattern'];
  accessoryCategory?: AccessoryCategory;
}

export default function ActiveWorkoutView({
  workout,
  store,
  progressionKey,
  historyKey,
  workoutKey,
  planKey,
  equipment,
  onStoreChange,
}: Props) {
  const router = useRouter();
  const [session, setSession] = useState<Session>(workout.session);
  const [sets, setSets] = useState<Record<string, [LiveSetLog, LiveSetLog]>>(() => {
    const init: Record<string, [LiveSetLog, LiveSetLog]> = {};
    for (const block of workout.session.blocks) {
      for (const ex of block.exercises) {
        const prev = store[ex.exerciseId];
        const lastSet = prev?.[prev.length - 1]?.sets;
        const prefill = lastSet?.[0]?.weight?.toString() ?? '';
        init[ex.exerciseId] = [
          { weight: prefill, reps: '', logged: false },
          { weight: prefill, reps: '', logged: false },
        ];
      }
    }
    return init;
  });

  const [swaps, setSwaps] = useState<Record<string, SwapRecord>>({});
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [resting, setResting] = useState<RestState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [swapPending, setSwapPending] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const allExercises = session.blocks.flatMap((b) =>
    b.exercises.map((ex) => ({ ...ex, blockId: b.id, blockType: b.type, blockLabel: b.label }))
  );

  const usedIds = allExercises.map((ex) => ex.exerciseId);

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
    return pair?.[0].logged && pair?.[1].logged;
  });

  // ── Exercise swapping ────────────────────────────────────────────────────────

  function openPicker(blockId: string, ex: BlockExercise) {
    const fullEx = getExerciseById(ex.exerciseId);
    setPickerTarget({
      blockId,
      exerciseId: ex.exerciseId,
      pattern: ex.pattern,
      accessoryCategory: fullEx?.accessoryCategory,
    });
  }

  function handlePickerSelect(newExercise: Exercise) {
    if (!pickerTarget) return;
    const { blockId, exerciseId: oldId } = pickerTarget;

    // Update session blocks
    setSession((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          exercises: block.exercises.map((ex): BlockExercise => {
            if (ex.exerciseId !== oldId) return ex;
            return {
              exerciseId: newExercise.id,
              exerciseName: newExercise.name,
              pattern: newExercise.pattern,
              primaryMuscles: newExercise.primaryMuscles,
              secondaryMuscles: newExercise.secondaryMuscles,
              sets: ex.sets,
              repRange: ex.repRange,
              isCompound: newExercise.isCompound,
            };
          }),
        };
      }),
    }));

    // Transfer set state: pre-fill from store for new exercise, fall back to old data
    setSets((prev) => {
      const oldData = prev[oldId] ?? [
        { weight: '', reps: '', logged: false },
        { weight: '', reps: '', logged: false },
      ];
      const newPrev = store[newExercise.id];
      const newLastSet = newPrev?.[newPrev.length - 1]?.sets;
      const prefill = newLastSet?.[0]?.weight?.toString() ?? oldData[0].weight;
      const updated = { ...prev };
      delete updated[oldId];
      updated[newExercise.id] = [
        { weight: prefill, reps: '', logged: false },
        { weight: prefill, reps: '', logged: false },
      ];
      return updated;
    });

    // Record swap
    setSwaps((prev) => ({
      ...prev,
      [oldId]: { originalExId: oldId, newExercise, blockId },
    }));

    setPickerTarget(null);
  }

  // ── Finish ───────────────────────────────────────────────────────────────────

  function finishWorkout() {
    let updatedStore = { ...store };
    for (const ex of allExercises) {
      const pair = sets[ex.exerciseId];
      if (!pair) continue;
      const setLogs: SetLog[] = pair.map((s) => ({
        weight: s.weight !== '' ? Number(s.weight) : null,
        reps: s.reps !== '' ? Number(s.reps) : null,
      }));
      if (setLogs.some((s) => s.reps !== null)) {
        updatedStore = addLog(updatedStore, ex.exerciseId, setLogs);
      }
    }
    onStoreChange(updatedStore);

    const completedAt = new Date().toISOString();
    const completedWorkout: CompletedWorkout = {
      id: `w_${Date.now()}`,
      day: workout.day,
      sessionLabel: session.label,
      sessionType: session.type,
      startedAt: workout.startedAt,
      completedAt,
      durationMinutes: Math.round(elapsed / 60),
      exercises: allExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: (sets[ex.exerciseId] ?? []).map((s) => ({
          weight: s.weight !== '' ? Number(s.weight) : null,
          reps: s.reps !== '' ? Number(s.reps) : null,
        })),
      })),
    };

    try {
      const existing = JSON.parse(localStorage.getItem(historyKey) ?? '{}');
      localStorage.setItem(historyKey, JSON.stringify({ ...existing, [completedWorkout.id]: completedWorkout }));
      localStorage.removeItem(workoutKey);
    } catch { /* ignore */ }

    setFinished(true);
    if (Object.keys(swaps).length > 0) setSwapPending(true);
  }

  function handleKeepSwaps() {
    try {
      const raw = localStorage.getItem(planKey);
      if (raw) {
        const plan: WeeklyPlan = JSON.parse(raw);
        const updatedPlan: WeeklyPlan = {
          ...plan,
          days: plan.days.map((d) => {
            if (d.day !== workout.day || !d.session) return d;
            return {
              ...d,
              session: {
                ...d.session,
                blocks: d.session.blocks.map((block) => ({
                  ...block,
                  exercises: block.exercises.map((ex): BlockExercise => {
                    const swap = swaps[ex.exerciseId];
                    if (!swap) return ex;
                    const ne = swap.newExercise;
                    return {
                      exerciseId: ne.id,
                      exerciseName: ne.name,
                      pattern: ne.pattern,
                      primaryMuscles: ne.primaryMuscles,
                      secondaryMuscles: ne.secondaryMuscles,
                      sets: ex.sets,
                      repRange: ex.repRange,
                      isCompound: ne.isCompound,
                    };
                  }),
                })),
              },
            };
          }),
        };
        localStorage.setItem(planKey, JSON.stringify(updatedPlan));
      }
    } catch { /* ignore */ }
    setSwapPending(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (finished && swapPending) {
    const swapList = Object.values(swaps);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
              You changed {swapList.length} exercise{swapList.length > 1 ? 's' : ''}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Keep these changes for next week, or revert to your original plan?
            </p>
          </div>

          <div className="border space-y-0" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
            {swapList.map((swap, i) => (
              <div
                key={swap.originalExId}
                className="px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid var(--divider)' : undefined }}
              >
                <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                  {swap.newExercise.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  replaces original exercise
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handleKeepSwaps}
            className="w-full py-3 text-xs font-black uppercase tracking-widest"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Keep Changes Permanently
          </button>
          <button
            onClick={() => setSwapPending(false)}
            className="w-full py-3 text-xs font-bold border uppercase tracking-widest"
            style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--card)' }}
          >
            This Session Only — Keep Original Plan
          </button>
        </div>
      </div>
    );
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
    <>
      {pickerTarget && (
        <ExercisePicker
          currentPattern={pickerTarget.pattern}
          currentAccessoryCategory={pickerTarget.accessoryCategory}
          equipment={equipment}
          usedIds={usedIds.filter((id) => id !== pickerTarget.exerciseId)}
          onSelect={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}

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

        {resting && (
          <div className="px-4 pt-4">
            <RestTimer seconds={restSecs} onDone={restDone} />
          </div>
        )}

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
              onChangePick={(ex) => openPicker(block.id, ex)}
            />
          ))}

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
    </>
  );
}

function WorkoutBlock({
  block,
  sets,
  store,
  resting,
  onUpdateSet,
  onLogSet,
  onChangePick,
}: {
  block: ExerciseBlock;
  sets: Record<string, [LiveSetLog, LiveSetLog]>;
  store: ProgressionStore;
  resting: RestState | null;
  onUpdateSet: (id: string, setIdx: 0 | 1, field: 'weight' | 'reps', val: string) => void;
  onLogSet: (id: string, setIdx: 0 | 1) => void;
  onChangePick: (ex: BlockExercise) => void;
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
                <div className="flex-1 min-w-0">
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pair?.[0].logged && pair?.[1].logged && (
                    <span className="text-sm font-mono" style={{ color: 'var(--muted)' }}>✓</span>
                  )}
                  <button
                    onClick={() => onChangePick(ex)}
                    className="text-xs font-bold px-2 py-1 border"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--background)' }}
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

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
