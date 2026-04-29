'use client';

import { useState } from 'react';
import { ExerciseSessionLog, SetLog, Goal } from '@/lib/types';
import {
  isReadyToProgress,
  getPersonalBest,
  formatDate,
} from '@/lib/progressionUtils';

interface Props {
  exerciseId: string;
  exerciseName: string;
  logs: ExerciseSessionLog[];
  goal: Goal;
  onAddLog: (sets: SetLog[]) => void;
  onDeleteLog: (date: string) => void;
}

export default function ExerciseLogCard({
  exerciseName,
  logs,
  goal,
  onAddLog,
  onDeleteLog,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [logging, setLogging] = useState(false);
  const [set1, setSet1] = useState<SetLog>({ weight: null, reps: null });
  const [set2, setSet2] = useState<SetLog>({ weight: null, reps: null });

  const ready = isReadyToProgress(logs, goal);
  const pb = getPersonalBest(logs);
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  function handleSave() {
    onAddLog([set1, set2]);
    setLogging(false);
    setSet1({ weight: null, reps: null });
    setSet2({ weight: null, reps: null });
  }

  const canSave =
    set1.reps !== null && set2.reps !== null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card)',
        border: ready
          ? '2px solid var(--accent)'
          : '1px solid var(--card-border)',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-start justify-between p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-bold text-sm"
              style={{ color: 'var(--foreground)' }}
            >
              {exerciseName}
            </p>
            {ready && (
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full animate-pulse"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                ↑ Increase Weight
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {pb && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                PB: {pb.weight}kg × {pb.reps}
              </span>
            )}
            {latestLog && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Last: {formatDate(latestLog.date)} ·{' '}
                {latestLog.sets
                  .map((s) =>
                    s.weight !== null ? `${s.weight}kg×${s.reps}` : `${s.reps} reps`
                  )
                  .join(', ')}
              </span>
            )}
            {!latestLog && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                No logs yet
              </span>
            )}
          </div>
        </div>
        <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--muted)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: '1px solid var(--card-border)' }}
        >
          {/* Log new session */}
          {!logging ? (
            <button
              onClick={() => setLogging(true)}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              + Log Today&apos;s Sets
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Log today&apos;s sets
              </p>
              {[
                { label: 'Set 1', state: set1, set: setSet1 },
                { label: 'Set 2', state: set2, set: setSet2 },
              ].map(({ label, state, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold w-10 flex-shrink-0"
                    style={{ color: 'var(--muted)' }}
                  >
                    {label}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    value={state.weight ?? ''}
                    onChange={(e) =>
                      set((prev) => ({
                        ...prev,
                        weight: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-center"
                    style={{
                      background: 'var(--muted-bg)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    ×
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
                    value={state.reps ?? ''}
                    onChange={(e) =>
                      set((prev) => ({
                        ...prev,
                        reps: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-center"
                    style={{
                      background: 'var(--muted-bg)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={() => setLogging(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'var(--muted-bg)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* History */}
          {logs.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: 'var(--muted)' }}
              >
                HISTORY
              </p>
              <div className="space-y-2">
                {[...logs].reverse().map((log) => (
                  <div
                    key={log.date}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{
                      background: 'var(--muted-bg)',
                      border: '1px solid var(--card-border)',
                    }}
                  >
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {formatDate(log.date)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {log.sets
                          .map((s) =>
                            s.weight !== null
                              ? `${s.weight}kg × ${s.reps}`
                              : `${s.reps} reps`
                          )
                          .join('  ·  ')}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteLog(log.date)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ color: 'var(--muted)', background: 'var(--card-border)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
