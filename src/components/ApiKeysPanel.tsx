import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Check, Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * API key management panel (spec: in-app key entry).
 *
 * Shows which integration keys are configured (masked) and lets the student set them from the
 * UI. Values are POSTed to the server, which writes them to the server-side `.env` and applies
 * them live. Raw secrets are NEVER returned to the browser — we only ever receive masked status
 * (.kiro/steering/security.md).
 */

interface KeyStatus {
  key: string;
  label: string;
  group: string;
  secret: boolean;
  hint?: string;
  configured: boolean;
  display: string;
}

export const ApiKeysPanel: React.FC = () => {
  const [keys, setKeys] = useState<KeyStatus[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/settings/keys');
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      setError('Could not load settings.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (key: string) => {
    setSavingKey(key);
    setError(null);
    try {
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: drafts[key] ?? '' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save.');
      } else {
        setKeys(data.keys ?? keys);
        setDrafts((d) => ({ ...d, [key]: '' }));
        setSavedKey(key);
        window.setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1500);
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSavingKey(null);
    }
  };

  const groups = keys
    ? Array.from(new Set(keys.map((k) => k.group)))
    : [];

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
        <KeyRound className="h-4 w-4 text-neutral-500" aria-hidden="true" /> API keys &amp; integrations
      </h2>
      <p className="mt-1 inline-flex items-start gap-2 text-sm text-neutral-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        Keys are stored on the server (in a git-ignored <code className="rounded bg-neutral-100 px-1">.env</code>)
        and applied immediately. Saved secrets are never shown back to the browser — only a masked
        preview.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800">
          {error}
        </p>
      )}

      {!keys ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <fieldset key={group}>
              <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                {group}
              </legend>
              <div className="space-y-3">
                {keys
                  .filter((k) => k.group === group)
                  .map((k) => (
                    <div key={k.key} className="rounded-xl border border-neutral-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <label htmlFor={`key-${k.key}`} className="text-sm font-medium text-neutral-800">
                            {k.label}
                          </label>
                          <p className="text-[11px] text-neutral-400">
                            <code>{k.key}</code>
                            {k.hint ? ` · ${k.hint}` : ''}
                          </p>
                        </div>
                        {k.configured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                            <Check className="h-3 w-3" aria-hidden="true" /> Set{k.display ? `: ${k.display}` : ''}
                          </span>
                        ) : (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                            Not set
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            id={`key-${k.key}`}
                            type={k.secret && !reveal[k.key] ? 'password' : 'text'}
                            value={drafts[k.key] ?? ''}
                            onChange={(e) => setDrafts((d) => ({ ...d, [k.key]: e.target.value }))}
                            placeholder={k.configured ? 'Enter a new value to replace' : 'Enter value'}
                            autoComplete="off"
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 pr-9 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                          />
                          {k.secret && (
                            <button
                              type="button"
                              onClick={() => setReveal((r) => ({ ...r, [k.key]: !r[k.key] }))}
                              aria-label={reveal[k.key] ? 'Hide value' : 'Show value'}
                              className="absolute inset-y-0 right-1 my-auto h-7 w-7 rounded text-neutral-400 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                            >
                              {reveal[k.key] ? <EyeOff className="mx-auto h-4 w-4" aria-hidden="true" /> : <Eye className="mx-auto h-4 w-4" aria-hidden="true" />}
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => save(k.key)}
                          disabled={savingKey === k.key || (drafts[k.key] ?? '') === ''}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                        >
                          {savingKey === k.key ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : savedKey === k.key ? (
                            <Check className="h-4 w-4" aria-hidden="true" />
                          ) : null}
                          {savedKey === k.key ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
};
