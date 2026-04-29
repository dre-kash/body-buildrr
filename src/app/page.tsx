'use client';

import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WeeklyPlan, UserInputs } from '@/lib/types';
import { buildProgram } from '@/lib/programBuilder';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

export default function HomePage() {
  const router = useRouter();
  const [, setPlan] = useLocalStorage<WeeklyPlan | null>('bb_plan', null);

  function handleSubmit(inputs: UserInputs) {
    const plan = buildProgram(inputs);
    setPlan(plan);
    router.push('/plan');
  }

  return <OnboardingForm onSubmit={handleSubmit} />;
}
