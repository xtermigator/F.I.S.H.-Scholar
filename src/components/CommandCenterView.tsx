import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CalendarDays,
  AlertCircle,
  ArrowRight,
  MessagesSquare,
  BookOpen,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';
import { useStore } from '../state/store';
import {
  dueToday,
  dueThisWeek,
  workloadForCourse,
  recommendedNextAction,
  type DashboardData,
  type DueItem,
  type WorkloadLevel,
} from '../state/selectors';

/**
 * Command Center dashboard: Today, This Week, per-course workload, and a single "Start Here"
 * recommendation to reduce executive-function load (spec R5; product + accessibility steering).
 * Status is conveyed with text + icon, never color alone.
 */

const KIND_ICON: Record<DueItem['kind'], React.ComponentType<{ className?: string }>> = {
  assignment: ClipboardList,
  discussion_post: MessagesSquare,
  discussion_response: MessagesSquare,
  reading: BookOpen,
  assessment: GraduationCap,
};

const KIND_LABEL: Record<DueItem['kind'], string> = {
  assignment: 'Assignment',
  discussion_post: 'Discussion post',
  discussion_response: 'Peer replies',
  reading: 'Reading',
  assessment: 'Test / quiz',
};

const WORKLOAD_STYLE: Record<WorkloadLevel, string> = {
  Light: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Moderate: 'bg-sky-50 text-sky-800 border-sky-200',
  Heavy: 'bg-amber-50 text-amber-800 border-amber-200',
  Critical: 'bg-red-50 text-red-800 border-red-200',
};

export const CommandCenterView: React.FC = () => {
  const store = useStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const data: DashboardData = {
    assignments: store.assignments,
    discussions: store.discussions,
    discussionResponses: store.discussionResponses,
    readings: store.readings,
    assessments: store.assessments,
  };

  const today = dueToday(data, now);
  const week = dueThisWeek(data, now);
  const next = recommendedNextAction(data, now);

  const courseLabel = (courseId?: string) => {
    if (!courseId) return 'General';
    const c = store.courses.find((x) => x.id === courseId);
    return c ? c.code : 'Course';
  };

  return (
    <section aria-labelledby="cc-heading" className="space-y-6">
      <header className="flex items-center gap-2.5">
        <Sparkles className="h-5 w-5 text-amber-600" aria-hidden="true" />
        <div>
          <h1 id="cc-heading" className="text-lg font-serif font-bold text-neutral-900">
            Command Center
          </h1>
          <p className="text-xs text-neutral-500">
            What needs your attention, across every course.
          </p>
        </div>
      </header>

      {/* Start Here */}
      {next && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Start here
          </p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-neutral-900">{next.item.title}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{next.reason}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200">
              {courseLabel(next.item.courseId)}
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            <h2 className="font-semibold text-neutral-900">Today &amp; overdue</h2>
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {today.length}
            </span>
          </div>
          <DueList items={today} courseLabel={courseLabel} emptyText="Nothing due today. 🎉" />
        </div>

        {/* This Week */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            <h2 className="font-semibold text-neutral-900">This week</h2>
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {week.length}
            </span>
          </div>
          <DueList items={week} courseLabel={courseLabel} emptyText="No dated items this week." />
        </div>
      </div>

      {/* Course workload */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-neutral-900">Course workload this week</h2>
        {store.courses.length === 0 ? (
          <p className="text-sm text-neutral-500">No courses yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {store.courses.map((c) => {
              const w = workloadForCourse({ id: c.id }, data, now);
              return (
                <li key={c.id} className="rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">{c.code}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${WORKLOAD_STYLE[w.level]}`}
                    >
                      {w.level}
                    </span>
                  </div>
                  {c.title && <p className="mt-0.5 text-xs text-neutral-500">{c.title}</p>}
                  {/* Transparent rationale — never a black-box score */}
                  <p className="mt-2 text-xs text-neutral-600">{w.rationale}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {store.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {store.error}
        </p>
      )}
    </section>
  );
};

const DueList: React.FC<{
  items: DueItem[];
  courseLabel: (id?: string) => string;
  emptyText: string;
}> = ({ items, courseLabel, emptyText }) => {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((i) => {
        const Icon = KIND_ICON[i.kind];
        return (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2"
          >
            <Icon className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">{i.title}</p>
              <p className="text-[11px] text-neutral-500">
                {KIND_LABEL[i.kind]} · {courseLabel(i.courseId)}
                {i.overdue && (
                  <span className="ml-1 font-semibold text-red-700">· Overdue</span>
                )}
                {!i.overdue && i.dueToday && (
                  <span className="ml-1 font-semibold text-amber-700">· Due today</span>
                )}
                {!i.overdue && !i.dueToday && i.due && (
                  <span className="ml-1">· Due {i.due.toLocaleDateString()}</span>
                )}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
          </li>
        );
      })}
    </ul>
  );
};
