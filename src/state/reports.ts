import type {
  Course,
  Discussion,
  DiscussionResponse,
  Citation,
} from '../types';
import {
  type DashboardData,
  dueThisWeek,
  collectDueItems,
  replyProgress,
} from './selectors';
import { summarizeGrades } from './grades';

/**
 * Reports / export engine (spec R41). Produces plain **Markdown** summaries from the student's
 * real data — no fabrication. Each report is a pure function of its inputs (reports.test.ts),
 * so the UI can render, copy, or download the text.
 *
 * Projections and any grade figures are clearly labeled; nothing is presented as official.
 */

export interface ReportData extends DashboardData {
  courses: Course[];
  citations: Citation[];
}

function courseCode(courses: Course[], courseId?: string): string {
  if (!courseId) return 'General';
  return courses.find((c) => c.id === courseId)?.code ?? 'Course';
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Weekly academic report: what's due in the next 7 days, grouped by course. */
export function weeklyReport(data: ReportData, now: Date): string {
  const items = dueThisWeek(data, now);
  const lines: string[] = [];
  lines.push(`# Weekly Academic Report`);
  lines.push(`_Generated ${now.toLocaleString()} · from your F.I.S.H. Scholar data_`);
  lines.push('');

  if (items.length === 0) {
    lines.push('No dated items fall within the next 7 days.');
    return lines.join('\n');
  }

  const byCourse = new Map<string, typeof items>();
  for (const it of items) {
    const key = courseCode(data.courses, it.courseId);
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key)!.push(it);
  }

  for (const [code, group] of byCourse) {
    lines.push(`## ${code}`);
    for (const it of group.sort((a, b) => (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0))) {
      const when = it.overdue ? 'OVERDUE' : it.due ? fmtDate(it.due) : 'no date';
      lines.push(`- [ ] ${it.title} — _${when}_`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

/** Discussion participation: per discussion, post status and reply progress. */
export function discussionParticipationReport(
  discussions: Discussion[],
  responses: DiscussionResponse[],
  courses: Course[],
): string {
  const lines: string[] = [];
  lines.push(`# Discussion Participation Report`);
  lines.push(`_From your F.I.S.H. Scholar data_`);
  lines.push('');

  if (discussions.length === 0) {
    lines.push('No discussions tracked yet.');
    return lines.join('\n');
  }

  for (const d of discussions) {
    const rs = responses.filter((r) => r.discussionId === d.id);
    const p = replyProgress(d, rs);
    const posted = d.originalPost?.status === 'submitted';
    lines.push(`## ${d.title} (${courseCode(courses, d.courseId)})`);
    lines.push(`- Initial post: ${posted ? 'Submitted' : d.originalPost?.status ?? 'not started'}`);
    lines.push(`- Required replies: ${p.completed}/${p.required} complete${p.remaining > 0 ? ` (${p.remaining} remaining)` : ''}`);
    if (p.incomingUnanswered > 0) lines.push(`- Classmate replies to you awaiting response: ${p.incomingUnanswered}`);
    if (p.followUps > 0) lines.push(`- Flagged for follow-up: ${p.followUps}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

/** Research source list: APA references (or a best-available line) for every citation. */
export function sourceListReport(citations: Citation[]): string {
  const lines: string[] = [];
  lines.push(`# Research Source List`);
  lines.push(`_From your F.I.S.H. Scholar citation vault_`);
  lines.push('');

  if (citations.length === 0) {
    lines.push('No sources saved yet.');
    return lines.join('\n');
  }

  const sorted = [...citations].sort((a, b) => (a.authors || a.title).localeCompare(b.authors || b.title));
  for (const c of sorted) {
    const ref = c.apa7 && c.apa7.trim()
      ? c.apa7.trim()
      : [c.authors, c.year && `(${c.year})`, c.title, c.source].filter(Boolean).join(' ').trim();
    const verifiedNote = c.apa7 && c.apa7.trim() ? '' : ' _(unverified — complete the reference)_';
    lines.push(`- ${ref || '(untitled source)'}${verifiedNote}`);
  }
  return lines.join('\n');
}

/** Semester summary: counts, per-course progress, and clearly-labeled grade figures. */
export function semesterSummaryReport(data: ReportData, now: Date): string {
  const lines: string[] = [];
  lines.push(`# Semester Summary`);
  lines.push(`_Generated ${now.toLocaleString()} · from your F.I.S.H. Scholar data_`);
  lines.push('');

  const totalOpen = collectDueItems(data, now).length;
  lines.push(`- Courses: ${data.courses.length}`);
  lines.push(`- Assignments: ${data.assignments.length}`);
  lines.push(`- Discussions: ${data.discussions.length}`);
  lines.push(`- Readings: ${data.readings.length}`);
  lines.push(`- Saved sources: ${data.citations.length}`);
  lines.push(`- Open items needing attention: ${totalOpen}`);
  lines.push('');

  const grades = summarizeGrades(data.courses, data.assignments);
  lines.push(`## Per-course standing`);
  for (const g of grades) {
    if (g.hasGrades && g.currentPercent != null) {
      lines.push(
        `- ${g.courseCode}: ${g.currentPercent}% recorded so far (${g.gradedCount}/${g.totalCount} graded). ` +
          `_Projection only — not an official grade._`,
      );
    } else {
      lines.push(`- ${g.courseCode}: no grades recorded yet.`);
    }
  }
  return lines.join('\n');
}

export type ReportKind = 'weekly' | 'participation' | 'sources' | 'semester';

export interface ReportSpec {
  kind: ReportKind;
  title: string;
  filename: string;
}

export const REPORTS: ReportSpec[] = [
  { kind: 'weekly', title: 'Weekly Academic Report', filename: 'weekly-report.md' },
  { kind: 'participation', title: 'Discussion Participation', filename: 'discussion-participation.md' },
  { kind: 'sources', title: 'Research Source List', filename: 'source-list.md' },
  { kind: 'semester', title: 'Semester Summary', filename: 'semester-summary.md' },
];

/** Generate a report's markdown by kind. */
export function generateReport(kind: ReportKind, data: ReportData, now: Date): string {
  switch (kind) {
    case 'weekly':
      return weeklyReport(data, now);
    case 'participation':
      return discussionParticipationReport(data.discussions, data.discussionResponses, data.courses);
    case 'sources':
      return sourceListReport(data.citations);
    case 'semester':
      return semesterSummaryReport(data, now);
  }
}
