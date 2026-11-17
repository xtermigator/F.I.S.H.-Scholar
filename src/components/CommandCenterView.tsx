import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CalendarDays,
  AlertCircle,
  ArrowRight,
  MessagesSquare,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Bell,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { useStore } from "../state/store";
import {
  dueToday,
  dueThisWeek,
  workloadForCourse,
  recommendedNextAction,
  type DashboardData,
  type DueItem,
  type WorkloadLevel,
} from "../state/selectors";
import {
  buildNotifications,
  type Alert,
  type AlertSeverity,
} from "../state/notifications";
import type { TabType } from "../types";

/**
 * Command Center dashboard: Today, This Week, per-course workload, and a single "Start Here"
 * recommendation to reduce executive-function load (spec R5; product + accessibility steering).
 * Status is conveyed with text + icon, never color alone.
 */

const KIND_ICON: Record<
  DueItem["kind"],
  React.ComponentType<{ className?: string }>
> = {
  assignment: ClipboardList,
  discussion_post: MessagesSquare,
  discussion_response: MessagesSquare,
  reading: BookOpen,
  assessment: GraduationCap,
};

const KIND_LABEL: Record<DueItem["kind"], string> = {
  assignment: "Assignment",
  discussion_post: "Discussion post",
  discussion_response: "Peer replies",
  reading: "Reading",
  assessment: "Test / quiz",
};

const WORKLOAD_STYLE: Record<WorkloadLevel, string> = {
  Light: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Moderate: "bg-sky-50 text-sky-800 border-sky-200",
  Heavy: "bg-amber-50 text-amber-800 border-amber-200",
  Critical: "bg-red-50 text-red-800 border-red-200",
};

