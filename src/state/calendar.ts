import {
  type DashboardData,
  type DueItem,
  collectDueItems,
  startOfDay,
} from './selectors';

/**
 * Calendar engine (spec R22 — semester calendar / month view). Pure and testable
 * (calendar.test.ts). Builds a 6-row month grid (Sunday-first) and buckets dated items
 * (assignments, discussion posts/replies, tests) onto their day.
 *
 * Reuses the shared due-item collector so the calendar shows exactly what the dashboards do —
 * no separate, drifting source of truth. Undated items are simply not placed (never invented).
 */

export interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: DueItem[];
}

export interface MonthGrid {
  year: number;
  month: number; // 0-11
  label: string; // e.g. "September 2026"
  weeks: CalendarDay[][]; // 6 rows x 7 days
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * Build a month grid for (year, month), placing dated due-items on their day.
 * Always 6 weeks (42 cells) so the layout is stable across months.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  data: DashboardData,
  now: Date,
): MonthGrid {
  const items = collectDueItems(data, now).filter((i) => i.due != null);

  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay()); // back up to Sunday

  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + w * 7 + d);
      const dayItems = items.filter((i) => i.due && sameDay(i.due, cellDate));
      row.push({
        date: cellDate,
        inMonth: cellDate.getMonth() === month,
        isToday: sameDay(cellDate, now),
        items: dayItems,
      });
    }
    weeks.push(row);
  }

  return {
    year,
    month,
    label: `${MONTH_NAMES[month]} ${year}`,
    weeks,
  };
}

/** Step a (year, month) pair by ±1 month, handling year rollover. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const base = new Date(year, month + delta, 1);
  return { year: base.getFullYear(), month: base.getMonth() };
}

/** All dated items in a given month, sorted by date (for a list/agenda view). */
export function itemsInMonth(
  year: number,
  month: number,
  data: DashboardData,
  now: Date,
): DueItem[] {
  return collectDueItems(data, now)
    .filter((i) => i.due != null && i.due.getFullYear() === year && i.due.getMonth() === month)
    .sort((a, b) => (a.due!.getTime() - b.due!.getTime()));
}
