import { describe, it, expect } from 'vitest';
import type { Assignment } from '../types';
import type { DashboardData } from './selectors';
import { buildMonthGrid, shiftMonth, itemsInMonth, WEEKDAY_LABELS } from './calendar';

const NOW = new Date('2026-09-15T09:00:00'); // Tuesday, September 2026

function data(partial: Partial<DashboardData>): DashboardData {
  return {
    assignments: [],
    discussions: [],
    discussionResponses: [],
    readings: [],
    assessments: [],
    ...partial,
  };
}

function assignment(over: Partial<Assignment>): Assignment {
  return {
    id: 'a', courseId: 'c1', title: 'Paper', dueDate: '', dueTime: '', urgency: 'due_soon',
    points: 0, weight: '', estimatedMinutes: 30, prompt: '', rubric: '', requiredReadings: [],
    checklist: [], drafts: [], notes: '', sourcesCited: [], currentPhase: 'draft', ...over,
  } as Assignment;
}

describe('buildMonthGrid', () => {
  it('produces a 6x7 Sunday-first grid labeled with the month', () => {
    const grid = buildMonthGrid(2026, 8, data({}), NOW); // month 8 = September
    expect(grid.label).toBe('September 2026');
    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks.every((w) => w.length === 7)).toBe(true);
    expect(WEEKDAY_LABELS[0]).toBe('Sun');
    // First cell is a Sunday.
    expect(grid.weeks[0][0].date.getDay()).toBe(0);
  });

  it('marks today and in-month days correctly', () => {
    const grid = buildMonthGrid(2026, 8, data({}), NOW);
    const allDays = grid.weeks.flat();
    const today = allDays.find((d) => d.isToday);
    expect(today?.date.getDate()).toBe(15);
    expect(today?.inMonth).toBe(true);
    // Sept 1 2026 is a Tuesday, so the first row has leading August days out of month.
    expect(allDays.some((d) => !d.inMonth)).toBe(true);
  });

  it('places a dated assignment on its day', () => {
    const grid = buildMonthGrid(2026, 8, data({
      assignments: [assignment({ id: 'a1', title: 'Essay', dueDate: '2026-09-18' })],
    }), NOW);
    const day18 = grid.weeks.flat().find((d) => d.inMonth && d.date.getDate() === 18);
    expect(day18?.items.map((i) => i.id)).toContain('a1');
  });

  it('does not place undated items', () => {
    const grid = buildMonthGrid(2026, 8, data({
      assignments: [assignment({ id: 'nodate', dueDate: '' })],
    }), NOW);
    const placed = grid.weeks.flat().some((d) => d.items.some((i) => i.id === 'nodate'));
    expect(placed).toBe(false);
  });
});

describe('shiftMonth', () => {
  it('advances and rolls over the year', () => {
    expect(shiftMonth(2026, 8, 1)).toEqual({ year: 2026, month: 9 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe('itemsInMonth', () => {
  it('returns dated items within the month, sorted', () => {
    const items = itemsInMonth(2026, 8, data({
      assignments: [
        assignment({ id: 'late', title: 'B', dueDate: '2026-09-20' }),
        assignment({ id: 'early', title: 'A', dueDate: '2026-09-05' }),
        assignment({ id: 'oct', title: 'C', dueDate: '2026-10-01' }),
      ],
    }), NOW);
    expect(items.map((i) => i.id)).toEqual(['early', 'late']);
  });
});
