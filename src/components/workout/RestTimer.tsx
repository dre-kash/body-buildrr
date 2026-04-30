'use client';

import { useEffect, useState } from 'react';

interface Props {
  seconds: number;
  onDone: () => void;
}

export default function RestTimer({ seconds, onDone }: Props) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div
      className="border px-4 py-4 text-center space-y-3"
      style={{ borderColor: 'var(--foreground)', background: 'var(--card)' }}
    >
      <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        Rest
      </p>
      <p className="text-5xl font-black tracking-tighter tabular-nums" style={{ color: 'var(--foreground)' }}>
        {m}:{s.toString().padStart(2, '0')}
      </p>
      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ background: 'var(--divider)' }}>
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: 'var(--foreground)' }}
        />
      </div>
      <button
        onClick={onDone}
        className="text-xs font-bold uppercase tracking-widest px-4 py-2 border"
        style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}
      >
        Skip Rest
      </button>
    </div>
  );
}
