import type {
  Assignment,
  NotionSyncRecord,
  Persistable,
} from '../types';

/**
 * Pure Notion normalization, field-mapping, and dedupe logic (no network, no secrets).
 *
 * Shared by the server proxy (src/server/notion.ts) and the client mapping UI, and unit-tested
 * in mapping.test.ts. Design goals (spec R7, .kiro/steering/security.md + academic-integrity.md):
 *  - Read-only import first: we only ever READ Notion here; nothing writes back.
 *  - Preview -> map -> confirm -> dedupe: this module powers preview + mapping + dedupe.
 *  - No fabrication: unmapped/absent fields stay empty; we never invent values.
 */

// ---------------------------------------------------------------------------
// Normalized Notion shapes (a minimal, provider-agnostic view of a Notion page)
// ---------------------------------------------------------------------------

/** A single normalized property value extracted from a Notion page. */
export type NotionValue = string | number | boolean | null;

export interface NotionNormalizedPage {
  /** Notion page id — the stable dedupe key. */
  id: string;
  /** Property name -> normalized primitive value. */
  properties: Record<string, NotionValue>;
  url?: string;
  lastEditedTime?: string;
}

export interface NotionPropertySchema {
  name: string;
  type: string;
}

/**
 * Convert a raw Notion property object into a simple primitive. Notion has many property
 * types; we normalize the common ones and fall back to null (never a guess).
 */
export function normalizeNotionProperty(prop: any): NotionValue {
  if (!prop || typeof prop !== 'object') return null;
  switch (prop.type) {
    case 'title':
      return (prop.title ?? []).map((t: any) => t?.plain_text ?? '').join('') || null;
    case 'rich_text':
      return (prop.rich_text ?? []).map((t: any) => t?.plain_text ?? '').join('') || null;
    case 'select':
      return prop.select?.name ?? null;
    case 'status':
      return prop.status?.name ?? null;
    case 'multi_select':
      return (prop.multi_select ?? []).map((s: any) => s?.name).filter(Boolean).join(', ') || null;
    case 'number':
      return typeof prop.number === 'number' ? prop.number : null;
    case 'checkbox':
      return !!prop.checkbox;
    case 'date':
      return prop.date?.start ?? null;
    case 'url':
      return prop.url ?? null;
    case 'email':
      return prop.email ?? null;
    case 'phone_number':
      return prop.phone_number ?? null;
    case 'people':
      return (prop.people ?? []).map((p: any) => p?.name).filter(Boolean).join(', ') || null;
    case 'formula':
      return normalizeFormula(prop.formula);
    case 'created_time':
      return prop.created_time ?? null;
    case 'last_edited_time':
      return prop.last_edited_time ?? null;
    default:
      return null;
  }
}

function normalizeFormula(formula: any): NotionValue {
  if (!formula || typeof formula !== 'object') return null;
  switch (formula.type) {
    case 'string':
      return formula.string ?? null;
    case 'number':
      return typeof formula.number === 'number' ? formula.number : null;
    case 'boolean':
      return !!formula.boolean;
    case 'date':
      return formula.date?.start ?? null;
    default:
      return null;
  }
}

/** Normalize a full Notion page API object into our minimal shape. */
export function normalizeNotionPage(page: any): NotionNormalizedPage {
  const properties: Record<string, NotionValue> = {};
  const rawProps = page?.properties ?? {};
  for (const [name, prop] of Object.entries(rawProps)) {
    properties[name] = normalizeNotionProperty(prop);
  }
  return {
    id: page?.id ?? '',
    properties,
    url: page?.url,
    lastEditedTime: page?.last_edited_time,
  };
}

/** Extract the property schema (name + type) from a Notion database object. */
export function extractDatabaseSchema(database: any): NotionPropertySchema[] {
  const props = database?.properties ?? {};
  return Object.entries(props).map(([name, def]: [string, any]) => ({
    name,
    type: def?.type ?? 'unknown',
  }));
}

// ---------------------------------------------------------------------------
// Field mapping: Notion property -> F.I.S.H. assignment field
// ---------------------------------------------------------------------------

/** The F.I.S.H. assignment fields a Notion property can map onto for the first import target. */
export type MappableField =
  | 'title'
  | 'dueDate'
  | 'status'
  | 'notes'
  | 'url'
  | 'ignore';

export const MAPPABLE_FIELD_LABELS: Record<MappableField, string> = {
  title: 'Assignment title',
  dueDate: 'Due date',
  status: 'Status',
  notes: 'Notes',
  url: 'Link / URL',
  ignore: '— Do not import —',
};

