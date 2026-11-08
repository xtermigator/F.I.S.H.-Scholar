import React, { useCallback, useEffect, useState } from 'react';
import {
  Link2,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useStore } from '../state/store';
import {
  suggestMapping,
  buildImportCandidates,
  candidatesToAssignments,
  MAPPABLE_FIELD_LABELS,
  type FieldMapping,
  type MappableField,
  type NotionNormalizedPage,
  type NotionPropertySchema,
  type ImportCandidate,
} from '../notion/mapping';

/**
 * Notion integration panel (spec R7). Read-only flow:
 *   status -> pick database -> preview + field mapping -> confirm -> import (deduped).
 *
 * The server holds NOTION_API_KEY; this component only calls /api/notion/* and never sees a
 * secret. Import writes into local storage only — we never write back to Notion. Duplicates
 * (already-imported pages) are detected via NotionSyncRecord and skipped. Failures are shown
 * honestly and never destroy local data (security + academic-integrity steering).
 */

type Status =
  | { state: 'loading' }
  | { state: 'unconfigured' }
  | { state: 'error'; message: string }
  | { state: 'connected' };

interface DbSummary {
  id: string;
  title: string;
}

export const NotionPanel: React.FC = () => {
  const { courses, notionSyncRecords, save } = useStore();

  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const [databases, setDatabases] = useState<DbSummary[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [schema, setSchema] = useState<NotionPropertySchema[]>([]);
  const [pages, setPages] = useState<NotionNormalizedPage[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [targetCourseId, setTargetCourseId] = useState<string>(courses[0]?.id ?? '');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setStatus({ state: 'loading' });
    try {
      const res = await fetch('/api/notion/status');
      const data = await res.json();
      if (!data.configured) return setStatus({ state: 'unconfigured' });
      if (!data.connected) {
        return setStatus({
          state: 'error',
          message: data.error || 'Notion is configured but the connection could not be verified.',
        });
      }
      setStatus({ state: 'connected' });
      const dbRes = await fetch('/api/notion/databases');
      const dbData = await dbRes.json();
      if (dbRes.ok) setDatabases(dbData.databases ?? []);
    } catch {
      setStatus({
        state: 'error',
        message: 'Notion could not be reached. Your F.I.S.H. Scholar data is safe.',
      });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const loadPreview = useCallback(async (dbId: string) => {
    setSelectedDb(dbId);
    setPreviewError(null);
    setImportResult(null);
    setPages([]);
    setSchema([]);
    if (!dbId) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/notion/databases/${dbId}/preview`);
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || 'Could not preview this database.');
        return;
      }
      setSchema(data.schema ?? []);
      setPages(data.pages ?? []);
      setMapping(suggestMapping(data.schema ?? []));
    } catch {
      setPreviewError('Notion could not be reached. Your F.I.S.H. Scholar data is safe.');
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  // Preview candidates (with dedupe against existing sync records) — computed for display.
  const candidates: ImportCandidate[] = pages.length
    ? buildImportCandidates(pages, mapping, notionSyncRecords)
    : [];
  const importable = candidates.filter((c) => !c.duplicate && c.title.trim() !== '');
  const duplicates = candidates.filter((c) => c.duplicate).length;

  const handleImport = async () => {
    if (!targetCourseId) {
      setImportResult('Choose a course to import into first.');
      return;
    }
    const built = candidatesToAssignments(importable, targetCourseId);
    for (const { assignment, syncRecord } of built) {
      await save('assignments', assignment);
      await save('notionSyncRecords', syncRecord);
    }
    setImportResult(
      `Imported ${built.length} item${built.length === 1 ? '' : 's'} into the selected course.` +
        (duplicates ? ` Skipped ${duplicates} already-imported item${duplicates === 1 ? '' : 's'}.` : ''),
    );
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
        <Link2 className="h-4 w-4 text-neutral-500" aria-hidden="true" /> Notion (read-only import)
      </h2>

      {/* Status */}
      <div className="mt-2 text-sm">
        {status.state === 'loading' && <p className="text-neutral-500">Checking connection…</p>}
        {status.state === 'unconfigured' && (
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-neutral-600">
            Notion isn't configured. Set <code className="rounded bg-neutral-200 px-1">NOTION_API_KEY</code>{' '}
            on the server (in your local <code className="rounded bg-neutral-200 px-1">.env</code>), share the
            database with your integration, then refresh. The key never leaves the server.
          </p>
        )}
        {status.state === 'error' && (
          <p role="alert" className="inline-flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {status.message}
          </p>
        )}
        {status.state === 'connected' && (
          <p className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Connected. Import is read-only —
            F.I.S.H. Scholar never writes back to Notion.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={refreshStatus}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
      </button>

      {status.state === 'connected' && (
        <div className="mt-4 space-y-4">
          {/* Database picker */}
          <div>
            <label htmlFor="notion-db" className="block text-xs font-medium text-neutral-600">
              Database
            </label>
            <select
              id="notion-db"
              value={selectedDb}
              onChange={(e) => loadPreview(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              <option value="">Select a database…</option>
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
            {databases.length === 0 && (
              <p className="mt-1 text-xs text-neutral-500">
                No databases found. Share a database with your integration in Notion, then Refresh.
              </p>
            )}
          </div>

          {loadingPreview && <p className="text-sm text-neutral-500">Loading preview…</p>}
          {previewError && (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {previewError}
            </p>
          )}

          {/* Field mapping */}
          {schema.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <Database className="h-4 w-4 text-neutral-500" aria-hidden="true" /> Map Notion
                properties → F.I.S.H. fields
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Nothing is imported until you confirm below. Edit any mapping.
              </p>
              <ul className="mt-2 space-y-2">
                {schema.map((prop) => (
                  <li key={prop.name} className="flex items-center gap-2">
                    <span className="w-1/2 truncate text-sm text-neutral-700">
                      {prop.name}{' '}
                      <span className="text-[10px] text-neutral-400">({prop.type})</span>
                    </span>
                    <label className="sr-only" htmlFor={`map-${prop.name}`}>
                      Map {prop.name} to
                    </label>
                    <select
                      id={`map-${prop.name}`}
                      value={mapping[prop.name] ?? 'ignore'}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [prop.name]: e.target.value as MappableField }))
                      }
                      className="w-1/2 rounded-md border border-neutral-200 px-2 py-1.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                    >
                      {(Object.keys(MAPPABLE_FIELD_LABELS) as MappableField[]).map((f) => (
                        <option key={f} value={f}>
                          {MAPPABLE_FIELD_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview + confirm */}
          {candidates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Preview ({importable.length} to import
                {duplicates ? `, ${duplicates} already imported` : ''})
              </h3>
              <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th scope="col" className="px-2 py-1.5 font-medium">Title</th>
                      <th scope="col" className="px-2 py-1.5 font-medium">Due</th>
                      <th scope="col" className="px-2 py-1.5 font-medium">Status</th>
                      <th scope="col" className="px-2 py-1.5 font-medium">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.externalId} className="border-t border-neutral-100">
                        <td className="px-2 py-1.5 text-neutral-800">{c.title || <em className="text-neutral-400">(no title)</em>}</td>
                        <td className="px-2 py-1.5 text-neutral-600">{c.dueDate || '—'}</td>
                        <td className="px-2 py-1.5 text-neutral-600">{c.status || '—'}</td>
                        <td className="px-2 py-1.5">
                          {c.duplicate ? (
                            <span className="text-neutral-400">Already imported</span>
                          ) : c.title.trim() ? (
                            <span className="text-emerald-700">Will import</span>
                          ) : (
                            <span className="text-amber-700">Skipped (no title)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor="notion-target-course" className="block text-xs font-medium text-neutral-600">
                    Import into course
                  </label>
                  <select
                    id="notion-target-course"
                    value={targetCourseId}
                    onChange={(e) => setTargetCourseId(e.target.value)}
                    className="mt-1 rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                        {c.title ? ` · ${c.title}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importable.length === 0 || !targetCourseId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Import {importable.length} item{importable.length === 1 ? '' : 's'}
                </button>
              </div>

              {importResult && (
                <p role="status" className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-800">
                  {importResult}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
