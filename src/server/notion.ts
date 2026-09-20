import {
  normalizeNotionPage,
  extractDatabaseSchema,
  type NotionNormalizedPage,
  type NotionPropertySchema,
} from '../notion/mapping';

/**
 * Server-side Notion proxy (spec R7; .kiro/steering/security.md).
 *
 *  - The NOTION_API_KEY is read from the server environment and NEVER sent to the client.
 *  - READ-ONLY: this module only queries Notion (databases + pages). It never writes/patches
 *    or deletes anything in Notion. Two-way sync is deliberately out of scope for now.
 *  - Honest failure: callers get a structured { ok:false, error } instead of throwing, so one
 *    failing integration can't crash the dashboard.
 */

const NOTION_VERSION = '2022-06-28';
const NOTION_BASE = 'https://api.notion.com/v1';

export function isNotionConfigured(): boolean {
  return !!process.env.NOTION_API_KEY;
}

/**
 * Result envelope. Uses optional fields (not a discriminated union) so callers can read
 * `.error`/`.unconfigured` after checking `.ok` without relying on cross-module narrowing.
 */
export interface NotionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  /** True when the failure is "not configured" rather than an API/network error. */
  unconfigured?: boolean;
}

async function notionFetch<T>(
  pathname: string,
  init?: { method?: string; body?: unknown },
): Promise<NotionResult<T>> {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    return { ok: false, unconfigured: true, error: 'Notion is not configured. Set NOTION_API_KEY on the server.' };
  }
  try {
    const res = await fetch(`${NOTION_BASE}${pathname}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    const json = (await res.json()) as any;
    if (!res.ok) {
      return {
        ok: false,
        error: json?.message || `Notion API error (HTTP ${res.status}).`,
      };
    }
    return { ok: true, data: json as T };
  } catch (err: any) {
    return {
      ok: false,
      error: 'Notion could not be reached. Your F.I.S.H. Scholar data is safe.' + (err?.message ? ` (${err.message})` : ''),
    };
  }
}

/** Verify the token by hitting a lightweight endpoint. */
export async function checkConnection(): Promise<
  NotionResult<{ connected: true }>
> {
  const result = await notionFetch<any>('/users/me');
  if (!result.ok) return result;
  return { ok: true, data: { connected: true } };
}

export interface NotionDatabaseSummary {
  id: string;
  title: string;
}

/** List databases the integration has been shared with (read-only search). */
export async function listDatabases(): Promise<NotionResult<NotionDatabaseSummary[]>> {
  const result = await notionFetch<any>('/search', {
    method: 'POST',
    body: { filter: { property: 'object', value: 'database' }, page_size: 50 },
  });
  if (!result.ok) return result;
  const dbs: NotionDatabaseSummary[] = (result.data.results ?? []).map((db: any) => ({
    id: db.id,
    title: (db.title ?? []).map((t: any) => t?.plain_text ?? '').join('') || 'Untitled database',
  }));
  return { ok: true, data: dbs };
}

export interface NotionPreview {
  schema: NotionPropertySchema[];
  pages: NotionNormalizedPage[];
}

/**
 * Preview a database: its property schema plus normalized pages (capped) for the mapping UI.
 * Read-only.
 */
export async function previewDatabase(
  databaseId: string,
  pageSize = 25,
): Promise<NotionResult<NotionPreview>> {
  const meta = await notionFetch<any>(`/databases/${databaseId}`);
  if (!meta.ok) return meta;
  const schema = extractDatabaseSchema(meta.data);

  const query = await notionFetch<any>(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: { page_size: Math.min(pageSize, 100) },
  });
  if (!query.ok) return query;

  const pages = (query.data.results ?? []).map(normalizeNotionPage);
  return { ok: true, data: { schema, pages } };
}
