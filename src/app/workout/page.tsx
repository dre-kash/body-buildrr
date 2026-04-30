'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, storageKey } from '@/lib/auth';
import { ActiveWorkout, ProgressionStore } from '@/lib/types';
import ActiveWorkoutView from '@/components/workout/ActiveWorkout';

export default function WorkoutPage() {
  const router = useRouter();
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [store, setStore] = useState<ProgressionStore>({});
  const [workoutKey, setWorkoutKey] = useState('');
  const [progressionKey, setProgressionKey] = useState('');
  const [historyKey, setHistoryKey] = useState('');
  const [planKey, setPlanKey] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/auth');
      return;
    }

    const wKey = storageKey('bb_active_workout', user.id);
    const pKey = storageKey('bb_progression', user.id);
    const hKey = storageKey('bb_history', user.id);
    const planK = storageKey('bb_plan', user.id);

    setWorkoutKey(wKey);
    setProgressionKey(pKey);
    setHistoryKey(hKey);
    setPlanKey(planK);

    try {
      const raw = localStorage.getItem(wKey);
      if (!raw) {
        router.replace('/plan');
        return;
      }
      setWorkout(JSON.parse(raw));
    } catch {
      router.replace('/plan');
      return;
    }

    try {
      const rawStore = localStorage.getItem(pKey);
      if (rawStore) setStore(JSON.parse(rawStore));
    } catch { /* ignore */ }

    setReady(true);
  }, [router]);

  function handleStoreChange(updated: ProgressionStore) {
    setStore(updated);
    try {
      localStorage.setItem(progressionKey, JSON.stringify(updated));
    } catch { /* ignore */ }
  }

  if (!ready || !workout) return null;

  return (
    <ActiveWorkoutView
      workout={workout}
      store={store}
      progressionKey={progressionKey}
      historyKey={historyKey}
      workoutKey={workoutKey}
      planKey={planKey}
      equipment={workout.equipment}
      onStoreChange={handleStoreChange}
    />
  );
}
