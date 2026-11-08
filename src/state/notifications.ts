import type { Discussion } from '../types';
import {
  type DashboardData,
  collectDueItems,
  replyProgress,
  parseDueDate,
  daysUntil,
} from './selectors';

/**
 * Notifications / reminders engine (spec: notifications / M4).
 *
 * Pure and testable (notifications.test.ts). Derives alerts from the student's real data:
 *  - assignments/discussions/tests due within configurable day windows (default 7/3/1/0)
 *  - overdue work
 *  - discussion initial posts not yet submitted near their deadline
 *  - required peer replies still incomplete near the response deadline
 *
 * No fabrication: every alert points at a real entity. The engine computes alerts on demand;
 * callers may persist read/dismissed state separately.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertKind =
  | 'due_soon'
  | 'overdue'
  | 'discussion_post_due'
  | 'replies_incomplete'
  | 'test_approaching';

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  message: string;
  entityId: string;
  courseId?: string;
  dueInDays?: number;
}

export interface NotificationRules {
  /** Day thresholds at which a "due soon" reminder fires (must be >= 0). */
  dueWindows: number[];
  /** Warn about discussion posts / replies when within this many days of the deadline. */
  discussionWindow: number;
  /** Warn about tests when within this many days. */
  testWindow: number;
}

export const DEFAULT_RULES: NotificationRules = {
  dueWindows: [7, 3, 1, 0],
  discussionWindow: 3,
  testWindow: 7,
};

function severityForDays(days: number): AlertSeverity {
  if (days < 0) return 'critical';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  return 'info';
}

function dayPhrase(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

/**
 * Build the current set of alerts from the data. `rules` is configurable so the student can
 * tune reminder windows (editable per spec R36).
 */
export function buildNotifications(
  data: DashboardData,
  now: Date,
  rules: NotificationRules = DEFAULT_RULES,
): Alert[] {
  const alerts: Alert[] = [];
  const maxWindow = Math.max(0, ...rules.dueWindows);

  // Dated assignments / discussion-posts / discussion-responses / assessments via the shared
  // due-item collector. Each becomes overdue or due-soon depending on days remaining.
  for (const item of collectDueItems(data, now)) {
    if (!item.due) continue;
    const days = daysUntil(item.due, now);

    if (days < 0) {
      alerts.push({
        id: `overdue:${item.id}`,
        kind: 'overdue',
        severity: 'critical',
        message: `${item.title} is ${dayPhrase(days)}.`,
        entityId: item.sourceId,
        courseId: item.courseId,
        dueInDays: days,
      });
      continue;
    }

    // Fire a due-soon reminder only when today crosses one of the configured windows.
    if (days <= maxWindow && rules.dueWindows.includes(days)) {
      const kind: AlertKind =
        item.kind === 'assessment'
          ? 'test_approaching'
          : item.kind === 'discussion_post'
            ? 'discussion_post_due'
            : 'due_soon';
      alerts.push({
        id: `due:${item.id}:${days}`,
        kind,
        severity: severityForDays(days),
        message: `${item.title} is ${dayPhrase(days)}.`,
        entityId: item.sourceId,
        courseId: item.courseId,
        dueInDays: days,
      });
    }
  }

  // Assessments approaching within the test window even if not caught by exact due-windows.
  for (const s of data.assessments) {
    if (s.studyStatus === 'completed') continue;
    const due = parseDueDate(s.date, now);
    if (!due) continue;
    const days = daysUntil(due, now);
    if (days >= 0 && days <= rules.testWindow && !rules.dueWindows.includes(days)) {
      alerts.push({
        id: `test:${s.id}`,
        kind: 'test_approaching',
        severity: severityForDays(days),
        message: `${s.name} (${dayPhrase(days)}). Time to plan study sessions.`,
        entityId: s.id,
        courseId: s.courseId,
        dueInDays: days,
      });
    }
  }

  // Discussion-specific reminders: initial post not submitted / required replies incomplete,
  // when near the relevant deadline.
  for (const d of data.discussions) {
    const responses = data.discussionResponses.filter((r) => r.discussionId === d.id);
    const progress = replyProgress(d as Discussion, responses);
    const postDue = parseDueDate((d as Discussion).initialPostDeadline, now);
    const replyDue = parseDueDate((d as Discussion).responseDeadline, now);

    if ((d as Discussion).originalPost?.status !== 'submitted' && postDue) {
      const days = daysUntil(postDue, now);
      if (days >= 0 && days <= rules.discussionWindow) {
        alerts.push({
          id: `disc-post:${d.id}`,
          kind: 'discussion_post_due',
          severity: severityForDays(days),
          message: `Initial post for “${(d as Discussion).title}” is ${dayPhrase(days)} and not submitted yet.`,
          entityId: d.id,
          courseId: d.courseId,
          dueInDays: days,
        });
      }
    }

    if (progress.remaining > 0 && replyDue) {
      const days = daysUntil(replyDue, now);
      if (days >= 0 && days <= rules.discussionWindow) {
        alerts.push({
          id: `disc-replies:${d.id}`,
          kind: 'replies_incomplete',
          severity: severityForDays(days),
          message: `${progress.remaining} repl${progress.remaining === 1 ? 'y' : 'ies'} remaining for “${(d as Discussion).title}” (${dayPhrase(days)}).`,
          entityId: d.id,
          courseId: d.courseId,
          dueInDays: days,
        });
      }
    }
  }

  // Most urgent first (overdue, then soonest), then critical severity.
  const sevRank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => {
    const da = a.dueInDays ?? Number.MAX_SAFE_INTEGER;
    const db = b.dueInDays ?? Number.MAX_SAFE_INTEGER;
    if (da !== db) return da - db;
    return sevRank[a.severity] - sevRank[b.severity];
  });

  return alerts;
}

/** Count unread/undismissed alerts (caller supplies the dismissed id set). */
export function unreadCount(alerts: Alert[], dismissed: Set<string> = new Set()): number {
  return alerts.filter((a) => !dismissed.has(a.id)).length;
}
