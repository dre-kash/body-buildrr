'use client';

import { useState } from 'react';
import { DayPlan, ExerciseBlock, Goal } from '@/lib/types';
import MuscleTag from './MuscleTag';

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const SESSION_TYPE_COLORS: Record<string, string> = {
  push: '#f97316',
  pull: '#3b82f6',
  legs: '#22c55e',
  upper: '#a855f7',
  lower: '#06b6d4',
  full_body: '#f59e0b',
};

const REST_LABELS: Record<Goal, string> = {
  strength: '3–5 min rest',
  hypertrophy: '60–90s rest',
  general_fitness: '45–60s rest',
};

interface Props {
  dayPlan: DayPlan;
  goal: Goal;
}

export default function DayCard({ dayPlan, goal }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { day, session } = dayPlan;
  if (!session) return null;

  const accentColor = SESSION_TYPE_COLORS[session.type] ?? 'var(--accent)';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Card header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: accentColor }}
          />
          <div>
            <p className="font-black text-base" style={{ color: 'var(--foreground)' }}>
              {DAY_LABELS[day]}
            </p>
            <p className="text-xs font-semibold" style={{ color: accentColor }}>
              {session.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--muted)' }}
            >
              ~{session.estimatedDurationMinutes} min
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {session.blocks.length} block
              {session.blocks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: '1.2rem' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: '1px solid var(--card-border)' }}
        >
          {/* Muscle summary */}
          <div className="pt-3 flex flex-wrap gap-1.5">
            {session.primaryMuscles.slice(0, 5).map((m) => (
              <MuscleTag key={m} muscle={m} variant="primary" />
            ))}
            {session.secondaryMuscles.slice(0, 4).map((m) => (
              <MuscleTag key={m} muscle={m} variant="secondary" />
            ))}
          </div>

          {/* Exercise blocks */}
          <div className="space-y-3">
            {session.blocks.map((block) => (
              <BlockRow key={block.id} block={block} accentColor={accentColor} goal={goal} />
            ))}
          </div>

          {/* Rest note */}
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {REST_LABELS[goal]} between sets
          </p>
        </div>
      )}
    </div>
  );
}

function BlockRow({
  block,
  accentColor,
  goal,
}: {
  block: ExerciseBlock;
  accentColor: string;
  goal: Goal;
}) {
  const isGrouped = block.type !== 'straight';
  const typeLabel =
    block.type === 'superset' ? 'Superset' : block.type === 'triset' ? 'Triset' : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: isGrouped ? `1.5px solid ${accentColor}33` : '1px solid var(--card-border)',
        background: isGrouped ? `${accentColor}08` : 'var(--muted-bg)',
      }}
    >
      {isGrouped && (
        <div
          className="px-3 py-1.5 flex items-center gap-2"
          style={{ background: `${accentColor}18`, borderBottom: `1px solid ${accentColor}33` }}
        >
          <span
            className="text-xs font-black tracking-wide"
            style={{ color: accentColor }}
          >
            {block.label} · {typeLabel}
          </span>
        </div>
      )}

      <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
        {block.exercises.map((ex, i) => (
          <div key={ex.exerciseId} className="flex items-center justify-between px-3 py-2.5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {!isGrouped && (
                <span
                  className="text-xs font-black flex-shrink-0"
                  style={{ color: accentColor }}
                >
                  {block.label}
                </span>
              )}
              {isGrouped && (
                <span
                  className="text-xs font-bold flex-shrink-0 w-5"
                  style={{ color: accentColor }}
                >
                  {block.label}{i + 1}
                </span>
              )}
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--foreground)' }}
                >
                  {ex.exerciseName}
                </p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {ex.primaryMuscles.slice(0, 2).map((m) => (
                    <span
                      key={m}
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      {m.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <span
                className="text-sm font-black"
                style={{ color: 'var(--foreground)' }}
              >
                2 × {ex.repRange[0]}–{ex.repRange[1]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
