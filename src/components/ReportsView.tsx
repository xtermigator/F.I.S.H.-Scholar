import React, { useMemo, useState } from 'react';
import { FileText, Copy, Download, Check } from 'lucide-react';
import { useStore } from '../state/store';
import {
  REPORTS,
  generateReport,
  type ReportKind,
  type ReportData,
} from '../state/reports';

/**
 * Reports / export UI (spec R41). Generates Markdown summaries from the student's real data
 * and lets them copy or download each one. All content comes from the pure reports engine.
 */
export const ReportsView: React.FC = () => {
  const store = useStore();
  const [kind, setKind] = useState<ReportKind>('weekly');
  const [copied, setCopied] = useState(false);

  const data: ReportData = useMemo(
    () => ({
      courses: store.courses,
      assignments: store.assignments,
      discussions: store.discussions,
      discussionResponses: store.discussionResponses,
      readings: store.readings,
      assessments: store.assessments,
      citations: store.citations,
    }),
    [store.courses, store.assignments, store.discussions, store.discussionResponses, store.readings, store.assessments, store.citations],
  );

  const spec = REPORTS.find((r) => r.kind === kind)!;
  const markdown = useMemo(() => generateReport(kind, data, new Date()), [kind, data]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; download still works */
    }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = spec.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="reports-heading" className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-center gap-2.5">
        <FileText className="h-5 w-5 text-amber-600" aria-hidden="true" />
        <div>
          <h1 id="reports-heading" className="text-lg font-serif font-bold text-neutral-900">
            Reports
          </h1>
          <p className="text-xs text-neutral-500">
            Generated from your own data. Copy or download as Markdown.
          </p>
        </div>
      </header>

      {/* Report picker */}
      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.kind}
            type="button"
            onClick={() => setKind(r.kind)}
            aria-pressed={kind === r.kind}
            className={`rounded-full px-3 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
              kind === r.kind
                ? 'bg-neutral-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Download .md
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <label htmlFor="report-preview" className="sr-only">
          {spec.title} preview
        </label>
        <pre
          id="report-preview"
          className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-800"
        >
          {markdown}
        </pre>
      </div>
    </section>
  );
};
