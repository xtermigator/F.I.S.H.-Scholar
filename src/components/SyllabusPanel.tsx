import React, { useState } from 'react';
import { FileUp, CheckCircle2, Info } from 'lucide-react';
import { useStore } from '../state/store';
import {
  parsePastedSyllabus,
  confirmToRecords,
  type SyllabusCandidate,
} from '../state/syllabusImport';

/**
 * Syllabus importer panel (spec R21). Paste syllabus text → preview candidate assignments →
 * edit/select → confirm import into a course. Preview-then-confirm only; dates that can't be
 * read are shown as raw text and never guessed (academic-integrity steering).
 *
 * Works fully offline on pasted text. (An AI extraction path exists server-side and can feed
 * the same preview via normalizeExtracted, added later behind the provider gate.)
 */
export const SyllabusPanel: React.FC = () => {
  const { courses, save } = useStore();
  const [text, setText] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [candidates, setCandidates] = useState<SyllabusCandidate[] | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const preview = () => {
    setResult(null);
    const parsed = parsePastedSyllabus(text);
    setCandidates(parsed.candidates);
  };

  const updateCandidate = (key: string, patch: Partial<SyllabusCandidate>) => {
    setCandidates((prev) => (prev ? prev.map((c) => (c.key === key ? { ...c, ...patch } : c)) : prev));
  };

  const confirm = async () => {
    if (!candidates || !courseId) return;
    const records = confirmToRecords(candidates, courseId);
    for (const rec of records) {
      await save('assignments', rec);
    }
    setResult(
      records.length > 0
        ? `Imported ${records.length} assignment${records.length === 1 ? '' : 's'} into the selected course.`
        : 'Nothing selected to import.',
    );
    setCandidates(null);
    setText('');
  };

  const selectedCount = candidates?.filter((c) => c.selected && c.title.trim()).length ?? 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
        <FileUp className="h-4 w-4 text-neutral-500" aria-hidden="true" /> Syllabus importer
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Paste assignment lines from your syllabus (one per line). You'll review everything before
        anything is saved.
      </p>

      {result && (
        <p role="status" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {result}
        </p>
      )}

      {!candidates ? (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="syll-course" className="block text-xs font-medium text-neutral-600">
              Import into course
            </label>
            <select
              id="syll-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}{c.title ? ` · ${c.title}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="syll-text" className="block text-xs font-medium text-neutral-600">
              Syllabus text
            </label>
            <textarea
              id="syll-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder={'e.g.\n- Literature Review (due 2026-10-01)\n- Midterm Project — 2026-11-05\n- Weekly reflection (due each Friday)'}
              className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={preview}
            disabled={!text.trim() || !courseId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Preview
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="inline-flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
            Review below. Untick anything you don't want, edit titles, then confirm. Dates that
            couldn't be read are shown as-is and left unset — never guessed.
          </p>

          {candidates.length === 0 ? (
            <p className="text-sm text-neutral-500">No lines found to import.</p>
          ) : (
            <ul className="space-y-2">
              {candidates.map((c) => (
                <li key={c.key} className="flex items-start gap-2 rounded-lg border border-neutral-200 p-2.5">
                  <input
                    type="checkbox"
                    checked={c.selected}
                    onChange={(e) => updateCandidate(c.key, { selected: e.target.checked })}
                    aria-label={`Import ${c.title || 'this item'}`}
                    className="mt-1.5 rounded border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  />
                  <div className="min-w-0 flex-1">
                    <label className="sr-only" htmlFor={`title-${c.key}`}>Title</label>
                    <input
                      id={`title-${c.key}`}
                      value={c.title}
                      onChange={(e) => updateCandidate(c.key, { title: e.target.value })}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                    />
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {c.dateParsed && c.dueDate ? (
                        <>Due {c.dueDate}</>
                      ) : c.rawDue ? (
                        <>Due text: “{c.rawDue}” <span className="text-amber-700">· date not read — set it after import</span></>
                      ) : (
                        <>No date</>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              Confirm import ({selectedCount})
            </button>
            <button
              type="button"
              onClick={() => setCandidates(null)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
