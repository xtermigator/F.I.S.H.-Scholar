import type { EntityBase, Reading } from '../types';

/**
 * Registry JSON import lane (EDU 810 Source Registry package, 2026-10-25).
 *
 * Turns registry rows into UNREAD, UNVERIFIED Library readings. Nothing here is a
 * verified citation: the registry is a link inventory (every row "Not read").
 * Rows are never marked verified and no metadata is invented; unresolved rows
 * keep their match status in the notes so the student can see what is shaky.
 * Not wired to the store or UI yet: call importRegistryRows() from an import action.
 */
export interface RegistryRow {
  source_id: string;
  weeks: string;
  pdf_pages: string;
  type: string;
  title: string;
  search_hint: string;
  url: string;
  match_status: string;
  notes: string;
  checked_date: string;
  reading_status: string;
  full_text_status: string;
  evidence_level: string;
  project_tags: string;
  next_action: string;
}

export const REGISTRY_COURSE_ID = 'course-gmercyu-edu810';
const SCHOLARLY_TYPES = new Set(['Article', 'Book']);

/** Rows already in the verified FISH seed (matched by DOI/URL or title) are skipped. */
export function importRegistryRows(
  rows: RegistryRow[],
  existing: { title?: string; url?: string; doi?: string }[],
  now: string = new Date().toISOString(),
): (Reading & EntityBase)[] {
  const norm = (s?: string) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const seenTitle = new Set(existing.map((e) => norm(e.title)));
  const seenUrl = new Set(existing.map((e) => norm(e.url)).filter(Boolean));
  const out: (Reading & EntityBase)[] = [];
  for (const r of rows) {
    if (seenTitle.has(norm(r.title)) || (r.url && seenUrl.has(norm(r.url)))) continue;
    out.push({
      id: `rdg-edu810-reg-${r.source_id.toLowerCase()}`,
      createdAt: now,
      updatedAt: now,
      isDemo: false,
      courseId: REGISTRY_COURSE_ID,
      title: r.title,
      url: r.url || undefined,
      required: false,
      status: 'not_started',
      verified: false,
      notes: [
        'UNVERIFIED LINK (EDU 810 source registry, ' + r.source_id + ').',
        `Match: ${r.match_status}. Type: ${r.type}. Not read; full text not imported.`,
        r.notes,
        `Next: ${r.next_action}.`,
      ]
        .filter(Boolean)
        .join(' '),
      concepts: SCHOLARLY_TYPES.has(r.type) ? ['EDU 810'] : ['EDU 810', r.type],
    } as Reading & EntityBase);
  }
  return out;
}

/**
 * Registry sources that look scholarly with an exact-source match and are NOT yet in the
 * verified seed. Staged for the student to read; still verified:false until they confirm.
 * Metadata is only what the registry or the student-supplied Notion spec states.
 */
export const PROMOTION_CANDIDATES: Record<string, { note: string }> = {
  'EDU810-042': { note: 'Landing page matches the title; author/year/volume/pages must be taken from publisher metadata before citing.' },
  'EDU810-078': { note: 'Naeem, Ozuem, Howell, & Ranfagni (2023), International Journal of Qualitative Methods, 22. Methods guide for thematic analysis.' },
  'EDU810-080': { note: '2015, Publications, 3(2), 104-119. Author metadata needs a final reference review.' },
  'EDU810-079': {
    note:
      'DESIGN LEAD ONLY, not evidence for FISH Scholar. Marlina et al. (2024), JPBI 10(2), 602-615: a framework review of self-efficacy in collaborative science learning (Scopus only, 63 of 711 results analyzed, per the Notion spec review). It does not test research hubs, accommodations or disability supports. Verify its query and selection counts before relying on its method.',
  },
};

export function buildPromotionReadings(
  rows: RegistryRow[],
  now: string = new Date().toISOString(),
): (Reading & EntityBase)[] {
  return rows
    .filter((r) => r.source_id in PROMOTION_CANDIDATES)
    .map((r) => ({
      id: `rdg-edu810-reg-${r.source_id.toLowerCase()}`,
      createdAt: now,
      updatedAt: now,
      isDemo: false,
      courseId: REGISTRY_COURSE_ID,
      title: r.title,
      url: r.url,
      required: false,
      status: 'not_started' as const,
      verified: false,
      notes: `STAGED, UNREAD, UNVERIFIED (${r.source_id}). ${PROMOTION_CANDIDATES[r.source_id].note}`,
      concepts: ['EDU 810'],
    })) as (Reading & EntityBase)[];
}
