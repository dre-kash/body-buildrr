import {
  UserInputs,
  WeeklyPlan,
  DayPlan,
  Session,
  ExerciseBlock,
  BlockExercise,
  Exercise,
  Muscle,
  MovementPattern,
  SessionType,
  FocusMuscle,
  Day,
  Goal,
  Equipment,
  AccessoryCategory,
} from './types';
import { EXERCISES } from './exercises';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_ORDER: Day[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const REP_RANGES: Record<Goal, [number, number]> = {
  strength: [3, 6],
  hypertrophy: [8, 12],
  muscular_endurance: [15, 20],
};

const REST_SECONDS: Record<Goal, number> = {
  strength: 180,
  hypertrophy: 75,
  muscular_endurance: 45,
};

// Minutes per exercise block, accounting for real-world setup/transitions
const MINS_PER_STRAIGHT_BLOCK: Record<Goal, number> = {
  strength: 12,
  hypertrophy: 8,
  muscular_endurance: 5,
};

const MINS_PER_SUPERSET_BLOCK: Record<Goal, number> = {
  strength: 14,
  hypertrophy: 10,
  muscular_endurance: 7,
};

const MINS_PER_TRISET_BLOCK: Record<Goal, number> = {
  strength: 16,
  hypertrophy: 12,
  muscular_endurance: 9,
};

const WARMUP_MINS = 5;

// Exercise slots by duration (total exercises per session)
const EXERCISE_SLOTS: Record<number, number> = {
  30: 3,
  45: 4,
  60: 5,
  75: 6,
  90: 8,
};

// ─── Session Split Logic ──────────────────────────────────────────────────────

type SplitType = 'full_body' | 'ppl' | 'upper_lower' | 'ppl_ul';

function determineSplitType(frequency: 2 | 3 | 4 | 5): SplitType {
  if (frequency === 2) return 'full_body';
  if (frequency === 3) return 'ppl';
  if (frequency === 4) return 'upper_lower';
  return 'ppl_ul';
}

// Returns ordered session types for the week
function getSessionSequence(splitType: SplitType): SessionType[] {
  switch (splitType) {
    case 'full_body':
      return ['full_body', 'full_body'];
    case 'ppl':
      return ['push', 'pull', 'legs'];
    case 'upper_lower':
      return ['upper', 'lower', 'upper', 'lower'];
    case 'ppl_ul':
      return ['push', 'pull', 'legs', 'upper', 'lower'];
  }
}

function getSessionLabel(type: SessionType, typeIndex: number, typeTotal: number): string {
  const letter = ['A', 'B', 'C', 'D', 'E'][typeIndex];
  const typeLabels: Record<SessionType, string> = {
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    upper: 'Upper',
    lower: 'Lower',
    full_body: 'Full Body',
  };
  // Only append letter if this type appears more than once in the week
  const suffix = typeTotal > 1 ? ` ${letter}` : '';
  return `${typeLabels[type]}${suffix}`;
}

// ─── Focus Muscle Mappings ────────────────────────────────────────────────────

const FOCUS_TO_PATTERNS: Record<
  FocusMuscle,
  {
    primary: MovementPattern[];
    accessory: AccessoryCategory[];
    compatibleSessions: SessionType[];
  }
> = {
  chest: {
    primary: ['horizontal_push'],
    accessory: ['chest_iso'],
    compatibleSessions: ['push', 'upper', 'full_body'],
  },
  back: {
    primary: ['horizontal_pull', 'vertical_pull'],
    accessory: ['back_iso', 'rear_delt'],
    compatibleSessions: ['pull', 'upper', 'full_body'],
  },
  shoulders: {
    primary: ['vertical_push'],
    accessory: ['side_delt', 'rear_delt'],
    compatibleSessions: ['push', 'pull', 'upper', 'full_body'],
  },
  arms: {
    primary: [],
    accessory: ['biceps', 'triceps'],
    compatibleSessions: ['push', 'pull', 'upper', 'full_body'],
  },
  legs: {
    primary: ['squat', 'hinge'],
    accessory: ['calves', 'glute_iso'],
    compatibleSessions: ['legs', 'lower', 'full_body'],
  },
  glutes: {
    primary: ['hinge'],
    accessory: ['glute_iso'],
    compatibleSessions: ['legs', 'lower', 'full_body'],
  },
  full_body: {
    primary: [
      'horizontal_push',
      'vertical_push',
      'horizontal_pull',
      'vertical_pull',
      'squat',
      'hinge',
    ],
    accessory: [],
    compatibleSessions: ['push', 'pull', 'legs', 'upper', 'lower', 'full_body'],
  },
};

// ─── Session templates (typeIndex-aware) ─────────────────────────────────────
//
// For session types that repeat in a week (full_body, upper, lower),
// typeIndex=0 uses a horizontal-emphasis template and typeIndex=1 uses a
// vertical-emphasis template so the two sessions have genuinely different
// exercise selections.

interface SessionTemplate {
  required: MovementPattern[];
  optional: MovementPattern[];
  accessories: AccessoryCategory[];
}

function getTemplate(type: SessionType, typeIndex: number): SessionTemplate {
  const alt = typeIndex > 0; // A = default/horizontal, B = alt/vertical

  switch (type) {
    case 'push':
      // Push always leads with horizontal then vertical
      return {
        required: ['horizontal_push', 'vertical_push'],
        optional: [],
        accessories: ['triceps', 'side_delt', 'chest_iso'],
      };

    case 'pull':
      // Pull A: vertical pull leads (lat pulldown / pull-up)
      // Pull B: horizontal pull leads (row)
      return alt
        ? {
            required: ['horizontal_pull', 'vertical_pull'],
            optional: [],
            accessories: ['biceps', 'rear_delt', 'back_iso'],
          }
        : {
            required: ['vertical_pull', 'horizontal_pull'],
            optional: [],
            accessories: ['biceps', 'rear_delt', 'back_iso'],
          };

    case 'legs':
      // Legs A: squat-led (quads emphasis)
      // Legs B: hinge-led (posterior chain / glute emphasis)
      return alt
        ? {
            required: ['hinge', 'squat'],
            optional: [],
            accessories: ['glute_iso', 'calves', 'core'],
          }
        : {
            required: ['squat', 'hinge'],
            optional: [],
            accessories: ['glute_iso', 'calves', 'core'],
          };

    case 'upper':
      // Upper A: horizontal push + horizontal pull leads
      // Upper B: vertical push + vertical pull leads
      return alt
        ? {
            required: ['vertical_push', 'vertical_pull'],
            optional: ['horizontal_push', 'horizontal_pull'],
            accessories: ['biceps', 'triceps', 'rear_delt', 'side_delt'],
          }
        : {
            required: ['horizontal_push', 'horizontal_pull'],
            optional: ['vertical_push', 'vertical_pull'],
            accessories: ['biceps', 'triceps', 'side_delt', 'rear_delt'],
          };

    case 'lower':
      // Same as legs — squat / hinge alternate lead
      return alt
        ? {
            required: ['hinge', 'squat'],
            optional: [],
            accessories: ['glute_iso', 'calves', 'core'],
          }
        : {
            required: ['squat', 'hinge'],
            optional: [],
            accessories: ['glute_iso', 'calves', 'core'],
          };

    case 'full_body':
      // Full Body A: horizontal push + horizontal pull + squat
      // Full Body B: vertical push + vertical pull + hinge
      return alt
        ? {
            required: ['vertical_push', 'vertical_pull', 'hinge'],
            optional: ['horizontal_push', 'horizontal_pull', 'squat'],
            accessories: ['biceps', 'rear_delt', 'triceps', 'calves'],
          }
        : {
            required: ['horizontal_push', 'horizontal_pull', 'squat'],
            optional: ['vertical_push', 'vertical_pull', 'hinge'],
            accessories: ['biceps', 'triceps', 'side_delt', 'calves'],
          };
  }
}

// ─── Superset Compatibility ───────────────────────────────────────────────────

// Pattern pairs that must NOT be supersetted
const INCOMPATIBLE_PAIRS: [MovementPattern, MovementPattern][] = [
  ['horizontal_push', 'vertical_push'],
  ['horizontal_pull', 'vertical_pull'],
  ['squat', 'hinge'],
];

function canSuperset(a: Exercise, b: Exercise): boolean {
  // Same pattern → no
  if (a.pattern === b.pattern) return false;

  // Incompatible pattern pairs
  for (const [p1, p2] of INCOMPATIBLE_PAIRS) {
    if (
      (a.pattern === p1 && b.pattern === p2) ||
      (a.pattern === p2 && b.pattern === p1)
    )
      return false;
  }

  // Shared primary muscles → no
  const sharedPrimary = a.primaryMuscles.some((m) =>
    b.primaryMuscles.includes(m)
  );
  if (sharedPrimary) return false;

  // A's primary in B's secondary AND B's primary in A's secondary → too close
  const tooClose =
    a.primaryMuscles.some((m) => b.secondaryMuscles.includes(m)) &&
    b.primaryMuscles.some((m) => a.secondaryMuscles.includes(m));
  if (tooClose) return false;

  // Same accessory category → no
  if (
    a.pattern === 'accessory' &&
    b.pattern === 'accessory' &&
    a.accessoryCategory === b.accessoryCategory
  )
    return false;

  return true;
}

// ─── Exercise Selection ───────────────────────────────────────────────────────

function scoreExerciseForFocus(
  exercise: Exercise,
  focusMuscles: FocusMuscle[],
  isPrimary: boolean
): number {
  if (focusMuscles.includes('full_body')) return 1;
  let score = 0;
  for (const focus of focusMuscles) {
    const mapping = FOCUS_TO_PATTERNS[focus];
    const patternMatch = mapping.primary.includes(exercise.pattern);
    if (patternMatch) {
      score += isPrimary ? 3 : 2;
    }
    // Also check muscle-level alignment
    const focusMuscleNames = focusMuscleToMuscles(focus);
    const primaryHit = exercise.primaryMuscles.some((m) =>
      focusMuscleNames.includes(m)
    );
    if (primaryHit) score += isPrimary ? 2 : 1;
  }
  return score;
}

function focusMuscleToMuscles(focus: FocusMuscle): Muscle[] {
  const map: Record<FocusMuscle, Muscle[]> = {
    chest: ['chest'],
    back: ['lats', 'upper_back'],
    shoulders: ['front_delt', 'side_delt', 'rear_delt'],
    arms: ['biceps', 'triceps'],
    legs: ['quads', 'hamstrings'],
    glutes: ['glutes'],
    full_body: [
      'chest',
      'lats',
      'upper_back',
      'front_delt',
      'side_delt',
      'rear_delt',
      'biceps',
      'triceps',
      'quads',
      'hamstrings',
      'glutes',
    ],
  };
  return map[focus];
}

function pickExercise(
  pool: Exercise[],
  pattern: MovementPattern,
  used: Set<string>,
  focusMuscles: FocusMuscle[],
  isPrimary: boolean,
  sessionIndex: number,
  excludeChestAreas?: ('upper' | 'mid' | 'lower')[]
): Exercise | null {
  const candidates = pool
    .filter((ex) => {
      if (ex.pattern !== pattern || used.has(ex.id)) return false;
      if (excludeChestAreas && ex.chestArea && excludeChestAreas.includes(ex.chestArea)) return false;
      return true;
    })
    .map((ex) => ({
      ex,
      score: scoreExerciseForFocus(ex, focusMuscles, isPrimary),
    }))
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return null;

  // Among top-scored candidates, use session index to vary between A/B
  const topScore = candidates[0].score;
  const topCandidates = candidates.filter((c) => c.score === topScore);
  return topCandidates[sessionIndex % topCandidates.length].ex;
}

function pickAccessory(
  pool: Exercise[],
  category: AccessoryCategory,
  used: Set<string>,
  sessionIndex: number
): Exercise | null {
  const candidates = pool.filter(
    (ex) =>
      ex.pattern === 'accessory' &&
      ex.accessoryCategory === category &&
      !used.has(ex.id)
  );
  if (candidates.length === 0) return null;
  return candidates[sessionIndex % candidates.length];
}

// ─── Block Grouping ───────────────────────────────────────────────────────────

function groupIntoBlocks(exercises: Exercise[], goal: Goal, equipment: Equipment): ExerciseBlock[] {
  const repRange = REP_RANGES[goal];
  const restSecs = REST_SECONDS[goal];
  const allowTrisets = equipment === 'bodyweight';

  const toBlockEx = (ex: Exercise): BlockExercise => ({
    exerciseId: ex.id,
    exerciseName: ex.name,
    pattern: ex.pattern,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    sets: 2,
    repRange,
    isCompound: ex.isCompound,
  });

  const labels = 'ABCDEFGHIJ'.split('');
  const blocks: ExerciseBlock[] = [];
  const remaining = [...exercises];
  let labelIdx = 0;

  while (remaining.length > 0) {
    const first = remaining.shift()!;

    // Trisets only allowed for bodyweight programmes
    if (allowTrisets && remaining.length >= 2) {
      const p2Idx = remaining.findIndex((ex) => canSuperset(first, ex));
      if (p2Idx !== -1) {
        const p2 = remaining[p2Idx];
        const p3Idx = remaining.findIndex(
          (ex, i) =>
            i !== p2Idx && canSuperset(first, ex) && canSuperset(p2, ex)
        );
        if (p3Idx !== -1) {
          const p3 = remaining[p3Idx];
          remaining.splice(Math.max(p2Idx, p3Idx), 1);
          remaining.splice(Math.min(p2Idx, p3Idx), 1);
          blocks.push({
            id: `block_${labelIdx}`,
            type: 'triset',
            label: labels[labelIdx++],
            exercises: [toBlockEx(first), toBlockEx(p2), toBlockEx(p3)],
            restSeconds: restSecs,
          });
          continue;
        }
      }
    }

    // Superset
    if (remaining.length >= 1) {
      const pIdx = remaining.findIndex((ex) => canSuperset(first, ex));
      if (pIdx !== -1) {
        const partner = remaining.splice(pIdx, 1)[0];
        blocks.push({
          id: `block_${labelIdx}`,
          type: 'superset',
          label: labels[labelIdx++],
          exercises: [toBlockEx(first), toBlockEx(partner)],
          restSeconds: restSecs,
        });
        continue;
      }
    }

    // Straight set
    blocks.push({
      id: `block_${labelIdx}`,
      type: 'straight',
      label: labels[labelIdx++],
      exercises: [toBlockEx(first)],
      restSeconds: restSecs,
    });
  }

  return blocks;
}

// ─── Duration Estimation ──────────────────────────────────────────────────────

function estimateDuration(blocks: ExerciseBlock[], goal: Goal): number {
  const straight = MINS_PER_STRAIGHT_BLOCK[goal];
  const superset = MINS_PER_SUPERSET_BLOCK[goal];
  const triset = MINS_PER_TRISET_BLOCK[goal];

  const sessionMins = blocks.reduce((total, block) => {
    if (block.type === 'triset') return total + triset;
    if (block.type === 'superset') return total + superset;
    return total + straight;
  }, 0);

  return WARMUP_MINS + sessionMins;
}

// ─── Session Muscle Summary ───────────────────────────────────────────────────

function summariseMuscles(
  exercises: Exercise[]
): { primary: Muscle[]; secondary: Muscle[] } {
  const primary = new Set<Muscle>();
  const secondary = new Set<Muscle>();
  for (const ex of exercises) {
    ex.primaryMuscles.forEach((m) => primary.add(m));
    ex.secondaryMuscles.forEach((m) => secondary.add(m));
  }
  // Remove secondary muscles that are already primary
  for (const m of primary) secondary.delete(m);
  return {
    primary: Array.from(primary),
    secondary: Array.from(secondary),
  };
}

// ─── Session Builder ──────────────────────────────────────────────────────────

function buildSession(
  type: SessionType,
  sessionIndex: number,
  typeIndex: number,
  typeTotal: number,
  inputs: UserInputs,
  pool: Exercise[]
): Session {
  const { goal, sessionDuration, focusMuscles, focusPriority } = inputs;
  const totalSlots = EXERCISE_SLOTS[sessionDuration];
  const template = getTemplate(type, typeIndex);
  const used = new Set<string>();
  const selected: Exercise[] = [];

  // Determine focus priority
  const primaryFocus = focusMuscles[0];

  // ── 1. Select required compound patterns ────────────────────────────────────
  for (const pattern of template.required) {
    if (selected.length >= totalSlots) break;

    const isPrimary =
      primaryFocus !== undefined &&
      (FOCUS_TO_PATTERNS[primaryFocus]?.primary.includes(pattern) ?? false);

    const ex = pickExercise(
      pool,
      pattern,
      used,
      focusMuscles,
      isPrimary,
      typeIndex
    );
    if (ex) {
      selected.push(ex);
      used.add(ex.id);
    }
  }

  // ── 2. If focus boosts a required pattern, add a second exercise ────────────
  if (selected.length < totalSlots) {
    const focusPatterns = focusMuscles.flatMap(
      (f) => FOCUS_TO_PATTERNS[f]?.primary ?? []
    );

    for (const pattern of template.required) {
      if (selected.length >= Math.min(totalSlots, template.required.length + 1))
        break;
      if (!focusPatterns.includes(pattern)) continue;

      // For horizontal_push with chest focus: enforce different chestArea
      const usedChestAreas = selected
        .filter((ex) => ex.pattern === pattern && ex.chestArea)
        .map((ex) => ex.chestArea!);

      const ex = pickExercise(
        pool,
        pattern,
        used,
        focusMuscles,
        true,
        typeIndex + 1,
        usedChestAreas.length > 0 ? usedChestAreas : undefined
      );
      if (ex) {
        selected.push(ex);
        used.add(ex.id);
      }
    }
  }

  // ── 3. Fill optional compound patterns ──────────────────────────────────────
  for (const pattern of template.optional) {
    if (selected.length >= totalSlots) break;
    const ex = pickExercise(
      pool,
      pattern,
      used,
      focusMuscles,
      false,
      sessionIndex
    );
    if (ex) {
      selected.push(ex);
      used.add(ex.id);
    }
  }

  // ── 4. Fill remaining slots with accessories ─────────────────────────────────
  // Focus accessories only apply if this session type is compatible with the focus
  const focusAccessories = focusMuscles.flatMap((f) => {
    const mapping = FOCUS_TO_PATTERNS[f];
    if (!mapping?.compatibleSessions.includes(type)) return [];
    return mapping.accessory;
  });
  const sessionAccessories = template.accessories.filter(
    (a) => !focusAccessories.includes(a)
  );
  const orderedAccessories = [
    ...focusAccessories,
    ...sessionAccessories,
  ] as AccessoryCategory[];

  // For primary/secondary focus, primary accessories get double weight
  const dedupedAccessories: AccessoryCategory[] = [];
  const seen = new Set<string>();
  for (const acc of orderedAccessories) {
    if (!seen.has(acc)) {
      seen.add(acc);
      dedupedAccessories.push(acc);
      // If this is a primary focus accessory and primary > secondary priority, add slot budget
    }
  }

  for (const category of dedupedAccessories) {
    if (selected.length >= totalSlots) break;
    const ex = pickAccessory(pool, category, used, typeIndex);
    if (ex) {
      selected.push(ex);
      used.add(ex.id);
    }
  }

  // ── 5. If primary/secondary mode: add extra accessory for primary focus ──────
  // (only applies if this session type is compatible with the focus muscle)
  const extraFocusCategories =
    primaryFocus && FOCUS_TO_PATTERNS[primaryFocus]?.compatibleSessions.includes(type)
      ? FOCUS_TO_PATTERNS[primaryFocus]?.accessory ?? []
      : [];

  if (
    focusMuscles.length === 2 &&
    focusPriority === 'primary_secondary' &&
    selected.length < totalSlots + 1 &&
    primaryFocus
  ) {
    for (const cat of extraFocusCategories) {
      if (selected.length >= totalSlots + 1) break;
      const ex = pickAccessory(pool, cat, used, typeIndex + 2);
      if (ex) {
        selected.push(ex);
        used.add(ex.id);
      }
    }
  }

  const blocks = groupIntoBlocks(selected, goal, inputs.equipment);
  const duration = estimateDuration(blocks, goal);
  const muscles = summariseMuscles(selected);

  return {
    label: getSessionLabel(type, typeIndex, typeTotal),
    type,
    blocks,
    estimatedDurationMinutes: duration,
    primaryMuscles: muscles.primary,
    secondaryMuscles: muscles.secondary,
  };
}

// ─── Day Assignment ───────────────────────────────────────────────────────────

function assignSessionsToDays(
  trainingDays: Day[],
  sessions: Session[]
): DayPlan[] {
  const sorted = [...trainingDays].sort(
    (a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b)
  );

  const planMap = new Map<Day, Session>();
  sorted.forEach((day, i) => {
    planMap.set(day, sessions[i % sessions.length]);
  });

  return DAYS_ORDER.map((day) => ({
    day,
    isTrainingDay: planMap.has(day),
    session: planMap.get(day) ?? null,
  }));
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function buildProgram(inputs: UserInputs): WeeklyPlan {
  const splitType = determineSplitType(inputs.trainingFrequency);
  const sequence = getSessionSequence(splitType);
  const pool = EXERCISES.filter((ex) => ex.equipment.includes(inputs.equipment));

  // Count how many times each session type appears so labels can use A/B suffixes
  const typeTotals = sequence.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const typeCounters = {} as Record<string, number>;

  const sessions: Session[] = sequence.map((type, i) => {
    const typeIndex = typeCounters[type] ?? 0;
    typeCounters[type] = typeIndex + 1;
    return buildSession(type, i, typeIndex, typeTotals[type], inputs, pool);
  });

  const days = assignSessionsToDays(inputs.trainingDays, sessions);

  return {
    id: `plan_${Date.now()}`,
    userInputs: inputs,
    days,
    createdAt: new Date().toISOString(),
  };
}
