'use client';

import { useState } from 'react';
import { ExerciseSessionLog, SetLog, Goal } from '@/lib/types';
import { isReadyToProgress, getPersonalBest, formatDate } from '@/lib/progressionUtils';

interface Props {
  exerciseId: string;
  exerciseName: string;
  logs: ExerciseSessionLog[];
  goal: Goal;
  onAddLog: (sets: SetLog[]) => void;
  onDeleteLog: (date: string) => void;
}

export default function ExerciseLogCard({ exerciseName, logs, goal, onAddLog, onDeleteLog }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [logging, setLogging] = useState(false);
  const [set1, setSet1] = useState<SetLog>({ weight: null, reps: null });
  const [set2, setSet2] = useState<SetLog>({ weight: null, reps: null });

  const ready = isReadyToProgress(logs, goal);
  const pb = getPersonalBest(logs);
  const latest = logs.length > 0 ? logs[logs.length - 1] : null;

  function handleSave() {
    onAddLog([set1, set2]);
    setLogging(false);
    setSet1({ weight: null, reps: null });
    setSet2({ weight: null, reps: null });
  }

  const inputCls = 'flex-1 px-2 py-2 text-sm text-center border font-mono focus:outline-none';
  const inputStyle = {
    background: 'var(--background)',
    borderColor: 'var(--card-border)',
    color: 'var(--foreground)',
  };

  return (
    <div
      className="border"
      style={{
        borderColor: ready ? 'var(--foreground)' : 'var(--card-border)',
        background: 'var(--card)',
      }}
    >
      <button
        className="w-full flex items-start justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {exerciseName}
            </p>
            {ready && (
              <span
                className="text-xs font-black px-2 py-0.5 border"
                style={{ borderColor: 'var(--foreground)', color: 'var(--foreground)' }}
              >
                ↑ Increase Weight
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {pb ? `PB: ${pb.weight}kg × ${pb.reps}` : latest ? `Last: ${formatDate(latest.date)}` : 'No logs yet'}
          </p>
        </div>
        <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--muted)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--divider)' }}>
          {!logging ? (
            <div className="px-4 py-3">
              <button
                onClick={() => setLogging(true)}
                className="w-full py-2.5 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                + Log Today
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Today's Sets
              </p>
              {([{ label: 'Set 1', s: set1, set: setSet1 }, { label: 'Set 2', s: set2, set: setSet2 }]).map(({ label, s, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-10 flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    {label}
                  </span>
                  <input
                    type="number" inputMode="decimal" placeholder="kg"
                    value={s.weight ?? ''}
                    onChange={(e) => set(p => ({ ...p, weight: e.target.value === '' ? null : Number(e.target.value) }))}
                    className={inputCls} style={inputStyle}
                  />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>×</span>
                  <input
                    type="number" inputMode="numeric" placeholder="reps"
                    value={s.reps ?? ''}
                    onChange={(e) => set(p => ({ ...p, reps: e.target.value === '' ? null : Number(e.target.value) }))}
                    className={inputCls} style={inputStyle}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={() => setLogging(false)}
                  className="flex-1 py-2 text-xs font-bold border"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--background)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={set1.reps === null || set2.reps === null}
                  className="flex-1 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-30"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--divider)' }}>
              <p className="text-xs font-bold uppercase tracking-widest py-2" style={{ color: 'var(--muted)' }}>
                History
              </p>
              <div className="space-y-1.5">
                {[...logs].reverse().map((log) => (
                  <div
                    key={log.date}
                    className="flex items-center justify-between px-3 py-2 border"
                    style={{ borderColor: 'var(--divider)', background: 'var(--background)' }}
                  >
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                        {formatDate(log.date)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {log.sets.map(s => s.weight !== null ? `${s.weight}kg×${s.reps}` : `${s.reps} reps`).join('  ·  ')}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteLog(log.date)}
                      className="text-xs px-2 py-1 border"
                      style={{ borderColor: 'var(--divider)', color: 'var(--muted)' }}
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
