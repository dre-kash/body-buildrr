'use client';

import { useState, useMemo } from 'react';
import { Exercise, Equipment, MovementPattern, AccessoryCategory } from '@/lib/types';
import { EXERCISES } from '@/lib/exercises';

const PATTERN_LABELS: Record<MovementPattern, string> = {
  horizontal_push: 'Horizontal Push',
  vertical_push: 'Vertical Push',
  horizontal_pull: 'Horizontal Pull',
  vertical_pull: 'Vertical Pull',
  squat: 'Squat',
  hinge: 'Hinge',
  accessory: 'Accessory',
};

interface Props {
  currentPattern: MovementPattern;
  currentAccessoryCategory?: AccessoryCategory;
  equipment: Equipment;
  usedIds?: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function ExercisePicker({
  currentPattern,
  currentAccessoryCategory,
  equipment,
  usedIds = [],
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return EXERCISES.filter((ex) => {
      if (!ex.equipment.includes(equipment)) return false;
      if (usedIds.includes(ex.id)) return false;

      if (q) return ex.name.toLowerCase().includes(q);

      if (!showAll) {
        if (ex.pattern !== currentPattern) return false;
        if (
          currentPattern === 'accessory' &&
          currentAccessoryCategory &&
          ex.accessoryCategory !== currentAccessoryCategory
        )
          return false;
      }

      return true;
    });
  }, [query, showAll, currentPattern, currentAccessoryCategory, equipment, usedIds]);

  const defaultLabel =
    currentPattern === 'accessory' && currentAccessoryCategory
      ? currentAccessoryCategory.replace(/_/g, ' ')
      : PATTERN_LABELS[currentPattern];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md flex flex-col"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--foreground)',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--divider)' }}
        >
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--foreground)' }}>
            Change Exercise
          </p>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--muted)' }}>
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--divider)' }}>
          <input
            autoFocus
            type="text"
            placeholder="Search all exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border font-mono focus:outline-none"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--card-border)',
              color: 'var(--foreground)',
            }}
          />
          {!query && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {showAll ? 'All exercises' : `${defaultLabel} only`}
              </p>
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs font-bold underline"
                style={{ color: 'var(--foreground)' }}
              >
                {showAll ? 'Show same pattern' : 'Show all'}
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-xs text-center" style={{ color: 'var(--muted)' }}>
              No exercises found
            </p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full px-4 py-3 text-left transition-colors hover:opacity-70"
              style={{ borderBottom: '1px solid var(--divider)' }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                {ex.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {PATTERN_LABELS[ex.pattern]}
                {ex.accessoryCategory ? ` · ${ex.accessoryCategory.replace(/_/g, ' ')}` : ''}
                {' · '}
                {ex.primaryMuscles.map((m) => m.replace(/_/g, ' ')).join(', ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
