import { describe, it, expect } from 'vitest';
import type {
  Assignment,
  Discussion,
  DiscussionResponse,
} from '../types';
import {
  parseDueDate,
  daysUntil,
  isWithinThisWeek,
  replyProgress,
  isDiscussionComplete,
  dueToday,
  dueThisWeek,
  workloadForCourse,
  recommendedNextAction,
  assignmentPercentComplete,
  type DashboardData,
} from './selectors';

const NOW = new Date('2026-09-15T09:00:00'); // Tuesday

function emptyData(partial: Partial<DashboardData> = {}): DashboardData {
  return {
    assignments: [],
    discussions: [],
    discussionResponses: [],
    readings: [],
    assessments: [],
    ...partial,
  };
}

function makeDiscussion(over: Partial<Discussion> = {}): Discussion {
  return {
    id: 'd1',
    courseId: 'c1',
    title: 'Week 3 Discussion',
    minResponses: 2,
    status: 'in_progress',
    originalPost: { status: 'submitted' },
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function makeResponse(over: Partial<DiscussionResponse> = {}): DiscussionResponse {
  return {
    id: `r-${Math.random()}`,
    discussionId: 'd1',
    classmateName: 'Peer',
    drafted: false,
    submitted: false,
    followUpRequired: false,
    createdAt: '',
    updatedAt: '',
    ...over,
  };
}

function makeAssignment(over: Partial<Assignment> = {}): Assignment {
  return {
    id: 'a1',
    courseId: 'c1',
    title: 'Paper',
    dueDate: '',
    dueTime: '',
    urgency: 'due_soon',
    points: 100,
    weight: '',
    estimatedMinutes: 60,
    prompt: '',
    rubric: '',
    requiredReadings: [],
    checklist: [],
    drafts: [],
    notes: '',
    sourcesCited: [],
    currentPhase: 'draft',
    ...over,
  };
}

describe('date helpers', () => {
  it('parses ISO, tonight, tomorrow; returns null for unknown', () => {
    expect(parseDueDate('2026-09-20', NOW)?.getFullYear()).toBe(2026);
    expect(parseDueDate('tonight', NOW)?.getDate()).toBe(15);
    expect(parseDueDate('tomorrow', NOW)?.getDate()).toBe(16);
    expect(parseDueDate('sometime next month', NOW)).toBeNull();
    expect(parseDueDate(undefined, NOW)).toBeNull();
  });

  it('computes days until and week membership', () => {
    expect(daysUntil(new Date('2026-09-18T00:00:00'), NOW)).toBe(3);
    expect(isWithinThisWeek(new Date('2026-09-18T00:00:00'), NOW)).toBe(true);
    expect(isWithinThisWeek(new Date('2026-09-30T00:00:00'), NOW)).toBe(false);
    expect(isWithinThisWeek(new Date('2026-09-10T00:00:00'), NOW)).toBe(false); // past
  });
});

describe('replyProgress (R4)', () => {
  it('counts submitted outgoing replies against the requirement', () => {
    const d = makeDiscussion({ minResponses: 2 });
    const responses = [
      makeResponse({ submitted: true }),
      makeResponse({ submitted: false }),
    ];
    const p = replyProgress(d, responses);
    expect(p.required).toBe(2);
    expect(p.completed).toBe(1);
    expect(p.remaining).toBe(1);
  });

  it('does not count incoming (classmate-to-me) replies as my required replies', () => {
    const d = makeDiscussion({ minResponses: 2 });
    const responses = [
      makeResponse({ direction: 'incoming', submitted: false }),
      makeResponse({ direction: 'peer', submitted: true }),
    ];
    const p = replyProgress(d, responses);
    expect(p.completed).toBe(1);
    expect(p.remaining).toBe(1);
    expect(p.incomingUnanswered).toBe(1);
  });

  it('surfaces follow-up flags', () => {
    const d = makeDiscussion({ minResponses: 1 });
    const responses = [makeResponse({ submitted: true, followUpRequired: true })];
    expect(replyProgress(d, responses).followUps).toBe(1);
  });

  it('isDiscussionComplete requires submitted post AND all replies done', () => {
    const d = makeDiscussion({ minResponses: 2 });
    const twoDone = [makeResponse({ submitted: true }), makeResponse({ submitted: true })];
    expect(isDiscussionComplete(d, twoDone)).toBe(true);

    const notPosted = makeDiscussion({
      minResponses: 2,
      originalPost: { status: 'drafting' },
    });
    expect(isDiscussionComplete(notPosted, twoDone)).toBe(false);
  });
});

describe('dueToday / dueThisWeek (R5)', () => {
  it('includes overdue and today assignments in dueToday', () => {
    const data = emptyData({
      assignments: [
        makeAssignment({ id: 'today', dueDate: '2026-09-15' }),
        makeAssignment({ id: 'overdue', dueDate: '2026-09-10' }),
        makeAssignment({ id: 'later', dueDate: '2026-09-20' }),
        makeAssignment({ id: 'done', dueDate: '2026-09-15', urgency: 'completed' }),
      ],
    });
    const ids = dueToday(data, NOW).map((i) => i.id).sort();
    expect(ids).toEqual(['overdue', 'today']);
  });

  it('includes an outstanding discussion post and remaining replies', () => {
    const data = emptyData({
      discussions: [
        makeDiscussion({
          id: 'dpost',
          initialPostDeadline: '2026-09-15',
          originalPost: { status: 'drafting' },
          minResponses: 2,
          responseDeadline: '2026-09-16',
        }),
      ],
      discussionResponses: [makeResponse({ discussionId: 'dpost', submitted: true })],
    });
    const week = dueThisWeek(data, NOW);
    const kinds = week.map((i) => i.kind).sort();
    expect(kinds).toContain('discussion_post');
    expect(kinds).toContain('discussion_response');
  });
});

describe('workloadForCourse (R5.3)', () => {
  it('scales with open, due-this-week, and overdue items and explains itself', () => {
    const data = emptyData({
      assignments: [
        makeAssignment({ id: 'o1', courseId: 'c1', dueDate: '2026-09-10' }), // overdue
        makeAssignment({ id: 'w1', courseId: 'c1', dueDate: '2026-09-17' }), // this week
      ],
    });
    const result = workloadForCourse({ id: 'c1' }, data, NOW);
    expect(result.overdue).toBe(1);
    expect(result.dueThisWeek).toBe(1);
    expect(result.score).toBeGreaterThan(0);
    expect(result.rationale).toMatch(/overdue/);
    expect(['Light', 'Moderate', 'Heavy', 'Critical']).toContain(result.level);
  });

  it('reports Light with a clear rationale when nothing is outstanding', () => {
    const result = workloadForCourse({ id: 'c1' }, emptyData(), NOW);
    expect(result.level).toBe('Light');
    expect(result.rationale).toMatch(/nothing outstanding/);
  });
});

describe('recommendedNextAction (R5.4)', () => {
  it('prioritizes overdue over due-today over later', () => {
    const data = emptyData({
      assignments: [
        makeAssignment({ id: 'later', dueDate: '2026-09-20' }),
        makeAssignment({ id: 'overdue', dueDate: '2026-09-09' }),
        makeAssignment({ id: 'today', dueDate: '2026-09-15' }),
      ],
    });
    const next = recommendedNextAction(data, NOW);
    expect(next?.item.id).toBe('overdue');
    expect(next?.reason).toMatch(/overdue/i);
  });

  it('returns null when there is nothing to do', () => {
    expect(recommendedNextAction(emptyData(), NOW)).toBeNull();
  });
});

describe('assignmentPercentComplete', () => {
  it('reflects checklist completion', () => {
    const a = makeAssignment({
      checklist: [
        { id: '1', text: 'a', completed: true },
        { id: '2', text: 'b', completed: false },
      ],
    });
    expect(assignmentPercentComplete(a)).toBe(50);
  });
});
