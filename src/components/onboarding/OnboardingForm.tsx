'use client';

import { useState } from 'react';
import { UserInputs, FocusMuscle, FocusPriority, Goal, Equipment, Day } from '@/lib/types';

interface Props {
  onSubmit: (inputs: UserInputs) => void;
  userName: string;
}

const FOCUS_OPTIONS: { value: FocusMuscle; label: string; sym: string }[] = [
  { value: 'chest',     label: 'Chest',     sym: '◫' },
  { value: 'back',      label: 'Back',      sym: '◈' },
  { value: 'shoulders', label: 'Shoulders', sym: '△' },
  { value: 'arms',      label: 'Arms',      sym: '◇' },
  { value: 'legs',      label: 'Legs',      sym: '▽' },
  { value: 'glutes',    label: 'Glutes',    sym: '○' },
  { value: 'full_body', label: 'Full Body', sym: '✦' },
];

const DURATION_OPTIONS: { value: UserInputs['sessionDuration']; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 75, label: '75 min' },
  { value: 90, label: '90 min' },
];

const DAY_OPTIONS: { value: Day; short: string }[] = [
  { value: 'monday',    short: 'Mo' },
  { value: 'tuesday',   short: 'Tu' },
  { value: 'wednesday', short: 'We' },
  { value: 'thursday',  short: 'Th' },
  { value: 'friday',    short: 'Fr' },
  { value: 'saturday',  short: 'Sa' },
  { value: 'sunday',    short: 'Su' },
];

