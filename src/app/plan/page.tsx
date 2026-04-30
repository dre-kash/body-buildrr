'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, storageKey } from '@/lib/auth';
import { WeeklyPlan, ProgressionStore, WorkoutHistory, User, Exercise, Day, BlockExercise } from '@/lib/types';
import WeeklyPlanView from '@/components/plan/WeeklyPlan';
import ProgressionTracker from '@/components/tracker/ProgressionTracker';
import Dashboard from '@/components/dashboard/Dashboard';

type Tab = 'overview' | 'plan' | 'tracker';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  plan: 'Weekly Plan',
  tracker: 'Progression',
};

export default function PlanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [store, setStore] = useState<ProgressionStore>({});
  const [history, setHistory] = useState<WorkoutHistory>({});
  const [tab, setTab] = useState<Tab>('overview');
  const [planKey, setPlanKey] = useState('');
  const [progressionKey, setProgressionKey] = useState('');
  const [workoutKey, setWorkoutKey] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace('/auth');
      return;
    }
    setUser(u);

    const pKey = storageKey('bb_plan', u.id);
    const progKey = storageKey('bb_progression', u.id);
    const wKey = storageKey('bb_active_workout', u.id);
    const histKey = storageKey('bb_history', u.id);
    setPlanKey(pKey);
    setProgressionKey(progKey);
    setWorkoutKey(wKey);

    try {
      const rawPlan = localStorage.getItem(pKey);
      if (rawPlan) setPlan(JSON.parse(rawPlan));
    } catch { /* ignore */ }

    try {
      const rawStore = localStorage.getItem(progKey);
      if (rawStore) setStore(JSON.parse(rawStore));
    } catch { /* ignore */ }

    try {
      const rawHistory = localStorage.getItem(histKey);
      if (rawHistory) setHistory(JSON.parse(rawHistory));
    } catch { /* ignore */ }

    setReady(true);
  }, [router]);

  function handleStoreChange(updated: ProgressionStore) {
    setStore(updated);
    try {
      localStorage.setItem(progressionKey, JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  function handleSwapExercise(day: Day, blockId: string, oldExerciseId: string, newExercise: Exercise) {
    if (!plan) return;
    const updatedPlan: WeeklyPlan = {
      ...plan,
      days: plan.days.map((d) => {
        if (d.day !== day || !d.session) return d;
        return {
          ...d,
          session: {
            ...d.session,
            blocks: d.session.blocks.map((block) => {
              if (block.id !== blockId) return block;
              return {
                ...block,
                exercises: block.exercises.map((ex): BlockExercise => {
                  if (ex.exerciseId !== oldExerciseId) return ex;
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
          },
        };
      }),
    };
    setPlan(updatedPlan);
    try {
      localStorage.setItem(planKey, JSON.stringify(updatedPlan));
    } catch { /* ignore */ }
  }

  function handleLogout() {
    logout();
    router.replace('/auth');
  }

  function handleRebuild() {
    try {
      localStorage.removeItem(planKey);
    } catch { /* ignore */ }
    router.push('/');
  }

  if (!ready) return null;

  if (!plan) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-8"
        style={{ background: 'var(--background)' }}
      >
        <p className="text-lg font-black" style={{ color: 'var(--foreground)' }}>
          No programme found
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 text-xs font-black uppercase tracking-widest"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          Build My Programme
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 pt-4 pb-0"
        style={{ background: 'var(--background)', borderBottom: '1px solid var(--divider)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
              BodyBuildrr
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRebuild}
              className="text-xs px-3 py-1.5 border font-bold"
              style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--card)' }}
            >
              Rebuild
            </button>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 border font-bold"
              style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--card)' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {(['overview', 'plan', 'tracker'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-colors"
              style={{
                borderColor: tab === t ? 'var(--foreground)' : 'transparent',
                color: tab === t ? 'var(--foreground)' : 'var(--muted)',
                background: 'transparent',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        {tab === 'overview' && (
          <Dashboard
            plan={plan}
            history={history}
            userName={user!.name}
          />
        )}
        {tab === 'plan' && (
          <WeeklyPlanView
            plan={plan}
            userId={user!.id}
            workoutStorageKey={workoutKey}
            onSwapExercise={handleSwapExercise}
          />
        )}
        {tab === 'tracker' && (
          <ProgressionTracker
            plan={plan}
            store={store}
            onStoreChange={handleStoreChange}
          />
        )}
      </main>
    </div>
  );
}