/** Notion property name -> F.I.S.H. field. Editable by the student in the mapping UI. */
export type FieldMapping = Record<string, MappableField>;

/**
 * Suggest an initial mapping from a Notion schema using conservative name/type heuristics.
 * The student can override every choice before importing (nothing auto-commits).
 */
export function suggestMapping(schema: NotionPropertySchema[]): FieldMapping {
  const mapping: FieldMapping = {};
  for (const { name, type } of schema) {
    const n = name.toLowerCase();
    if (type === 'title') mapping[name] = 'title';
    else if (type === 'date' || n.includes('due') || n.includes('deadline')) mapping[name] = 'dueDate';
    else if (type === 'status' || type === 'select' || n.includes('status')) mapping[name] = 'status';
    else if (type === 'url' || n.includes('link') || n.includes('url')) mapping[name] = 'url';
    else if (n.includes('note') || n.includes('description') || type === 'rich_text') mapping[name] = 'notes';
    else mapping[name] = 'ignore';
  }
  return mapping;
}

// ---------------------------------------------------------------------------
// Building importable assignments + dedupe
// ---------------------------------------------------------------------------

export interface ImportCandidate {
  /** Stable Notion page id (dedupe key). */
  externalId: string;
  title: string;
  dueDate: string;
  status: string;
  notes: string;
  url: string;
  /** True if a NotionSyncRecord already exists for this page (would be a duplicate). */
  duplicate: boolean;
}

function valueToString(v: NotionValue): string {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'true' : '';
  return String(v);
}

/**
 * Turn normalized pages + a mapping into import candidates, flagging duplicates against
 * existing sync records. Pure — the caller decides what to persist after confirmation.
 */
export function buildImportCandidates(
  pages: NotionNormalizedPage[],
  mapping: FieldMapping,
  existingSyncRecords: Pick<NotionSyncRecord, 'externalId'>[],
): ImportCandidate[] {
  const seen = new Set(existingSyncRecords.map((r) => r.externalId));
  return pages.map((page) => {
    const get = (field: MappableField): string => {
      const propName = Object.keys(mapping).find((k) => mapping[k] === field);
      if (!propName) return '';
      return valueToString(page.properties[propName]);
    };
    return {
      externalId: page.id,
      title: get('title'),
      dueDate: get('dueDate'),
      status: get('status'),
      notes: get('notes'),
      url: get('url'),
      duplicate: seen.has(page.id),
    };
  });
}

/** Map a free-text Notion status onto a F.I.S.H. work status (best-effort, never invented). */
export function mapNotionStatus(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (!s) return 'not_started';
  if (/(done|complete|finished|submitted)/.test(s)) return s.includes('submit') ? 'submitted' : 'completed';
  if (/(in progress|doing|started|working)/.test(s)) return 'in_progress';
  if (/(wait|blocked|hold)/.test(s)) return 'waiting';
  if (/(revis|redo)/.test(s)) return 'needs_revision';
  return 'not_started';
}

export interface BuiltAssignment {
  assignment: Assignment & Persistable;
  syncRecord: NotionSyncRecord;
}

/**
 * Convert confirmed, non-duplicate candidates into Assignment + NotionSyncRecord pairs ready to
 * persist. Duplicates are skipped so re-importing never creates copies (R7 dedupe).
 */
export function candidatesToAssignments(
  candidates: ImportCandidate[],
  courseId: string,
  now: string = new Date().toISOString(),
): BuiltAssignment[] {
  return candidates
    .filter((c) => !c.duplicate && c.title.trim() !== '')
    .map((c) => {
      const assignmentId = `asg-notion-${c.externalId}`;
      const assignment: Assignment & Persistable = {
        id: assignmentId,
        courseId,
        title: c.title,
        dueDate: c.dueDate,
        dueTime: '',
        urgency: 'on_track',
        points: 0,
        weight: '',
        estimatedMinutes: 30,
        prompt: '',
        rubric: '',
        requiredReadings: [],
        checklist: [],
        drafts: [],
        notes: c.notes,
        sourcesCited: [],
        currentPhase: 'deconstruct',
        createdAt: now,
        updatedAt: now,
      };
      const syncRecord: NotionSyncRecord = {
        id: `notionsync-${c.externalId}`,
        externalId: c.externalId,
        localEntityId: assignmentId,
        collection: 'assignments',
        source: 'notion',
        lastSyncedAt: now,
        syncDirection: 'import',
        conflictStatus: 'none',
        createdAt: now,
        updatedAt: now,
      };
      return { assignment, syncRecord };
    });
}