export const CommandCenterView: React.FC<{
  onNavigate?: (tab: TabType) => void;
}> = ({ onNavigate }) => {
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
  const resumeNote = store.notes.find(
    (note) => note.id === "personal-resume-note",
  );
  const [resume, setResume] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  useEffect(() => {
    setResume(resumeNote?.body ?? "");
  }, [resumeNote?.body]);
  const saveResume = async () => {
    if (store.loading || resume === (resumeNote?.body ?? "")) return;
    const timestamp = new Date().toISOString();
    try {
      await store.save("notes", {
        id: "personal-resume-note",
        title: "Pick up where I left off",
        body: resume,
        createdAt: resumeNote?.createdAt ?? timestamp,
        updatedAt: timestamp,
      }, { throwOnError: true });
      setNoteStatus("Saved on this device");
    } catch {
      setNoteStatus("Could not save. Keep this page open and try again.");
    }
  };
  const openWork = (item: DueItem) =>
    onNavigate?.(
      item.kind.startsWith("discussion")
        ? "DISCUSS"
        : item.kind === "assignment"
          ? "ASSIGNMENTS"
          : item.kind === "reading"
            ? "STUDY"
            : "CALENDAR",
    );

  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const alerts = buildNotifications(data, now).filter(
    (a) => !dismissed.has(a.id),
  );
  const dismissAlert = (id: string) =>
    setDismissed((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(id);
      return nextSet;
    });

  const courseLabel = (courseId?: string) => {
    if (!courseId) return "General";
    const c = store.courses.find((x) => x.id === courseId);
    return c ? c.code : "Course";
  };

  return (
    <section aria-labelledby="cc-heading" className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="workspace-eyebrow">Your personal workspace</p>
          <h1 id="cc-heading" className="workspace-title">
            Room to think. A plan to move.
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Your courses, research, and next steps, together.
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="workspace-hero grid items-center gap-7 p-6 sm:p-8 xl:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100">
            One place to begin
          </p>
          <h2 className="mt-4 max-w-lg font-serif text-3xl leading-tight text-white sm:text-4xl">
            Make space for your
            <br className="hidden sm:block" /> next good idea.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-teal-50/90">
            Start with your syllabus, connect your sources, and carry your
            thinking from one course to the next.
          </p>
          <button
            onClick={() => onNavigate?.("SYLLABUS")}
            className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl bg-[#e8f0dc] px-5 text-sm font-semibold text-[#193e37] hover:bg-white"
          >
            Upload a syllabus <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-5">
          {[
            {
              icon: GraduationCap,
              title: "Your coursework",
              text: `${store.courses.length} courses in one workspace`,
              tab: "COURSES",
            },
            {
              icon: BookOpen,
              title: "Your evidence",
              text: `${store.citations.length} sources to build on`,
              tab: "LIBRARY",
            },
            {
              icon: ClipboardList,
              title: "Your next step",
              text: `${store.assignments.filter((item) => item.status !== "submitted").length} open assignments`,
              tab: "ASSIGNMENTS",
            },
          ].map(({ icon: Icon, title, text, tab }) => (
            <button
              key={tab}
              onClick={() => onNavigate?.(tab as TabType)}
              className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/10 p-4 text-left transition-colors hover:bg-white/20"
            >
              <Icon
                className="h-5 w-5 shrink-0 text-[#dbecc9]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-teal-50/80">{text}</p>
              </div>
              <ArrowRight
                className="h-4 w-4 text-white/60"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Active courses",
            value: store.courses.length,
            tab: "COURSES",
          },
          {
            label: "Due today & overdue",
            value: today.length,
            tab: "CALENDAR",
          },
          { label: "This week", value: week.length, tab: "CALENDAR" },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => onNavigate?.(stat.tab as TabType)}
            className="workspace-card flex items-center justify-between text-left hover:border-teal-500"
          >
            <span className="text-sm text-neutral-600">{stat.label}</span>
            <span className="font-serif text-3xl text-[#193e37]">
              {stat.value}
            </span>
          </button>
        ))}
      </div>

      <div className="workspace-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="resume-note"
            className="font-serif text-xl text-[#193e37]"
          >
            Pick up where you left off
          </label>
          <span role="status" className="text-xs text-neutral-500">
            {noteStatus}
          </span>
        </div>
        <textarea
          id="resume-note"
          value={resume}
          disabled={store.loading}
          onChange={(event) => {
            setResume(event.target.value);
            setNoteStatus("Unsaved note");
          }}
          onBlur={() => void saveResume()}
          rows={2}
          placeholder="Leave your next step, an open question, or a thought to return to…"
          className="mt-4 w-full resize-y rounded-xl border border-[#dfe6df] bg-[#f8faf5] p-3 text-sm leading-6 outline-offset-2"
        />
        <button
          onClick={() => void saveResume()}
          className="workspace-button mt-2"
        >
          Save note
        </button>
      </div>

      {/* Start Here */}
      {next && (
        <div className="rounded-2xl border border-[#d5dfbc] bg-[#eff3e3] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
            Start here
          </p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-neutral-900">
                {next.item.title}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">{next.reason}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-200">
              {courseLabel(next.item.courseId)}
            </span>
          </div>
          <button
            onClick={() => openWork(next.item)}
            className="workspace-button mt-4"
          >
            Open next step <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Reminders / notifications */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            <h2 className="font-semibold text-neutral-900">Reminders</h2>
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {alerts.length}
            </span>
          </div>
          <ul className="space-y-2">
            {alerts.slice(0, 8).map((a) => (
              <AlertRow
                key={a.id}
                alert={a}
                courseLabel={courseLabel}
                onDismiss={dismissAlert}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle
              className="h-4 w-4 text-neutral-500"
              aria-hidden="true"
            />
            <h2 className="font-semibold text-neutral-900">
              Today &amp; overdue
            </h2>
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {today.length}
            </span>
          </div>
          <DueList
            items={today}
            courseLabel={courseLabel}
            emptyText="Nothing due today. A little room to think."
            onOpen={openWork}
          />
        </div>

        {/* This Week */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays
              className="h-4 w-4 text-neutral-500"
              aria-hidden="true"
            />
            <h2 className="font-semibold text-neutral-900">This week</h2>
            <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {week.length}
            </span>
          </div>
          <DueList
            items={week}
            courseLabel={courseLabel}
            emptyText="No dated items this week."
            onOpen={openWork}
          />
        </div>
      </div>

      {/* Course workload */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-neutral-900">
          Course workload this week
        </h2>
        {store.courses.length === 0 ? (
          <p className="text-sm text-neutral-500">No courses yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {store.courses.map((c) => {
              const w = workloadForCourse({ id: c.id }, data, now);
              return (
                <li
                  key={c.id}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">
                      {c.code}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${WORKLOAD_STYLE[w.level]}`}
                    >
                      {w.level}
                    </span>
                  </div>
                  {c.title && (
                    <p className="mt-0.5 text-xs text-neutral-500">{c.title}</p>
                  )}
                  {/* Transparent rationale — never a black-box score */}
                  <p className="mt-2 text-xs text-neutral-600">{w.rationale}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {store.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
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
  onOpen: (item: DueItem) => void;
}> = ({ items, courseLabel, emptyText, onOpen }) => {
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
            <Icon
              className="h-4 w-4 shrink-0 text-neutral-500"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">
                {i.title}
              </p>
              <p className="text-[11px] text-neutral-500">
                {KIND_LABEL[i.kind]} · {courseLabel(i.courseId)}
                {i.overdue && (
                  <span className="ml-1 font-semibold text-red-700">
                    · Overdue
                  </span>
                )}
                {!i.overdue && i.dueToday && (
                  <span className="ml-1 font-semibold text-amber-700">
                    · Due today
                  </span>
                )}
                {!i.overdue && !i.dueToday && i.due && (
                  <span className="ml-1">
                    · Due {i.due.toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => onOpen(i)}
              aria-label={`Open ${i.title}`}
              className="workspace-button"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

// Severity styling — conveyed with icon + text label, never color alone (accessibility steering).
const SEVERITY_ICON: Record<
  AlertSeverity,
  React.ComponentType<{ className?: string }>
> = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "Urgent",
  warning: "Soon",
  info: "Heads-up",
};

const SEVERITY_ICON_STYLE: Record<AlertSeverity, string> = {
  critical: "text-red-600",
  warning: "text-amber-600",
  info: "text-sky-600",
};

const AlertRow: React.FC<{
  alert: Alert;
  courseLabel: (id?: string) => string;
  onDismiss: (id: string) => void;
}> = ({ alert, courseLabel, onDismiss }) => {
  const Icon = SEVERITY_ICON[alert.severity];
  return (
    <li className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2">
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_ICON_STYLE[alert.severity]}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-800">{alert.message}</p>
        <p className="text-[11px] text-neutral-500">
          {SEVERITY_LABEL[alert.severity]}
          {alert.courseId ? ` · ${courseLabel(alert.courseId)}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss reminder"
        className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </li>
  );
};
