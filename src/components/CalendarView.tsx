import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../state/store';
import {
  buildMonthGrid,
  shiftMonth,
  itemsInMonth,
  WEEKDAY_LABELS,
} from '../state/calendar';
import type { DashboardData, DueItem } from '../state/selectors';

/**
 * Semester calendar — month view (spec R22). Reads dated items from the store via the pure
 * calendar engine. Course labels differentiate items; status is text, not color-only.
 */

const KIND_DOT: Record<DueItem['kind'], string> = {
  assignment: 'bg-neutral-700',
  discussion_post: 'bg-amber-600',
  discussion_response: 'bg-amber-500',
  reading: 'bg-sky-600',
  assessment: 'bg-red-600',
};

const KIND_LABEL: Record<DueItem['kind'], string> = {
  assignment: 'Assignment',
  discussion_post: 'Discussion post',
  discussion_response: 'Peer replies',
  reading: 'Reading',
  assessment: 'Test / quiz',
};

export const CalendarView: React.FC = () => {
  const store = useStore();
  const now = useMemo(() => new Date(), []);
  const [{ year, month }, setYm] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }));

  const data: DashboardData = {
    assignments: store.assignments,
    discussions: store.discussions,
    discussionResponses: store.discussionResponses,
    readings: store.readings,
    assessments: store.assessments,
  };

  const grid = useMemo(() => buildMonthGrid(year, month, data, now), [year, month, data, now]);
  const monthItems = useMemo(() => itemsInMonth(year, month, data, now), [year, month, data, now]);

  const courseCode = (courseId?: string) =>
    courseId ? store.courses.find((c) => c.id === courseId)?.code : undefined;

  return (
    <section aria-labelledby="cal-heading" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-5 w-5 text-amber-600" aria-hidden="true" />
          <div>
            <h1 id="cal-heading" className="text-lg font-serif font-bold text-neutral-900">
              Calendar
            </h1>
            <p className="text-xs text-neutral-500">Everything with a date, across your courses.</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setYm(shiftMonth(year, month, -1))}
            aria-label="Previous month"
            className="rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-semibold text-neutral-900" aria-live="polite">
            {grid.label}
          </span>
          <button
            type="button"
            onClick={() => setYm(shiftMonth(year, month, 1))}
            aria-label="Next month"
            className="rounded-lg border border-neutral-200 bg-white p-1.5 text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setYm({ year: now.getFullYear(), month: now.getMonth() })}
            className="ml-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Today
          </button>
        </div>
      </header>

      {/* Month grid (hidden on very small screens in favor of the agenda list below) */}
      <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:block">
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="px-2 py-1.5 text-center text-[11px] font-semibold text-neutral-500">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.weeks.flat().map((day, idx) => (
            <div
              key={idx}
              className={`min-h-[84px] border-b border-r border-neutral-100 p-1.5 ${
                day.inMonth ? 'bg-white' : 'bg-neutral-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    day.isToday
                      ? 'bg-neutral-900 font-bold text-white'
                      : day.inMonth
                        ? 'text-neutral-700'
                        : 'text-neutral-400'
                  }`}
                >
                  {day.date.getDate()}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {day.items.slice(0, 3).map((i) => (
                  <li key={i.id} className="flex items-center gap-1" title={`${KIND_LABEL[i.kind]}: ${i.title}`}>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[i.kind]}`} aria-hidden="true" />
                    <span className="truncate text-[10px] text-neutral-600">
                      {courseCode(i.courseId) ? `${courseCode(i.courseId)}: ` : ''}
                      {i.title}
                    </span>
                  </li>
                ))}
                {day.items.length > 3 && (
                  <li className="text-[10px] text-neutral-400">+{day.items.length - 3} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda list — the primary calendar surface on mobile, and a companion on desktop */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">This month</h2>
        {monthItems.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing dated in {grid.label}.</p>
        ) : (
          <ul className="space-y-2">
            {monthItems.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${KIND_DOT[i.kind]}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{i.title}</p>
                  <p className="text-[11px] text-neutral-500">
                    {KIND_LABEL[i.kind]}
                    {courseCode(i.courseId) ? ` · ${courseCode(i.courseId)}` : ''}
                    {i.due ? ` · ${i.due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}
                    {i.overdue ? ' · Overdue' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
