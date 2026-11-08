import type { Course, Discussion, DiscussionResponse } from '../types';
import {
  type DashboardData,
  type DueItem,
  dueToday,
  dueThisWeek,
  collectDueItems,
  recommendedNextAction,
  replyProgress,
  workloadForCourse,
} from './selectors';

/**
 * "Ask FISH" — a database-aware assistant that answers questions **from the student's own
 * persisted data**, deterministically, with NO AI key required (spec R8.5, milestone M3).
 *
 * Design rules (see .kiro/steering/academic-integrity.md):
 *  - Every answer is grounded in real records the student entered/imported. We never invent
 *    assignments, dates, citations, or facts.
 *  - The answer's `source` is always "your F.I.S.H. Scholar data" so provenance is explicit.
 *  - An optional AI layer can *rephrase* these grounded facts, but the facts come from here.
 *
 * This module is pure and fully unit-tested (askFish.test.ts).
 */

export type AskIntent =
  | 'due_today'
  | 'due_week'
  | 'replies_remaining'
  | 'overdue'
  | 'next_action'
  | 'course_status'
  | 'workload'
  | 'help'
  | 'unknown';

export interface AskContext {
  data: DashboardData;
  courses: Course[];
  now: Date;
}

/** A referenced record the UI can render/link. */
export interface AnswerItem {
  id: string;
  label: string;
  courseCode?: string;
  detail?: string;
}

export interface AskAnswer {
  intent: AskIntent;
  /** Short natural-language summary grounded in the data. */
  summary: string;
  /** Concrete items backing the summary (may be empty). */
  items: AnswerItem[];
  /** Always names where the answer came from (provenance). */
  source: string;
  /** Follow-up suggestions the UI can offer as buttons. */
  suggestions?: string[];
}

const SOURCE = 'your F.I.S.H. Scholar data';

// ---------------------------------------------------------------------------
// Intent detection (keyword heuristics — transparent, not a black box)
// ---------------------------------------------------------------------------

const COURSE_CODE_RE = /\b([a-z]{2,4}\s?\d{3,4})\b/;

