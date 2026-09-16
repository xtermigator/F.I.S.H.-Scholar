import type {
  Assignment,
  Course,
  Discussion,
  DiscussionResponse,
  Reading,
  Assessment,
  ReplyProgress,
} from '../types';

/**
 * Pure, testable selectors that power the Today / This Week dashboards, per-course workload
 * indicators, discussion reply-progress, and the single "Start Here" recommendation.
 *
 * These functions never mutate their inputs and take an explicit `now` so behaviour is
 * deterministic under test (see selectors.test.ts). See design.md §5.
 */

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight (local) for a given date. */
export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/**
 * Best-effort parse of a due-date value. New entities store ISO 8601 strings; the legacy
 * prototype used free text like "Tonight" or "Thursday, Sep 3". We parse what we safely can
 * and return null otherwise — we never fabricate a date (academic-integrity steering).
 */
export function parseDueDate(value: string | undefined, now: Date): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'tonight' || lower === 'today') return startOfDay(now);
  if (lower === 'tomorrow') return startOfDay(new Date(now.getTime() + DAY_MS));

  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return new Date(iso);

  return null;
}

export function daysUntil(due: Date, now: Date): number {
  return Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** True when `date` falls within the 7-day window starting at `now`'s day (inclusive). */
export function isWithinThisWeek(date: Date, now: Date): boolean {
  const diff = daysUntil(date, now);
  return diff >= 0 && diff <= 6;
}

// ---------------------------------------------------------------------------
// Completion helpers
// ---------------------------------------------------------------------------

const DONE_STATUSES = new Set(['completed', 'submitted', 'graded']);

export function isAssignmentDone(a: Pick<Assignment, 'urgency'> & { status?: string }): boolean {
  if (a.status && DONE_STATUSES.has(a.status)) return true;
  return a.urgency === 'completed';
}

export function assignmentPercentComplete(a: Assignment): number {
  if (!a.checklist || a.checklist.length === 0) return isAssignmentDone(a) ? 100 : 0;
  const done = a.checklist.filter((i) => i.completed).length;
  return Math.round((done / a.checklist.length) * 100);
}

// ---------------------------------------------------------------------------
// Discussion reply progress (R4)
// ---------------------------------------------------------------------------

/**
 * Compute reply progress for a discussion. Drives "X / N replies", "N remaining",
 * follow-up flags, and "classmates replied to me".
 */
export function replyProgress(
  discussion: Pick<Discussion, 'minResponses'>,
  responses: DiscussionResponse[],
): ReplyProgress {
  const outgoing = responses.filter((r) => r.direction !== 'incoming');
  const completed = outgoing.filter((r) => r.submitted).length;
  const required = Math.max(0, discussion.minResponses ?? 0);
  const remaining = Math.max(0, required - completed);
  const followUps = responses.filter((r) => r.followUpRequired).length;
  const incomingUnanswered = responses.filter(
    (r) => r.direction === 'incoming' && !r.submitted,
  ).length;
  return { required, completed, remaining, followUps, incomingUnanswered };
}

export function isDiscussionComplete(
  discussion: Discussion,
  responses: DiscussionResponse[],
): boolean {
  const posted = discussion.originalPost?.status === 'submitted';
  const { remaining } = replyProgress(discussion, responses);
  return posted && remaining === 0;
}

// ---------------------------------------------------------------------------
// Due / upcoming aggregation
// ---------------------------------------------------------------------------

export type DueKind =
  | 'assignment'
  | 'discussion_post'
  | 'discussion_response'
  | 'reading'
  | 'assessment';

export interface DueItem {
  id: string;
  kind: DueKind;
  title: string;
  courseId?: string;
  due: Date | null;
  overdue: boolean;
  dueToday: boolean;
  sourceId: string;
}

export interface DashboardData {
  assignments: Assignment[];
  discussions: Discussion[];
  discussionResponses: DiscussionResponse[];
  readings: Reading[];
  assessments: Assessment[];
}

/** Build a flat, normalized list of everything with a date that still needs attention. */
export function collectDueItems(data: DashboardData, now: Date): DueItem[] {
  const items: DueItem[] = [];

  for (const a of data.assignments) {
    if (isAssignmentDone(a)) continue;
    const due = parseDueDate(a.dueDate, now);
    items.push(makeDueItem(a.id, 'assignment', a.title, a.courseId, due, now));
  }

  for (const d of data.discussions) {
    if (d.originalPost?.status !== 'submitted') {
      const due = parseDueDate(d.initialPostDeadline, now);
      items.push(makeDueItem(d.id, 'discussion_post', d.title, d.courseId, due, now));
    }
    const responses = data.discussionResponses.filter((r) => r.discussionId === d.id);
    const { remaining } = replyProgress(d, responses);
    if (remaining > 0) {
      const due = parseDueDate(d.responseDeadline, now);
      items.push(
        makeDueItem(
          `${d.id}:responses`,
          'discussion_response',
          `${d.title} — ${remaining} repl${remaining === 1 ? 'y' : 'ies'} remaining`,
          d.courseId,
          due,
          now,
        ),
      );
    }
  }

  for (const r of data.readings) {
    if (r.status === 'completed') continue;
    // Readings often have no explicit date; include only if we can place them.
    items.push(makeDueItem(r.id, 'reading', r.title, r.courseId, null, now));
  }

  for (const s of data.assessments) {
    if (s.studyStatus === 'completed') continue;
    const due = parseDueDate(s.date, now);
    items.push(makeDueItem(s.id, 'assessment', s.name, s.courseId, due, now));
  }

  return items;
}

function makeDueItem(
  id: string,
  kind: DueKind,
  title: string,
  courseId: string | undefined,
  due: Date | null,
  now: Date,
): DueItem {
  const overdue = due != null && daysUntil(due, now) < 0;
  const today = due != null && isSameDay(due, now);
  return { id, kind, title, courseId, due, overdue, dueToday: today, sourceId: id };
}

/** Items due today or overdue (R5.1). */
export function dueToday(data: DashboardData, now: Date): DueItem[] {
  return collectDueItems(data, now).filter((i) => i.dueToday || i.overdue);
}

/** Items due within the current 7-day window, grouped by course (R5.2). */
export function dueThisWeek(data: DashboardData, now: Date): DueItem[] {
  return collectDueItems(data, now).filter((i) => i.due != null && isWithinThisWeek(i.due, now));
}

// ---------------------------------------------------------------------------
// Workload indicator (R5.3) — transparent, not a black box
// ---------------------------------------------------------------------------

export type WorkloadLevel = 'Light' | 'Moderate' | 'Heavy' | 'Critical';

export interface WorkloadResult {
  courseId: string;
  score: number;
  level: WorkloadLevel;
  rationale: string;
  openItems: number;
  overdue: number;
  dueThisWeek: number;
}

/**
 * Compute a course's weekly workload with an explanation the UI can show. The score is a
 * simple, inspectable weighting of open items, due-soon proximity, and overdue work — never a
 * hidden number (see .kiro/steering/product.md priority-engine principle).
 */
export function workloadForCourse(
  course: Pick<Course, 'id'>,
  data: DashboardData,
  now: Date,
): WorkloadResult {
  const items = collectDueItems(data, now).filter((i) => i.courseId === course.id);
  const overdue = items.filter((i) => i.overdue).length;
  const thisWeek = items.filter((i) => i.due != null && isWithinThisWeek(i.due, now)).length;
  const openItems = items.length;

  // Transparent weighting.
  const score = openItems * 1 + thisWeek * 2 + overdue * 4;

  let level: WorkloadLevel = 'Light';
  if (score >= 12) level = 'Critical';
  else if (score >= 7) level = 'Heavy';
  else if (score >= 3) level = 'Moderate';

  const parts: string[] = [];
  if (openItems) parts.push(`${openItems} open item${openItems === 1 ? '' : 's'}`);
  if (thisWeek) parts.push(`${thisWeek} due this week`);
  if (overdue) parts.push(`${overdue} overdue`);
  const rationale = parts.length
    ? `${level}: ${parts.join(', ')}.`
    : `${level}: nothing outstanding.`;

  return { courseId: course.id, score, level, rationale, openItems, overdue, dueThisWeek: thisWeek };
}

// ---------------------------------------------------------------------------
// Start Here (R5.4)
// ---------------------------------------------------------------------------

export interface NextAction {
  item: DueItem;
  reason: string;
}

/**
 * Pick a single recommended next action to reduce executive-function overwhelm. Priority:
 * overdue first, then due today, then soonest dated, preferring items with a follow-up flag.
 */
export function recommendedNextAction(data: DashboardData, now: Date): NextAction | null {
  const items = collectDueItems(data, now);
  if (items.length === 0) return null;

  const ranked = [...items].sort((a, b) => {
    const rank = (i: DueItem) => {
      if (i.overdue) return 0;
      if (i.dueToday) return 1;
      if (i.due != null) return 2;
      return 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    const at = a.due ? a.due.getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.due ? b.due.getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt;
  });

  const top = ranked[0];
  let reason: string;
  if (top.overdue) reason = 'This is overdue — a small first step now reduces the backlog.';
  else if (top.dueToday) reason = 'Due today. Start with one focused block.';
  else if (top.due) reason = `Due ${top.due.toLocaleDateString()}. Getting ahead now keeps the week calm.`;
  else reason = 'No date yet — a quick pass will clarify the next step.';

  return { item: top, reason };
}
