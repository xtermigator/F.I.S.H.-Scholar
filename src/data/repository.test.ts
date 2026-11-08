import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { Repository, Course, EntityBase } from '../types';
import { InMemoryRepository, IndexedDbRepository } from './repository';

type StoredCourse = Course & EntityBase;

function makeCourse(id: string, isDemo = false): StoredCourse {
  return {
    id,
    institutionId: 'inst-1',
    code: 'ED 9413',
    title: '',
    department: '',
    credits: 3,
    semester: 'Fall 2026',
    professor: {
      name: '',
      email: '',
      officeHours: '',
      preferredCommunication: '',
    },
    policies: { lateWork: '', attendance: '', aiPolicy: '', accommodations: '' },
    gradingScale: [],
    color: '',
    createdAt: '',
    updatedAt: '',
    isDemo,
  };
}

// The same contract is exercised against both implementations so they stay interchangeable.
const implementations: [string, () => Repository][] = [
  ['InMemoryRepository', () => new InMemoryRepository()],
  ['IndexedDbRepository', () => new IndexedDbRepository()],
];

describe.each(implementations)('%s', (_name, factory) => {
  let repo: Repository;

  beforeEach(() => {
    // Fresh, isolated IndexedDB per test so state never leaks between cases.
    // (The InMemoryRepository is naturally isolated via a new instance.)
    globalThis.indexedDB = new IDBFactory();
    repo = factory();
  });

  it('persists and reads back an entity', async () => {
    await repo.put('courses', makeCourse('c1'));
    const read = await repo.get<StoredCourse>('courses', 'c1');
    expect(read?.id).toBe('c1');
    expect(read?.code).toBe('ED 9413');
  });

  it('stamps createdAt and updatedAt on write', async () => {
    const saved = await repo.put('courses', makeCourse('c-stamp'));
    expect(saved.createdAt).not.toBe('');
    expect(saved.updatedAt).not.toBe('');
  });

  it('lists all entities in a collection', async () => {
    await repo.bulkPut('courses', [makeCourse('a'), makeCourse('b'), makeCourse('c')]);
    const all = await repo.getAll<StoredCourse>('courses');
    expect(all.map((c) => c.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('removes an entity', async () => {
    await repo.put('courses', makeCourse('gone'));
    await repo.remove('courses', 'gone');
    expect(await repo.get('courses', 'gone')).toBeUndefined();
  });

  it('clearDemo() removes only demo-flagged records', async () => {
    await repo.bulkPut('courses', [
      makeCourse('real', false),
      makeCourse('demo1', true),
      makeCourse('demo2', true),
    ]);
    await repo.clearDemo();
    const all = await repo.getAll<StoredCourse>('courses');
    expect(all.map((c) => c.id)).toEqual(['real']);
  });

  it('exportAll / importAll round-trips data', async () => {
    await repo.bulkPut('courses', [makeCourse('x'), makeCourse('y')]);
    const snapshot = await repo.exportAll();

    const fresh = factory();
    await fresh.importAll(snapshot);
    const all = await fresh.getAll<StoredCourse>('courses');
    expect(all.map((c) => c.id).sort()).toEqual(['x', 'y']);
  });
});
