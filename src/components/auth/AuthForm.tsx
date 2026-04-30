'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onSuccess: () => void;
}

type Mode = 'login' | 'signup';

export default function AuthForm({ onSuccess }: Props) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result: { error?: string };
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        setLoading(false);
        return;
      }
      result = signup(name, email, password);
    } else {
      result = login(email, password);
    }

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  const field =
    'w-full px-3 py-3 text-sm border focus:outline-none focus:ring-0 font-mono';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--background)' }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1
          className="text-4xl font-black tracking-tighter mb-1"
          style={{ color: 'var(--foreground)' }}
        >
          BodyBuildrr
        </h1>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          smart training. built for you.
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex w-full max-w-sm mb-6 border"
        style={{ borderColor: 'var(--card-border)' }}
      >
        {(['signup', 'login'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: mode === m ? 'var(--accent)' : 'var(--card)',
              color: mode === m ? 'var(--accent-fg)' : 'var(--muted)',
            }}
          >
            {m === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-3"
      >
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={field}
            style={{
              background: 'var(--card)',
              borderColor: 'var(--card-border)',
              color: 'var(--foreground)',
            }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={field}
          style={{
            background: 'var(--card)',
            borderColor: 'var(--card-border)',
            color: 'var(--foreground)',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={field}
          style={{
            background: 'var(--card)',
            borderColor: 'var(--card-border)',
            color: 'var(--foreground)',
          }}
        />

        {error && (
          <p className="text-xs py-2 px-3 border" style={{ borderColor: 'var(--foreground)', color: 'var(--foreground)', background: 'var(--accent-dim)' }}>
            ✕ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="py-3 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-40"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          {loading ? '...' : mode === 'signup' ? 'Create Account →' : 'Log In →'}
        </button>
      </form>

      <p className="mt-8 text-xs text-center max-w-xs" style={{ color: 'var(--muted)' }}>
        All data is stored locally on this device. No account information leaves your browser.
      </p>
    </div>
  );
}
