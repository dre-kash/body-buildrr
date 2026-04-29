'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WeeklyPlan, ProgressionStore } from '@/lib/types';
import WeeklyPlanView from '@/components/plan/WeeklyPlan';
import ProgressionTracker from '@/components/tracker/ProgressionTracker';

type Tab = 'plan' | 'tracker';

export default function PlanPage() {
  const router = useRouter();
  const [plan] = useLocalStorage<WeeklyPlan | null>('bb_plan', null);
  const [store, setStore] = useLocalStorage<ProgressionStore>('bb_progression', {});
  const [tab, setTab] = useState<Tab>('plan');

  if (!plan) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 p-8"
        style={{ background: 'var(--background)' }}
      >
        <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
          No plan found
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Build My Programme
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      {/* Top nav */}
      <header
        className="sticky top-0 z-10 px-4 pt-4 pb-0"
        style={{ background: 'var(--background)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
              BodyBuildrr
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Your weekly programme
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs px-3 py-2 rounded-lg font-semibold"
            style={{
              background: 'var(--muted-bg)',
              color: 'var(--muted)',
              border: '1px solid var(--card-border)',
            }}
          >
            Rebuild
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-xl p-1 mb-1"
          style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}
        >
          {(
            [
              { id: 'plan', label: '📋 Weekly Plan' },
              { id: 'tracker', label: '📊 Progression' },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: tab === id ? 'var(--card)' : 'transparent',
                color: tab === id ? 'var(--accent)' : 'var(--muted)',
                boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4">
        {tab === 'plan' && <WeeklyPlanView plan={plan} />}
        {tab === 'tracker' && (
          <ProgressionTracker
            plan={plan}
            store={store}
            onStoreChange={setStore}
          />
        )}
      </main>
    </div>
  );
}
