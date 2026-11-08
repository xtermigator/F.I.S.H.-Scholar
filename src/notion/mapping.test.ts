import { describe, it, expect } from 'vitest';
import {
  normalizeNotionProperty,
  normalizeNotionPage,
  extractDatabaseSchema,
  suggestMapping,
  buildImportCandidates,
  candidatesToAssignments,
  mapNotionStatus,
  type FieldMapping,
} from './mapping';

describe('normalizeNotionProperty', () => {
  it('extracts plain text from title and rich_text', () => {
    expect(
      normalizeNotionProperty({ type: 'title', title: [{ plain_text: 'My ' }, { plain_text: 'Paper' }] }),
    ).toBe('My Paper');
    expect(
      normalizeNotionProperty({ type: 'rich_text', rich_text: [{ plain_text: 'note' }] }),
    ).toBe('note');
  });

  it('handles select, status, multi_select, date, checkbox, number, url', () => {
    expect(normalizeNotionProperty({ type: 'select', select: { name: 'High' } })).toBe('High');
    expect(normalizeNotionProperty({ type: 'status', status: { name: 'In progress' } })).toBe('In progress');
    expect(
      normalizeNotionProperty({ type: 'multi_select', multi_select: [{ name: 'a' }, { name: 'b' }] }),
    ).toBe('a, b');
    expect(normalizeNotionProperty({ type: 'date', date: { start: '2026-09-20' } })).toBe('2026-09-20');
    expect(normalizeNotionProperty({ type: 'checkbox', checkbox: true })).toBe(true);
    expect(normalizeNotionProperty({ type: 'number', number: 42 })).toBe(42);
    expect(normalizeNotionProperty({ type: 'url', url: 'https://x.com' })).toBe('https://x.com');
  });

  it('returns null for empty or unknown properties (never guesses)', () => {
    expect(normalizeNotionProperty({ type: 'title', title: [] })).toBeNull();
    expect(normalizeNotionProperty({ type: 'weird_new_type' })).toBeNull();
    expect(normalizeNotionProperty(null)).toBeNull();
  });
});

describe('normalizeNotionPage + extractDatabaseSchema', () => {
  it('flattens a page into id + primitive properties', () => {
    const page = {
      id: 'page-1',
      url: 'https://notion.so/page-1',
      properties: {
        Name: { type: 'title', title: [{ plain_text: 'Essay' }] },
        Due: { type: 'date', date: { start: '2026-10-01' } },
      },
    };
    const norm = normalizeNotionPage(page);
    expect(norm.id).toBe('page-1');
    expect(norm.properties.Name).toBe('Essay');
    expect(norm.properties.Due).toBe('2026-10-01');
  });

  it('extracts property schema (name + type)', () => {
    const db = { properties: { Name: { type: 'title' }, Due: { type: 'date' } } };
    const schema = extractDatabaseSchema(db);
    expect(schema).toEqual([
      { name: 'Name', type: 'title' },
      { name: 'Due', type: 'date' },
    ]);
  });
});

describe('suggestMapping', () => {
  it('maps title/date/status/url/notes by type and name heuristics', () => {
    const mapping = suggestMapping([
      { name: 'Name', type: 'title' },
      { name: 'Due Date', type: 'date' },
      { name: 'Status', type: 'status' },
      { name: 'Link', type: 'url' },
      { name: 'Description', type: 'rich_text' },
      { name: 'Priority', type: 'number' },
    ]);
    expect(mapping['Name']).toBe('title');
    expect(mapping['Due Date']).toBe('dueDate');
    expect(mapping['Status']).toBe('status');
    expect(mapping['Link']).toBe('url');
    expect(mapping['Description']).toBe('notes');
    expect(mapping['Priority']).toBe('ignore');
  });
});

describe('buildImportCandidates (dedupe)', () => {
  const pages = [
    normalizeNotionPage({
      id: 'p1',
      properties: {
        Name: { type: 'title', title: [{ plain_text: 'Paper 1' }] },
        Due: { type: 'date', date: { start: '2026-10-01' } },
      },
    }),
    normalizeNotionPage({
      id: 'p2',
      properties: { Name: { type: 'title', title: [{ plain_text: 'Paper 2' }] } },
    }),
  ];
  const mapping: FieldMapping = { Name: 'title', Due: 'dueDate' };

  it('flags pages already imported as duplicates', () => {
    const candidates = buildImportCandidates(pages, mapping, [{ externalId: 'p1' }]);
    expect(candidates.find((c) => c.externalId === 'p1')?.duplicate).toBe(true);
    expect(candidates.find((c) => c.externalId === 'p2')?.duplicate).toBe(false);
  });

  it('pulls mapped values through', () => {
    const [c1] = buildImportCandidates(pages, mapping, []);
    expect(c1.title).toBe('Paper 1');
    expect(c1.dueDate).toBe('2026-10-01');
  });
});

describe('candidatesToAssignments', () => {
  it('skips duplicates and empty-title rows; builds assignment + sync record pairs', () => {
    const built = candidatesToAssignments(
      [
        { externalId: 'p1', title: 'Real', dueDate: '2026-10-01', status: '', notes: 'n', url: '', duplicate: false },
        { externalId: 'p2', title: 'Dup', dueDate: '', status: '', notes: '', url: '', duplicate: true },
        { externalId: 'p3', title: '   ', dueDate: '', status: '', notes: '', url: '', duplicate: false },
      ],
      'course-msu-ed9413',
      '2026-09-16T00:00:00.000Z',
    );
    expect(built).toHaveLength(1);
    expect(built[0].assignment.title).toBe('Real');
    expect(built[0].assignment.courseId).toBe('course-msu-ed9413');
    expect(built[0].assignment.id).toBe('asg-notion-p1');
    expect(built[0].syncRecord.externalId).toBe('p1');
    expect(built[0].syncRecord.source).toBe('notion');
    expect(built[0].syncRecord.syncDirection).toBe('import');
    expect(built[0].syncRecord.localEntityId).toBe('asg-notion-p1');
  });

  it('re-importing the same Notion pages produces no duplicates', () => {
    const pages = [
      normalizeNotionPage({ id: 'p1', properties: { Name: { type: 'title', title: [{ plain_text: 'A' }] } } }),
    ];
    const mapping: FieldMapping = { Name: 'title' };

    // First import: no existing sync records.
    const firstCandidates = buildImportCandidates(pages, mapping, []);
    const firstBuilt = candidatesToAssignments(firstCandidates, 'c1');
    expect(firstBuilt).toHaveLength(1);

    // Second import: the sync record now exists, so the page is a duplicate and skipped.
    const existing = firstBuilt.map((b) => ({ externalId: b.syncRecord.externalId }));
    const secondCandidates = buildImportCandidates(pages, mapping, existing);
    const secondBuilt = candidatesToAssignments(secondCandidates, 'c1');
    expect(secondBuilt).toHaveLength(0);
  });
});

describe('mapNotionStatus', () => {
  it('maps common statuses; defaults to not_started; never invents', () => {
    expect(mapNotionStatus('Done')).toBe('completed');
    expect(mapNotionStatus('Submitted')).toBe('submitted');
    expect(mapNotionStatus('In Progress')).toBe('in_progress');
    expect(mapNotionStatus('Blocked')).toBe('waiting');
    expect(mapNotionStatus('Needs revision')).toBe('needs_revision');
    expect(mapNotionStatus('')).toBe('not_started');
    expect(mapNotionStatus('Something custom')).toBe('not_started');
  });
});
