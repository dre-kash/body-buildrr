'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayPlan, ExerciseBlock, BlockExercise, Exercise, Goal, Equipment, ActiveWorkout, AccessoryCategory, Day } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';
import MuscleTag from './MuscleTag';
import ExercisePicker from '@/components/shared/ExercisePicker';

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const REST_LABELS: Record<Goal, string> = {
  strength: '3–5 min rest',
  hypertrophy: '60–90s rest',
  muscular_endurance: '45s rest',
};

interface PickerTarget {
  blockId: string;
  exerciseId: string;
  pattern: BlockExercise['pattern'];
  accessoryCategory?: AccessoryCategory;
}

interface Props {
  dayPlan: DayPlan;
  goal: Goal;
  equipment: Equipment;
  userId: string;
  workoutStorageKey: string;
  onSwapExercise: (day: Day, blockId: string, oldExerciseId: string, newExercise: Exercise) => void;
}

export default function DayCard({ dayPlan, goal, equipment, userId, workoutStorageKey, onSwapExercise }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const { day, session } = dayPlan;
  if (!session) return null;

  // Collect all exerciseIds currently in the session for the picker's exclusion list
  const usedIds = session.blocks.flatMap((b) => b.exercises.map((ex) => ex.exerciseId));

  function startWorkout() {
    const activeWorkout: ActiveWorkout = {
      userId,
      day,
      session: session!,
      startedAt: new Date().toISOString(),
      sets: {},
      equipment,
    };
    localStorage.setItem(workoutStorageKey, JSON.stringify(activeWorkout));
    router.push('/workout');
  }

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
    onSwapExercise(day, pickerTarget.blockId, pickerTarget.exerciseId, newExercise);
    setPickerTarget(null);
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

      <div
        className="border overflow-hidden"
        style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
      >
        {/* Header */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          onClick={() => setExpanded((e) => !e)}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              {DAY_LABELS[day]}
            </p>
            <p className="text-base font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
              {session.label}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              ~{session.estimatedDurationMinutes}m
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </button>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--divider)' }}>
            {/* Muscles */}
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
              {session.primaryMuscles.slice(0, 5).map((m) => (
                <MuscleTag key={m} muscle={m} variant="primary" />
              ))}
              {session.secondaryMuscles.slice(0, 4).map((m) => (
                <MuscleTag key={m} muscle={m} variant="secondary" />
              ))}
            </div>

            {/* Blocks */}
            <div className="px-4 pb-3 space-y-2">
              {session.blocks.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  onChangePick={(ex) => openPicker(block.id, ex)}
                />
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--divider)' }}
            >
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {REST_LABELS[goal]}
              </p>
              <button
                onClick={startWorkout}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                ▶ Start
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function BlockRow({
  block,
  onChangePick,
}: {
  block: ExerciseBlock;
  onChangePick: (ex: BlockExercise) => void;
}) {
  const isGrouped = block.type !== 'straight';
  const typeLabel = block.type === 'superset' ? 'SS' : block.type === 'triset' ? 'TS' : null;

  return (
    <div
      className="border"
      style={{
        borderColor: isGrouped ? 'var(--foreground)' : 'var(--divider)',
        background: 'var(--background)',
      }}
    >
      {isGrouped && (
        <div
          className="px-3 py-1 flex items-center gap-2"
          style={{ background: 'var(--foreground)', borderBottom: '1px solid var(--divider)' }}
        >
          <span className="text-xs font-black tracking-widest" style={{ color: 'var(--background)' }}>
            {block.label} · {typeLabel}
          </span>
        </div>
      )}

      {block.exercises.map((ex, i) => (
        <div
          key={ex.exerciseId}
          className="flex items-center justify-between px-3 py-2 gap-3"
          style={{ borderTop: i > 0 ? '1px solid var(--divider)' : undefined }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!isGrouped && (
              <span className="text-xs font-black flex-shrink-0" style={{ color: 'var(--muted)' }}>
                {block.label}
              </span>
            )}
            {isGrouped && (
              <span className="text-xs font-bold flex-shrink-0 w-5" style={{ color: 'var(--muted)' }}>
                {block.label}{i + 1}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>
                {ex.exerciseName}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {ex.primaryMuscles.slice(0, 2).map((m) => m.replace(/_/g, ' ')).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs font-black" style={{ color: 'var(--foreground)' }}>
              2 × {ex.repRange[0]}–{ex.repRange[1]}
            </span>
            <button
              onClick={() => onChangePick(ex)}
              className="text-xs font-bold px-2 py-1 border"
              style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--background)' }}
            >
              Change
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
