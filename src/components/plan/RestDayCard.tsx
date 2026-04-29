import { Day } from '@/lib/types';

const DAY_LABELS: Record<Day, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export default function RestDayCard({ day }: { day: Day }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 opacity-50"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: 'var(--muted-bg)' }}
      >
        😴
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
          {DAY_LABELS[day]}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Rest Day
        </p>
      </div>
    </div>
  );
}
