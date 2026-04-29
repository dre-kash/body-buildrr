import { Muscle } from '@/lib/types';

const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Chest',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  triceps: 'Triceps',
  biceps: 'Biceps',
  lats: 'Lats',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  core: 'Core',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  forearms: 'Forearms',
  traps: 'Traps',
};

interface Props {
  muscle: Muscle;
  variant?: 'primary' | 'secondary';
}

export default function MuscleTag({ muscle, variant = 'primary' }: Props) {
  const label = MUSCLE_LABELS[muscle] ?? muscle;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: variant === 'primary' ? 'var(--accent)' : 'var(--muted-bg)',
        color: variant === 'primary' ? '#fff' : 'var(--muted)',
        border: variant === 'secondary' ? '1px solid var(--card-border)' : 'none',
      }}
    >
      {label}
    </span>
  );
}
