'use client';

import { useState } from 'react';
import {
  UserInputs,
  FocusMuscle,
  FocusPriority,
  Goal,
  Equipment,
  Day,
} from '@/lib/types';

interface Props {
  onSubmit: (inputs: UserInputs) => void;
}

const FOCUS_OPTIONS: { value: FocusMuscle; label: string; icon: string }[] = [
  { value: 'chest', label: 'Chest', icon: '💪' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'shoulders', label: 'Shoulders', icon: '🏋️' },
  { value: 'arms', label: 'Arms', icon: '💪' },
  { value: 'legs', label: 'Legs', icon: '🦵' },
  { value: 'glutes', label: 'Glutes', icon: '🍑' },
  { value: 'full_body', label: 'Full Body', icon: '⚡' },
];

const DURATION_OPTIONS: { value: UserInputs['sessionDuration']; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 75, label: '75 min' },
  { value: 90, label: '90 min' },
];

const FREQUENCY_OPTIONS: { value: UserInputs['trainingFrequency']; label: string }[] = [
  { value: 2, label: '2 days' },
  { value: 3, label: '3 days' },
  { value: 4, label: '4 days' },
  { value: 5, label: '5 days' },
];

const DAY_OPTIONS: { value: Day; label: string; short: string }[] = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

const GOAL_OPTIONS: { value: Goal; label: string; sub: string; icon: string }[] = [
  { value: 'strength', label: 'Strength', sub: '3–6 reps · 3–5 min rest', icon: '🏆' },
  { value: 'hypertrophy', label: 'Hypertrophy', sub: '8–12 reps · 60–90s rest', icon: '📈' },
  {
    value: 'general_fitness',
    label: 'General Fitness',
    sub: '10–15 reps · 45–60s rest',
    icon: '🎯',
  },
];

