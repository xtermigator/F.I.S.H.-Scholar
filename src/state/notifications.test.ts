import { describe, it, expect } from 'vitest';
import type { Assignment, Assessment, Discussion, DiscussionResponse } from '../types';
import type { DashboardData } from './selectors';
import {
  buildNotifications,
  unreadCount,
  DEFAULT_RULES,
  type Alert,
} from './notifications';

const NOW = new Date('2026-09-15T09:00:00'); // Tuesday

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

function discussion(over: Partial<Discussion>): Discussion {
  return {
    id: 'd1', courseId: 'c1', title: 'Week 1', minResponses: 2, status: 'in_progress',
    originalPost: { status: 'submitted' }, createdAt: '', updatedAt: '', ...over,
  };
}

function response(over: Partial<DiscussionResponse>): DiscussionResponse {
  return {
    id: `r-${Math.random()}`, discussionId: 'd1', classmateName: 'Peer', drafted: false,
    submitted: false, followUpRequired: false, createdAt: '', updatedAt: '', ...over,
  };
}

function findKinds(alerts: Alert[]): string[] {
  return alerts.map((a) => a.kind);
}

describe('buildNotifications', () => {
  it('flags an overdue assignment as critical', () => {
    const alerts = buildNotifications(
      data({ assignments: [assignment({ id: 'a1', dueDate: '2026-09-10' })] }),
      NOW,
    );
    const overdue = alerts.find((a) => a.kind === 'overdue');
    expect(overdue).toBeTruthy();
    expect(overdue?.severity).toBe('critical');
    expect(overdue?.dueInDays).toBeLessThan(0);
  });

  it('fires due-soon only on configured windows (7/3/1/0)', () => {
    const alerts = buildNotifications(
      data({
        assignments: [
          assignment({ id: 'in3', dueDate: '2026-09-18' }), // 3 days -> fires
          assignment({ id: 'in5', dueDate: '2026-09-20' }), // 5 days -> no window
          assignment({ id: 'today', dueDate: '2026-09-15' }), // 0 days -> fires
        ],
      }),
      NOW,
    );
    const ids = alerts.map((a) => a.entityId);
    expect(ids).toContain('in3');
    expect(ids).toContain('today');
    expect(ids).not.toContain('in5');
  });

  it('warns when a discussion initial post is unsubmitted near its deadline', () => {
    const alerts = buildNotifications(
      data({
        discussions: [
          discussion({
            id: 'd1',
            originalPost: { status: 'drafting' },
            initialPostDeadline: '2026-09-16', // 1 day
          }),
        ],
      }),
      NOW,
    );
    expect(findKinds(alerts)).toContain('discussion_post_due');
  });

  it('warns when required replies are incomplete near the response deadline', () => {
    const alerts = buildNotifications(
      data({
        discussions: [discussion({ id: 'd1', minResponses: 2, responseDeadline: '2026-09-17' })],
        discussionResponses: [response({ discussionId: 'd1', submitted: true })],
      }),
      NOW,
    );
    const a = alerts.find((x) => x.kind === 'replies_incomplete');
    expect(a).toBeTruthy();
    expect(a?.message).toMatch(/1 reply remaining/);
  });

  it('flags an approaching test within the test window', () => {
    const alerts = buildNotifications(
      data({
        assessments: [
          { id: 's1', courseId: 'c1', name: 'Midterm', type: 'Test', date: '2026-09-20', studyStatus: 'not_started', createdAt: '', updatedAt: '' } as Assessment,
        ],
      }),
      NOW,
    );
    expect(findKinds(alerts)).toContain('test_approaching');
  });

  it('sorts most urgent first (overdue before due-soon)', () => {
    const alerts = buildNotifications(
      data({
        assignments: [
          assignment({ id: 'soon', dueDate: '2026-09-18' }),
          assignment({ id: 'over', dueDate: '2026-09-08' }),
        ],
      }),
      NOW,
    );
    expect(alerts[0].entityId).toBe('over');
  });

  it('produces no alerts when nothing is pending', () => {
    expect(buildNotifications(data({}), NOW)).toEqual([]);
  });

  it('respects custom rule windows', () => {
    const alerts = buildNotifications(
      data({ assignments: [assignment({ id: 'in5', dueDate: '2026-09-20' })] }),
      NOW,
      { ...DEFAULT_RULES, dueWindows: [5] },
    );
    expect(alerts.find((a) => a.entityId === 'in5')).toBeTruthy();
  });

  it('unreadCount excludes dismissed alerts', () => {
    const alerts = buildNotifications(
      data({ assignments: [assignment({ id: 'a1', dueDate: '2026-09-10' })] }),
      NOW,
    );
    expect(unreadCount(alerts)).toBe(alerts.length);
    expect(unreadCount(alerts, new Set([alerts[0].id]))).toBe(alerts.length - 1);
  });
});
