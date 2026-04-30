import { Muscle } from '@/lib/types';

const LABELS: Partial<Record<Muscle, string>> = {
  chest: 'Chest', front_delt: 'Front Delt', side_delt: 'Side Delt',
  rear_delt: 'Rear Delt', triceps: 'Triceps', biceps: 'Biceps',
  lats: 'Lats', upper_back: 'Upper Back', lower_back: 'Lower Back',
  core: 'Core', quads: 'Quads', hamstrings: 'Hamstrings',
  glutes: 'Glutes', calves: 'Calves', forearms: 'Forearms', traps: 'Traps',
};

export default function MuscleTag({ muscle, variant = 'primary' }: { muscle: Muscle; variant?: 'primary' | 'secondary' }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs font-bold border"
      style={{
        background: variant === 'primary' ? 'var(--foreground)' : 'transparent',
        color: variant === 'primary' ? 'var(--background)' : 'var(--muted)',
        borderColor: variant === 'primary' ? 'var(--foreground)' : 'var(--divider)',
      }}
    >
      {LABELS[muscle] ?? muscle}
    </span>
  );
}