const EQUIPMENT_OPTIONS: {
  value: Equipment;
  label: string;
  sub: string;
  icon: string;
}[] = [
  { value: 'full_gym', label: 'Full Gym', sub: 'Barbells, cables, machines, dumbbells', icon: '🏟️' },
  { value: 'dumbbells', label: 'Dumbbells Only', sub: 'Dumbbells + bench at home or gym', icon: '🥊' },
  { value: 'bodyweight', label: 'Bodyweight Only', sub: 'No equipment needed', icon: '🤸' },
];

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingForm({ onSubmit }: Props) {
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
    switch (step) {
      case 1:
        return focusMuscles.length >= 1;
      case 2:
        return true;
      case 3:
        return trainingDays.length === trainingFrequency;
      case 4:
        return true;
      case 5:
        return true;
    }
  }

  function handleSubmit() {
    onSubmit({
      focusMuscles,
      focusPriority,
      sessionDuration,
      trainingFrequency,
      trainingDays,
      goal,
      equipment,
    });
  }

  const steps = [
    { number: 1, label: 'Focus' },
    { number: 2, label: 'Schedule' },
    { number: 3, label: 'Days' },
    { number: 4, label: 'Goal' },
    { number: 5, label: 'Equipment' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--accent)' }}>
          BodyBuildrr
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Build your personalised training programme
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s) => (
            <div
              key={s.number}
              className="flex flex-col items-center gap-1"
              style={{ flex: 1 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background:
                    step > s.number
                      ? 'var(--accent)'
                      : step === s.number
                      ? 'var(--accent)'
                      : 'var(--muted-bg)',
                  color:
                    step >= s.number ? '#fff' : 'var(--muted)',
                  border:
                    step === s.number
                      ? '2px solid var(--accent)'
                      : 'none',
                }}
              >
                {step > s.number ? '✓' : s.number}
              </div>
              <span
                className="text-xs"
                style={{
                  color: step >= s.number ? 'var(--foreground)' : 'var(--muted)',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div
          className="h-1 rounded-full"
          style={{ background: 'var(--muted-bg)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              background: 'var(--accent)',
              width: `${((step - 1) / 4) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 pb-4">
        {step === 1 && (
          <StepCard title="What do you want to focus on?" sub="Choose 1 or 2 muscle groups">
            <div className="grid grid-cols-2 gap-3">
              {FOCUS_OPTIONS.map((opt) => {
                const selected = focusMuscles.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleFocus(opt.value)}
                    className="rounded-xl p-4 text-left transition-all active:scale-95"
                    style={{
                      background: selected ? 'var(--accent)' : 'var(--card)',
                      border: `2px solid ${selected ? 'var(--accent)' : 'var(--card-border)'}`,
                      color: selected ? '#fff' : 'var(--foreground)',
                    }}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="font-semibold text-sm">{opt.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Priority selector — only if 2 non-full-body muscles selected */}
            {focusMuscles.length === 2 && !focusMuscles.includes('full_body') && (
              <div
                className="mt-4 p-4 rounded-xl"
                style={{ background: 'var(--muted-bg)', border: '1px solid var(--card-border)' }}
              >
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                  How should these be prioritised?
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'equal' as FocusPriority, label: 'Equal priority', sub: 'Both groups get the same volume' },
                    {
                      value: 'primary_secondary' as FocusPriority,
                      label: 'Primary / Secondary',
                      sub: `${FOCUS_OPTIONS.find((f) => f.value === focusMuscles[0])?.label} leads, ${FOCUS_OPTIONS.find((f) => f.value === focusMuscles[1])?.label} supports`,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFocusPriority(opt.value)}
                      className="flex items-start gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        background: focusPriority === opt.value ? 'var(--accent-dim)' : 'var(--card)',
                        border: `2px solid ${focusPriority === opt.value ? 'var(--accent)' : 'var(--card-border)'}`,
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0"
                        style={{
                          borderColor: focusPriority === opt.value ? 'var(--accent)' : 'var(--muted)',
                          background: focusPriority === opt.value ? 'var(--accent)' : 'transparent',
                        }}
                      />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {opt.label}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {opt.sub}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="How long are your sessions?" sub="We'll fit the right number of exercises">
            <div className="flex flex-wrap gap-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSessionDuration(opt.value)}
                  className="flex-1 min-w-[80px] py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                  style={{
                    background: sessionDuration === opt.value ? 'var(--accent)' : 'var(--card)',
                    border: `2px solid ${sessionDuration === opt.value ? 'var(--accent)' : 'var(--card-border)'}`,
                    color: sessionDuration === opt.value ? '#fff' : 'var(--foreground)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                How many days per week?
              </p>
              <div className="flex gap-3">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTrainingFrequency(opt.value);
                      setTrainingDays((prev) => prev.slice(0, opt.value));
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-base transition-all active:scale-95"
                    style={{
                      background: trainingFrequency === opt.value ? 'var(--accent)' : 'var(--card)',
                      border: `2px solid ${trainingFrequency === opt.value ? 'var(--accent)' : 'var(--card-border)'}`,
                      color: trainingFrequency === opt.value ? '#fff' : 'var(--foreground)',
                    }}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted)' }}>
                {trainingFrequency} days per week
              </p>
            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard
            title="Which days will you train?"
            sub={`Select exactly ${trainingFrequency} day${trainingFrequency > 1 ? 's' : ''} (${trainingDays.length}/${trainingFrequency} selected)`}
          >
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_OPTIONS.map((opt) => {
                const selected = trainingDays.includes(opt.value);
                const disabled = !selected && trainingDays.length >= trainingFrequency;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && toggleDay(opt.value)}
                    disabled={disabled}
                    className="py-3 rounded-xl font-semibold text-xs transition-all active:scale-95 disabled:opacity-30"
                    style={{
                      background: selected ? 'var(--accent)' : 'var(--card)',
                      border: `2px solid ${selected ? 'var(--accent)' : 'var(--card-border)'}`,
                      color: selected ? '#fff' : 'var(--foreground)',
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
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    {DAY_OPTIONS.find((o) => o.value === d)?.label}
                  </span>
                ))}
              </div>
            )}
          </StepCard>
        )}

        {step === 4 && (
          <StepCard title="What's your training goal?" sub="This sets your rep ranges and rest periods">
            <div className="flex flex-col gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className="flex items-center gap-4 p-4 rounded-xl text-left transition-all active:scale-95"
                  style={{
                    background: goal === opt.value ? 'var(--accent-dim)' : 'var(--card)',
                    border: `2px solid ${goal === opt.value ? 'var(--accent)' : 'var(--card-border)'}`,
                  }}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div
                      className="font-bold"
                      style={{ color: goal === opt.value ? 'var(--accent)' : 'var(--foreground)' }}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {opt.sub}
                    </div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor: goal === opt.value ? 'var(--accent)' : 'var(--muted)',
                      background: goal === opt.value ? 'var(--accent)' : 'transparent',
                    }}
                  />
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard title="What equipment do you have?" sub="We'll match exercises to what's available">
            <div className="flex flex-col gap-3">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEquipment(opt.value)}
                  className="flex items-center gap-4 p-4 rounded-xl text-left transition-all active:scale-95"
                  style={{
                    background: equipment === opt.value ? 'var(--accent-dim)' : 'var(--card)',
                    border: `2px solid ${equipment === opt.value ? 'var(--accent)' : 'var(--card-border)'}`,
                  }}
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div
                      className="font-bold"
                      style={{ color: equipment === opt.value ? 'var(--accent)' : 'var(--foreground)' }}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {opt.sub}
                    </div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor: equipment === opt.value ? 'var(--accent)' : 'var(--muted)',
                      background: equipment === opt.value ? 'var(--accent)' : 'transparent',
                    }}
                  />
                </button>
              ))}
            </div>
          </StepCard>
        )}
      </div>

      {/* Navigation */}
      <div
        className="sticky bottom-0 px-4 py-4 flex gap-3"
        style={{ background: 'var(--background)', borderTop: '1px solid var(--card-border)' }}
      >
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="flex-none px-5 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            style={{
              background: 'var(--muted-bg)',
              color: 'var(--foreground)',
              border: '1px solid var(--card-border)',
            }}
          >
            Back
          </button>
        )}
        {step < 5 ? (
          <button
            onClick={() => canAdvance() && setStep((s) => (s + 1) as Step)}
            disabled={!canAdvance()}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl font-black text-sm tracking-wide transition-all active:scale-95"
            style={{
              background: 'var(--accent)',
              color: '#fff',
            }}
          >
            Generate My Programme →
          </button>
        )}
      </div>
    </div>
  );
}

function StepCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-black mb-1" style={{ color: 'var(--foreground)' }}>
        {title}
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        {sub}
      </p>
      {children}
    </div>
  );
}
