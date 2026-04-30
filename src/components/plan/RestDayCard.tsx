import { Day } from '@/lib/types';

const DAY_LABELS: Record<Day, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export default function RestDayCard({ day }: { day: Day }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border opacity-30"
      style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
    >
      <span className="text-sm font-mono">—</span>
      <div>
        <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{DAY_LABELS[day]}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Rest</p>
      </div>
    </div>
  );
}
