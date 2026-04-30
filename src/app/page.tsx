'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, storageKey } from '@/lib/auth';
import { WeeklyPlan, UserInputs, User } from '@/lib/types';
import { buildProgram } from '@/lib/programBuilder';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace('/auth');
      return;
    }
    setUser(u);
    setReady(true);
  }, [router]);

  function handleSubmit(inputs: UserInputs) {
    if (!user) return;
    const plan = buildProgram(inputs);
    try {
      localStorage.setItem(storageKey('bb_plan', user.id), JSON.stringify(plan));
    } catch { /* ignore */ }
    router.push('/plan');
  }

  if (!ready || !user) return null;

  return <OnboardingForm onSubmit={handleSubmit} userName={user.name} />;
}