export function detectIntent(query: string): AskIntent {
  const q = query.toLowerCase();

  if (/\b(help|what can you|how do|examples?)\b/.test(q)) return 'help';

  const mentionsCourse = COURSE_CODE_RE.test(q);

  // A specific course code takes precedence over the generic "due"/status wording, so
  // "What's due for ED 9413?" is answered as a course-status question, not a week roundup.
  // (Reply/overdue/next questions about a course still route to their specific intent.)
  if (
    mentionsCourse &&
    !/(repl(y|ies|ied|ying)|respond|response|classmate|peer)/.test(q) &&
    !/\b(overdue|late|past due|behind)\b/.test(q) &&
    !/(work on|start|next|priorit|focus|first)/.test(q)
  ) {
    return 'course_status';
  }

  if (/\b(overdue|late|past due|behind)\b/.test(q)) return 'overdue';

  if (/(repl(y|ies|ied|ying)|respond|response|classmate|peer|discussion post)/.test(q)) {
    return 'replies_remaining';
  }

  if (/(work on|start|next|priorit|focus|first)/.test(q)) return 'next_action';

  if (/(workload|how (much|busy)|heaviest|busiest|load)/.test(q)) return 'workload';

  if (/(today|tonight|right now|due now)/.test(q)) return 'due_today';

  if (/(this week|week|upcoming|coming up|next \d+ days|due)/.test(q)) return 'due_week';

  // Any other course-code mention implies a course status question.
  if (mentionsCourse) return 'course_status';

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function courseCodeFor(courses: Course[], courseId?: string): string | undefined {
  if (!courseId) return undefined;
  return courses.find((c) => c.id === courseId)?.code;
}

function dueItemToAnswerItem(courses: Course[], i: DueItem): AnswerItem {
  const code = courseCodeFor(courses, i.courseId);
  let detail: string | undefined;
  if (i.overdue) detail = 'Overdue';
  else if (i.dueToday) detail = 'Due today';
  else if (i.due) detail = `Due ${i.due.toLocaleDateString()}`;
  return { id: i.id, label: i.title, courseCode: code, detail };
}

/** Find a course the query refers to (by code or title), if any. */
export function matchCourse(query: string, courses: Course[]): Course | undefined {
  const q = query.toLowerCase().replace(/\s+/g, ' ');
  return courses.find((c) => {
    const code = c.code.toLowerCase();
    const codeNoSpace = code.replace(/\s+/g, '');
    return (
      q.includes(code) ||
      q.includes(codeNoSpace) ||
      (c.title && c.title.length > 3 && q.includes(c.title.toLowerCase()))
    );
  });
}

function pluralItems(n: number): string {
  return `${n} item${n === 1 ? '' : 's'}`;
}

// ---------------------------------------------------------------------------
// Answer builders
// ---------------------------------------------------------------------------

function answerDueToday(ctx: AskContext): AskAnswer {
  const items = dueToday(ctx.data, ctx.now);
  const overdue = items.filter((i) => i.overdue).length;
  const summary =
    items.length === 0
      ? 'Nothing is due today and nothing is overdue. Enjoy the breathing room.'
      : `You have ${pluralItems(items.length)} needing attention today` +
        (overdue ? `, including ${overdue} overdue.` : '.');
  return {
    intent: 'due_today',
    summary,
    items: items.map((i) => dueItemToAnswerItem(ctx.courses, i)),
    source: SOURCE,
    suggestions: ['What should I work on next?', "What's due this week?"],
  };
}

function answerDueWeek(ctx: AskContext): AskAnswer {
  const items = dueThisWeek(ctx.data, ctx.now);
  const summary =
    items.length === 0
      ? 'Nothing with a date falls in the next 7 days.'
      : `You have ${pluralItems(items.length)} due in the next 7 days.`;
  return {
    intent: 'due_week',
    summary,
    items: items.map((i) => dueItemToAnswerItem(ctx.courses, i)),
    source: SOURCE,
    suggestions: ['Which course has the heaviest workload?', 'What should I work on next?'],
  };
}

function answerOverdue(ctx: AskContext): AskAnswer {
  const items = collectDueItems(ctx.data, ctx.now).filter((i) => i.overdue);
  const summary =
    items.length === 0
      ? 'Good news — nothing is overdue.'
      : `You have ${pluralItems(items.length)} overdue. Starting the oldest one first usually helps most.`;
  return {
    intent: 'overdue',
    summary,
    items: items.map((i) => dueItemToAnswerItem(ctx.courses, i)),
    source: SOURCE,
    suggestions: ['What should I work on next?'],
  };
}

function answerRepliesRemaining(ctx: AskContext): AskAnswer {
  const items: AnswerItem[] = [];
  let totalRemaining = 0;
  let totalFollowUps = 0;
  let totalIncoming = 0;

  for (const d of ctx.data.discussions) {
    const responses = ctx.data.discussionResponses.filter(
      (r: DiscussionResponse) => r.discussionId === d.id,
    );
    const p = replyProgress(d, responses);
    const postPending = d.originalPost?.status !== 'submitted';
    totalRemaining += p.remaining;
    totalFollowUps += p.followUps;
    totalIncoming += p.incomingUnanswered;

    if (p.remaining > 0 || postPending || p.followUps > 0 || p.incomingUnanswered > 0) {
      const bits: string[] = [];
      if (postPending) bits.push('initial post not submitted');
      if (p.remaining > 0) bits.push(`${p.remaining} repl${p.remaining === 1 ? 'y' : 'ies'} remaining (${p.completed}/${p.required})`);
      if (p.incomingUnanswered > 0) bits.push(`${p.incomingUnanswered} classmate repl${p.incomingUnanswered === 1 ? 'y' : 'ies'} to you`);
      if (p.followUps > 0) bits.push(`${p.followUps} may warrant follow-up`);
      items.push({
        id: d.id,
        label: (d as Discussion).title,
        courseCode: courseCodeFor(ctx.courses, d.courseId),
        detail: bits.join(' · '),
      });
    }
  }

  let summary: string;
  if (ctx.data.discussions.length === 0) {
    summary = "You haven't added any discussions yet. Add one from Quick Add or the Discussions tab to start tracking replies.";
  } else if (totalRemaining === 0 && totalFollowUps === 0 && totalIncoming === 0 && items.length === 0) {
    summary = 'All caught up — every tracked discussion has its post submitted and required replies done.';
  } else {
    const parts: string[] = [];
    if (totalRemaining > 0) parts.push(`${totalRemaining} required repl${totalRemaining === 1 ? 'y' : 'ies'} remaining`);
    if (totalIncoming > 0) parts.push(`${totalIncoming} classmate repl${totalIncoming === 1 ? 'y' : 'ies'} to you`);
    if (totalFollowUps > 0) parts.push(`${totalFollowUps} flagged for follow-up`);
    summary = `Across your discussions: ${parts.join(', ')}.`;
  }

  return {
    intent: 'replies_remaining',
    summary,
    items,
    source: SOURCE,
    suggestions: ["What's due today?", 'What should I work on next?'],
  };
}

function answerNextAction(ctx: AskContext): AskAnswer {
  const next = recommendedNextAction(ctx.data, ctx.now);
  if (!next) {
    return {
      intent: 'next_action',
      summary: 'Nothing is outstanding right now. A calm moment — or a good time to add upcoming work.',
      items: [],
      source: SOURCE,
      suggestions: ["What's due this week?"],
    };
  }
  return {
    intent: 'next_action',
    summary: `Start here: “${next.item.title}.” ${next.reason}`,
    items: [dueItemToAnswerItem(ctx.courses, next.item)],
    source: SOURCE,
    suggestions: ["What's due today?", 'What discussion replies remain?'],
  };
}

function answerWorkload(ctx: AskContext): AskAnswer {
  const results = ctx.courses.map((c) => ({
    course: c,
    w: workloadForCourse({ id: c.id }, ctx.data, ctx.now),
  }));
  results.sort((a, b) => b.w.score - a.w.score);

  const items: AnswerItem[] = results.map(({ course, w }) => ({
    id: course.id,
    label: `${course.code}${course.title ? ` · ${course.title}` : ''}`,
    courseCode: course.code,
    detail: w.rationale,
  }));

  const heaviest = results[0];
  const summary =
    results.length === 0
      ? 'No courses yet.'
      : heaviest.w.score === 0
        ? 'All courses are Light right now — nothing outstanding.'
        : `${heaviest.course.code} has the heaviest load right now (${heaviest.w.level}).`;

  return {
    intent: 'workload',
    summary,
    items,
    source: SOURCE,
    suggestions: ['What should I work on next?', "What's due this week?"],
  };
}

function answerCourseStatus(ctx: AskContext, query: string): AskAnswer {
  const course = matchCourse(query, ctx.courses);
  if (!course) {
    return {
      intent: 'course_status',
      summary: "I couldn't tell which course you meant. Try the course code, e.g. “What's due for ED 9413?”.",
      items: [],
      source: SOURCE,
      suggestions: ctx.courses.slice(0, 3).map((c) => `What's due for ${c.code}?`),
    };
  }
  const items = collectDueItems(ctx.data, ctx.now)
    .filter((i) => i.courseId === course.id)
    .map((i) => dueItemToAnswerItem(ctx.courses, i));
  const w = workloadForCourse({ id: course.id }, ctx.data, ctx.now);
  const summary =
    items.length === 0
      ? `${course.code} has nothing outstanding right now (${w.level}).`
      : `${course.code}: ${pluralItems(items.length)} outstanding — ${w.rationale}`;
  return {
    intent: 'course_status',
    summary,
    items,
    source: SOURCE,
    suggestions: ['Which course has the heaviest workload?', 'What should I work on next?'],
  };
}

function answerHelp(ctx: AskContext): AskAnswer {
  return {
    intent: 'help',
    summary:
      'Ask me about your academic data. I answer only from what you\'ve entered or imported — I never make things up.',
    items: [],
    source: SOURCE,
    suggestions: [
      "What's due today?",
      "What's due this week?",
      'What discussion replies do I still owe?',
      'What should I work on next?',
      'Which course has the heaviest workload?',
      "What's overdue?",
    ],
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Answer a natural-language question purely from the student's data. */
export function answerQuestion(query: string, ctx: AskContext): AskAnswer {
  const intent = detectIntent(query);
  switch (intent) {
    case 'due_today':
      return answerDueToday(ctx);
    case 'due_week':
      return answerDueWeek(ctx);
    case 'overdue':
      return answerOverdue(ctx);
    case 'replies_remaining':
      return answerRepliesRemaining(ctx);
    case 'next_action':
      return answerNextAction(ctx);
    case 'workload':
      return answerWorkload(ctx);
    case 'course_status':
      return answerCourseStatus(ctx, query);
    case 'help':
      return answerHelp(ctx);
    case 'unknown':
    default:
      return {
        ...answerHelp(ctx),
        intent: 'unknown',
        summary:
          "I'm not sure what you're asking, but here are questions I can answer from your data:",
      };
  }
}

/**
 * Build a compact, grounded facts payload that an AI layer may rephrase. This is what the
 * server-side AI provider (if configured) receives — it never invents beyond these facts.
 */
export function buildGroundingFacts(ctx: AskContext): string {
  const today = dueToday(ctx.data, ctx.now);
  const week = dueThisWeek(ctx.data, ctx.now);
  const overdue = collectDueItems(ctx.data, ctx.now).filter((i) => i.overdue);
  const lines: string[] = [];
  lines.push(`Due today or overdue: ${today.length} (${overdue.length} overdue).`);
  lines.push(`Due within 7 days: ${week.length}.`);
  for (const c of ctx.courses) {
    const w = workloadForCourse({ id: c.id }, ctx.data, ctx.now);
    lines.push(`${c.code} workload: ${w.level} — ${w.rationale}`);
  }
  for (const d of ctx.data.discussions) {
    const responses = ctx.data.discussionResponses.filter((r) => r.discussionId === d.id);
    const p = replyProgress(d, responses);
    lines.push(
      `Discussion "${(d as Discussion).title}": post ${d.originalPost?.status ?? 'not_started'}, replies ${p.completed}/${p.required}.`,
    );
  }
  return lines.join('\n');
}
