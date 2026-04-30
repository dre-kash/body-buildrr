'use client';

import { useMemo } from 'react';
import { WeeklyPlan, WorkoutHistory, Muscle } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';

// ─── Muscle group display config ─────────────────────────────────────────────

const MUSCLE_GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: 'Chest',      muscles: ['chest'] },
  { label: 'Lats',       muscles: ['lats'] },
  { label: 'Upper Back', muscles: ['upper_back'] },
  { label: 'Front Delt', muscles: ['front_delt'] },
  { label: 'Side Delt',  muscles: ['side_delt'] },
  { label: 'Rear Delt',  muscles: ['rear_delt'] },
  { label: 'Biceps',     muscles: ['biceps'] },
  { label: 'Triceps',    muscles: ['triceps'] },
  { label: 'Quads',      muscles: ['quads'] },
  { label: 'Hamstrings', muscles: ['hamstrings'] },
  { label: 'Glutes',     muscles: ['glutes'] },
  { label: 'Core',       muscles: ['core'] },
  { label: 'Calves',     muscles: ['calves'] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcPlannedVolume(plan: WeeklyPlan): Record<string, number> {
  const vol: Record<string, number> = {};
  for (const day of plan.days) {
    if (!day.isTrainingDay || !day.session) continue;
    for (const block of day.session.blocks) {
      for (const ex of block.exercises) {
        for (const muscle of ex.primaryMuscles) {
          vol[muscle] = (vol[muscle] ?? 0) + ex.sets;
        }
      }
    }
  }
  return vol;
}

function calcCompletedVolume(history: WorkoutHistory): Record<string, number> {
  const vol: Record<string, number> = {};
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const workout of Object.values(history)) {
    if (new Date(workout.completedAt).getTime() < cutoff) continue;
    for (const ex of workout.exercises) {
      const fullEx = getExerciseById(ex.exerciseId);
      if (!fullEx) continue;
      const doneSets = ex.sets.filter((s) => s.reps !== null).length;
      if (doneSets === 0) continue;
      for (const muscle of fullEx.primaryMuscles) {
        vol[muscle] = (vol[muscle] ?? 0) + doneSets;
      }
    }
  }
  return vol;
}

function countSessionsThisWeek(history: WorkoutHistory): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return Object.values(history).filter(
    (w) => new Date(w.completedAt).getTime() >= cutoff
  ).length;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  plan: WeeklyPlan;
  history: WorkoutHistory;
  userName: string;
}

export default function Dashboard({ plan, history, userName }: Props) {
  const planned = useMemo(() => calcPlannedVolume(plan), [plan]);
  const completed = useMemo(() => calcCompletedVolume(history), [history]);
  const sessionsThisWeek = useMemo(() => countSessionsThisWeek(history), [history]);

  const trainingDays = plan.days.filter((d) => d.isTrainingDay).length;

  // Only show muscle groups that appear in the planned programme
  const activeGroups = MUSCLE_GROUPS.filter((g) =>
    g.muscles.some((m) => (planned[m] ?? 0) > 0)
  );

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div
        className="border p-4"
        style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
      >
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
          Overview
        </p>
        <p className="text-base font-black" style={{ color: 'var(--foreground)' }}>
          {userName}
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-2xl font-black tabular-nums" style={{ color: 'var(--foreground)' }}>
              {sessionsThisWeek}
              <span className="text-sm font-bold text-sm" style={{ color: 'var(--muted)' }}>
                /{trainingDays}
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>sessions this week</p>
          </div>
        </div>
      </div>

      {/* Volume table */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          Weekly Volume — Sets per muscle
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          Planned = programme target · Done = logged in the last 7 days
        </p>

        <div
          className="border divide-y"
          style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
        >
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto] px-4 py-2 gap-4">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Muscle
            </span>
            <span className="text-xs font-black uppercase tracking-widest w-14 text-right" style={{ color: 'var(--muted)' }}>
              Planned
            </span>
            <span className="text-xs font-black uppercase tracking-widest w-14 text-right" style={{ color: 'var(--muted)' }}>
              Done
            </span>
          </div>

          {activeGroups.map((group) => {
            const plannedSets = group.muscles.reduce((sum, m) => sum + (planned[m] ?? 0), 0);
            const doneSets = group.muscles.reduce((sum, m) => sum + (completed[m] ?? 0), 0);
            const pct = plannedSets > 0 ? Math.min(doneSets / plannedSets, 1) : 0;
            const over = doneSets > plannedSets;

            return (
              <div
                key={group.label}
                className="px-4 py-3 grid grid-cols-[1fr_auto_auto] gap-4 items-center"
                style={{ borderColor: 'var(--divider)' }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                    {group.label}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1 w-full" style={{ background: 'var(--divider)' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct * 100}%`,
                        background: over ? 'var(--foreground)' : 'var(--foreground)',
                        opacity: over ? 1 : pct > 0 ? 0.7 : 0.2,
                      }}
                    />
                  </div>
                </div>
                <span
                  className="text-xs font-black tabular-nums w-14 text-right"
                  style={{ color: 'var(--muted)' }}
                >
                  {plannedSets}
                </span>
                <span
                  className="text-xs font-black tabular-nums w-14 text-right"
                  style={{
                    color: doneSets === 0
                      ? 'var(--muted)'
                      : over
                      ? 'var(--foreground)'
                      : 'var(--foreground)',
                  }}
                >
                  {doneSets > 0 ? doneSets : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <RecentSessions history={history} />
    </div>
  );
}

function RecentSessions({ history }: { history: WorkoutHistory }) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = Object.values(history)
    .filter((w) => new Date(w.completedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (recent.length === 0) {
    return (
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
          Recent Sessions
        </p>
        <div
          className="border px-4 py-6 text-center"
          style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            No sessions completed this week. Start a workout from the Weekly Plan tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
        Recent Sessions
      </p>
      <div
        className="border divide-y"
        style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
      >
        {recent.map((w) => {
          const date = new Date(w.completedAt);
          const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
          const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const totalSets = w.exercises.reduce(
            (sum, ex) => sum + ex.sets.filter((s) => s.reps !== null).length,
            0
          );
          return (
            <div
              key={w.id}
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderColor: 'var(--divider)' }}
            >
              <div>
                <p className="text-xs font-black" style={{ color: 'var(--foreground)' }}>
                  {w.sessionLabel}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {dayName} {dateStr} · {w.durationMinutes} min · {totalSets} sets
                </p>
              </div>
              <span className="text-sm font-mono" style={{ color: 'var(--muted)' }}>✓</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
