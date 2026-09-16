import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbRepository } from '../data/repository';
import { buildDemoSeed } from '../data/seed';
import { replyProgress, dueToday } from './selectors';
import type {
  Collection,
  EntityBase,
  Discussion,
  DiscussionResponse,
  Assignment,
} from '../types';

/**
 * End-to-end persistence flow the UI depends on: seed on first boot → mutate → "reload"
 * (fresh repository over the same IndexedDB) → data is intact. Proves R1 (survive refresh),
 * R4 (reply counts), and R12 (demo removal) against the real IndexedDB path.
 */
describe('store persistence integration', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  async function seed(repo: IndexedDbRepository) {
    const s = buildDemoSeed();
    for (const [collection, entities] of Object.entries(s)) {
      await repo.bulkPut(collection as Collection, entities as EntityBase[]);
    }
  }

  it('seeds Fall 2026 courses including FYC 6234 with blank titles', async () => {
    const repo = new IndexedDbRepository();
    await seed(repo);
    const courses = await repo.getAll<any>('courses');
    const codes = courses.map((c) => c.code).sort();
    expect(codes).toEqual(['DSAB 629', 'ED 9413', 'FYC 6234']);
    // Nothing invented: titles/professor names remain blank for the student to fill in.
    expect(courses.every((c) => c.title === '')).toBe(true);
    expect(courses.every((c) => c.professor.name === '')).toBe(true);
    expect(courses.every((c) => c.semester === 'Fall 2026')).toBe(true);
    expect(courses.every((c) => c.isDemo === true)).toBe(true);
  });

  it('persists a new discussion + reply across a simulated reload', async () => {
    const repo = new IndexedDbRepository();
    await seed(repo);

    const disc: Discussion = {
      id: 'd-int-1',
      courseId: 'course-msu-ed9413',
      title: 'Week 2 post',
      minResponses: 2,
      status: 'in_progress',
      originalPost: { status: 'submitted' },
      createdAt: '',
      updatedAt: '',
    };
    await repo.put('discussions', disc);
    await repo.put('discussionResponses', {
      id: 'r-int-1',
      discussionId: 'd-int-1',
      classmateName: 'Sam',
      drafted: true,
      submitted: true,
      followUpRequired: false,
      createdAt: '',
      updatedAt: '',
    } as DiscussionResponse);

    // Simulate reload: a brand-new repository instance over the same underlying DB.
    const reloaded = new IndexedDbRepository();
    const discussions = await reloaded.getAll<Discussion>('discussions');
    const responses = await reloaded.getAll<DiscussionResponse>('discussionResponses');
    const mine = discussions.find((d) => d.id === 'd-int-1')!;
    expect(mine).toBeTruthy();

    const progress = replyProgress(mine, responses.filter((r) => r.discussionId === 'd-int-1'));
    expect(progress.required).toBe(2);
    expect(progress.completed).toBe(1);
    expect(progress.remaining).toBe(1);
  });

  it('clearDemo removes seeded demo data but keeps user records', async () => {
    const repo = new IndexedDbRepository();
    await seed(repo);
    await repo.put('assignments', {
      id: 'a-user',
      courseId: 'course-uf-fyc6234',
      title: 'My real paper',
      dueDate: '2026-09-16',
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
    } as Assignment);

    await repo.clearDemo();

    const assignments = await repo.getAll<any>('assignments');
    expect(assignments.map((a) => a.id)).toEqual(['a-user']);
    const courses = await repo.getAll<any>('courses');
    expect(courses).toHaveLength(0); // all seeded courses were demo
  });

  it('dueToday surfaces a user assignment due today', async () => {
    const repo = new IndexedDbRepository();
    const now = new Date('2026-09-16T09:00:00');
    await repo.put('assignments', {
      id: 'a-today',
      courseId: 'c',
      title: 'Due now',
      dueDate: '2026-09-16',
      dueTime: '',
      urgency: 'due_soon',
      points: 0,
      weight: '',
      estimatedMinutes: 30,
      prompt: '',
      rubric: '',
      requiredReadings: [],
      checklist: [],
      drafts: [],
      notes: '',
      sourcesCited: [],
      currentPhase: 'draft',
    } as Assignment);
    const assignments = await repo.getAll<Assignment>('assignments');
    const items = dueToday(
      { assignments, discussions: [], discussionResponses: [], readings: [], assessments: [] },
      now,
    );
    expect(items.map((i) => i.id)).toContain('a-today');
  });
});