const DAY_FULL: Record<Day, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const GOAL_OPTIONS: { value: Goal; label: string; sub: string; sym: string }[] = [
  { value: 'strength',          label: 'Strength',           sub: '3–6 reps · 3–5 min rest',    sym: '◆' },
  { value: 'hypertrophy',       label: 'Hypertrophy',        sub: '8–12 reps · 60–90s rest',    sym: '▲' },
  { value: 'muscular_endurance',label: 'Muscular Endurance', sub: '15–20 reps · 45s rest',      sym: '⬡' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; sub: string; sym: string }[] = [
  { value: 'full_gym',   label: 'Full Gym',        sub: 'Barbells, cables, machines, dumbbells', sym: '■' },
  { value: 'dumbbells',  label: 'Dumbbells Only',  sub: 'Dumbbells + bench at home or gym',      sym: '◆' },
  { value: 'bodyweight', label: 'Bodyweight Only', sub: 'No equipment needed',                   sym: '○' },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingForm({ onSubmit, userName }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [focusMuscles, setFocusMuscles] = useState<FocusMuscle[]>([]);
  const [focusPriority, setFocusPriority] = useState<FocusPriority>('equal');
  const [sessionDuration, setSessionDuration] = useState<UserInputs['sessionDuration']>(60);
  const [trainingFrequency, setTrainingFrequency] = useState<UserInputs['trainingFrequency']>(3);
  const [trainingDays, setTrainingDays] = useState<Day[]>([]);
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [equipment, setEquipment] = useState<Equipment>('full_gym');

  function toggleFocus(muscle: FocusMuscle) {
    setFocusMuscles((prev) => {
      if (prev.includes(muscle)) return prev.filter((m) => m !== muscle);
      if (muscle === 'full_body') return ['full_body'];
      const without = prev.filter((m) => m !== 'full_body');
      if (without.length >= 2) return without;
      return [...without, muscle];
    });
  }

  function toggleDay(day: Day) {
    setTrainingDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= trainingFrequency) return prev;
      return [...prev, day];
    });
  }

  function canAdvance(): boolean {
    if (step === 1) return focusMuscles.length >= 1;
    if (step === 3) return trainingDays.length === trainingFrequency;
    return true;
  }

  const steps = ['Focus', 'Schedule', 'Days', 'Goal', 'Kit'];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
          Welcome, {userName}
        </p>
        <h1 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--foreground)' }}>
          BodyBuildrr
        </h1>
      </div>

      {/* Step bar */}
      <div className="px-4 mb-6">
        <div className="flex gap-1 mb-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex-1 h-0.5"
              style={{
                background: step > i + 1 ? 'var(--foreground)' : step === i + 1 ? 'var(--foreground)' : 'var(--divider)',
                opacity: step === i + 1 ? 1 : step > i + 1 ? 0.5 : 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Step {step} of {steps.length} — {steps[step - 1]}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4">
        {step === 1 && (
          <StepShell title="What's your training focus?" sub="Choose 1 or 2 muscle groups">
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_OPTIONS.map((opt) => {
                const sel = focusMuscles.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleFocus(opt.value)}
                    className="p-4 text-left border transition-all active:scale-95"
                    style={{
                      background: sel ? 'var(--accent)' : 'var(--card)',
                      borderColor: sel ? 'var(--accent)' : 'var(--card-border)',
                      color: sel ? 'var(--accent-fg)' : 'var(--foreground)',
                    }}
                  >
                    <div className="text-2xl mb-1 font-mono">{opt.sym}</div>
                    <div className="text-sm font-bold">{opt.label}</div>
                  </button>
                );
              })}
            </div>

            {focusMuscles.length === 2 && !focusMuscles.includes('full_body') && (
              <div className="mt-4 border p-4" style={{ borderColor: 'var(--card-border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
                  Priority
                </p>
                {(['equal', 'primary_secondary'] as FocusPriority[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFocusPriority(v)}
                    className="flex items-start gap-3 w-full p-3 mb-2 border text-left transition-all"
                    style={{
                      background: focusPriority === v ? 'var(--accent)' : 'var(--card)',
                      borderColor: focusPriority === v ? 'var(--accent)' : 'var(--card-border)',
                      color: focusPriority === v ? 'var(--accent-fg)' : 'var(--foreground)',
                    }}
                  >
                    <span className="text-lg mt-0.5">{focusPriority === v ? '●' : '○'}</span>
                    <div>
                      <p className="text-xs font-bold">
                        {v === 'equal' ? 'Equal priority' : 'Primary / Secondary'}
                      </p>
                      <p className="text-xs opacity-70 mt-0.5">
                        {v === 'equal'
                          ? 'Both groups get the same volume'
                          : `${FOCUS_OPTIONS.find(f => f.value === focusMuscles[0])?.label} leads, ${FOCUS_OPTIONS.find(f => f.value === focusMuscles[1])?.label} supports`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Schedule" sub="Session length and training days per week">
            <div>
              <Label>Session duration</Label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSessionDuration(opt.value)}
                    className="flex-1 min-w-[72px] py-2.5 text-xs font-bold border transition-all active:scale-95"
                    style={{
                      background: sessionDuration === opt.value ? 'var(--accent)' : 'var(--card)',
                      borderColor: sessionDuration === opt.value ? 'var(--accent)' : 'var(--card-border)',
                      color: sessionDuration === opt.value ? 'var(--accent-fg)' : 'var(--foreground)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Label>Days per week</Label>
              <div className="flex gap-2">
                {([2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => { setTrainingFrequency(n); setTrainingDays(d => d.slice(0, n)); }}
                    className="flex-1 py-3 font-black text-lg border transition-all active:scale-95"
                    style={{
                      background: trainingFrequency === n ? 'var(--accent)' : 'var(--card)',
                      borderColor: trainingFrequency === n ? 'var(--accent)' : 'var(--card-border)',
                      color: trainingFrequency === n ? 'var(--accent-fg)' : 'var(--foreground)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            title="Training days"
            sub={`Select ${trainingFrequency} day${trainingFrequency > 1 ? 's' : ''} · ${trainingDays.length}/${trainingFrequency} chosen`}
          >
            <div className="grid grid-cols-7 gap-1">
              {DAY_OPTIONS.map((opt) => {
                const sel = trainingDays.includes(opt.value);
                const disabled = !sel && trainingDays.length >= trainingFrequency;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && toggleDay(opt.value)}
                    disabled={disabled}
                    className="py-3 text-xs font-bold border transition-all active:scale-95 disabled:opacity-20"
                    style={{
                      background: sel ? 'var(--accent)' : 'var(--card)',
                      borderColor: sel ? 'var(--accent)' : 'var(--card-border)',
                      color: sel ? 'var(--accent-fg)' : 'var(--foreground)',
                    }}
                  >
                    {opt.short}
                  </button>
                );
              })}
            </div>
            {trainingDays.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {trainingDays.map((d) => (
                  <span
                    key={d}
                    className="text-xs px-2 py-1 border font-bold"
                    style={{ borderColor: 'var(--foreground)', color: 'var(--foreground)' }}
                  >
                    {DAY_FULL[d]}
                  </span>
                ))}
              </div>
            )}
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Training goal" sub="Sets your rep ranges and rest periods">
            <div className="flex flex-col gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className="flex items-center gap-4 p-4 border text-left transition-all active:scale-95"
                  style={{
                    background: goal === opt.value ? 'var(--accent)' : 'var(--card)',
                    borderColor: goal === opt.value ? 'var(--accent)' : 'var(--card-border)',
                    color: goal === opt.value ? 'var(--accent-fg)' : 'var(--foreground)',
                  }}
                >
                  <span className="text-2xl font-mono w-8 text-center flex-shrink-0">{opt.sym}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
                  </div>
                  <span className="text-lg flex-shrink-0">{goal === opt.value ? '●' : '○'}</span>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="Equipment" sub="We'll match exercises to what you have">
            <div className="flex flex-col gap-2">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEquipment(opt.value)}
                  className="flex items-center gap-4 p-4 border text-left transition-all active:scale-95"
                  style={{
                    background: equipment === opt.value ? 'var(--accent)' : 'var(--card)',
                    borderColor: equipment === opt.value ? 'var(--accent)' : 'var(--card-border)',
                    color: equipment === opt.value ? 'var(--accent-fg)' : 'var(--foreground)',
                  }}
                >
                  <span className="text-2xl font-mono w-8 text-center flex-shrink-0">{opt.sym}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{opt.sub}</p>
                  </div>
                  <span className="text-lg flex-shrink-0">{equipment === opt.value ? '●' : '○'}</span>
                </button>
              ))}
            </div>
          </StepShell>
        )}
      </div>

      {/* Nav */}
      <div
        className="sticky bottom-0 px-4 py-4 flex gap-2"
        style={{ background: 'var(--background)', borderTop: '1px solid var(--divider)' }}
      >
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="px-5 py-3 text-xs font-bold border transition-all active:scale-95"
            style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--card)' }}
          >
            ← Back
          </button>
        )}
        {step < 5 ? (
          <button
            onClick={() => canAdvance() && setStep((s) => (s + 1) as Step)}
            disabled={!canAdvance()}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={() => onSubmit({ focusMuscles, focusPriority, sessionDuration, trainingFrequency, trainingDays, goal, equipment })}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Build My Programme →
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: 'var(--foreground)' }}>{title}</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>{sub}</p>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  );
}
