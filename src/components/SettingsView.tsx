import React, { useState } from 'react';
import { Trash2, Download, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { useStore } from '../state/store';
import { NotionPanel } from './NotionPanel';
import { SyllabusPanel } from './SyllabusPanel';
import { ApiKeysPanel } from './ApiKeysPanel';

/**
 * Settings: demo-data removal (R12), data export (R1/R12), and status notes. Kept intentionally
 * simple for the first milestone; AI provider + Notion connection panels arrive in later phases.
 */
export const SettingsView: React.FC = () => {
  const { clearDemo, reseedDemo, exportJson, courses, assignments, discussions } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const demoCount =
    [...courses, ...assignments, ...discussions].filter((e: any) => e.isDemo).length;

  const handleClearDemo = async () => {
    if (!confirm('Remove all demo-labeled data? Your own records are kept.')) return;
    setBusy('clear');
    await clearDemo();
    setBusy(null);
    setMessage('Demo data removed. Your own records are untouched.');
  };

  const handleReseed = async () => {
    setBusy('reseed');
    await reseedDemo();
    setBusy(null);
    setMessage('Demo data restored.');
  };

  const handleExport = async () => {
    setBusy('export');
    const json = await exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fish-scholar-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(null);
    setMessage('Exported a full JSON snapshot of your data.');
  };

  return (
    <section aria-labelledby="settings-heading" className="max-w-2xl space-y-6">
      <header>
        <h1 id="settings-heading" className="text-lg font-serif font-bold text-neutral-900">
          Settings
        </h1>
        <p className="text-xs text-neutral-500">Your data, demo content, and privacy.</p>
      </header>

      {message && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <ApiKeysPanel />

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
          <Info className="h-4 w-4 text-neutral-500" aria-hidden="true" /> Demo data
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          F.I.S.H. Scholar ships with a few clearly-labeled sample records so nothing is empty on
          first run. {demoCount > 0 ? `You currently have ${demoCount} demo record(s).` : 'No demo records are present.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleClearDemo}
            disabled={busy != null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove all demo data
          </button>
          <button
            type="button"
            onClick={handleReseed}
            disabled={busy != null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Restore demo data
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
          <Download className="h-4 w-4 text-neutral-500" aria-hidden="true" /> Export
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Download a complete JSON snapshot of everything stored on this device.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={busy != null}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Export JSON
        </button>
      </div>

      <SyllabusPanel />

      <NotionPanel />

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Privacy
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Your academic records are stored privately in this browser (IndexedDB) and never sent
          anywhere without your action. AI provider keys and integrations are handled server-side
          and are never exposed to the page.
        </p>
      </div>
    </section>
  );
};
