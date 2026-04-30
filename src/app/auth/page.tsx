'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { getCurrentUser } from '@/lib/auth';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    if (getCurrentUser()) router.replace('/');
  }, [router]);

  function handleSuccess() {
    router.replace('/');
  }

  return <AuthForm onSuccess={handleSuccess} />;
}
