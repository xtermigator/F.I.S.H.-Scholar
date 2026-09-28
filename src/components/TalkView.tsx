import React, { useEffect, useRef, useState } from 'react';
import { Video, ShieldCheck, AlertTriangle, Loader2, Info, Send, MessageSquareQuote } from 'lucide-react';
import { useStore } from '../state/store';
import type { GroundingInputs, ChatMessage } from '../state/chatGrounding';

/**
 * "Talk to FISH" — real-time anam.ai avatar (spec: AI companion / M4 avatar).
 *
 * The avatar's answers are grounded in the student's own data through the server bridge
 * (registered as an anam custom LLM at <APP_URL>/api/anam/llm). This view:
 *   1. checks /api/anam/status (never sees the key),
 *   2. asks the server for a short-lived session token,
 *   3. loads the anam browser SDK and streams the avatar into a <video> element.
 *
 * The anam SDK is loaded dynamically from a CDN so the app builds without a hard dependency,
 * and the whole feature stays inert (with an honest message) until ANAM_API_KEY is configured.
 */

type Status =
  | { state: 'checking' }
  | { state: 'unconfigured'; needsPersona: boolean }
  | { state: 'ready' }
  | { state: 'connecting' }
  | { state: 'live' }
  | { state: 'error'; message: string };

const ANAM_SDK_URL = 'https://esm.sh/@anam-ai/js-sdk@latest';

export const TalkView: React.FC = () => {
  const store = useStore();
  const [status, setStatus] = useState<Status>({ state: 'checking' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/anam/status');
        const data = await res.json();
        if (cancelled) return;
        if (!data.configured) {
          setStatus({ state: 'unconfigured', needsPersona: false });
        } else if (data.needsPersonaConfig) {
          setStatus({ state: 'unconfigured', needsPersona: true });
        } else {
          setStatus({ state: 'ready' });
        }
      } catch {
        if (!cancelled) setStatus({ state: 'error', message: 'Could not check the avatar service.' });
      }
    })();
    return () => {
      cancelled = true;
      // Best-effort teardown of any live session.
      try {
        clientRef.current?.stopStreaming?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = async () => {
    setStatus({ state: 'connecting' });
    try {
      // 1) Short-lived token minted server-side (key never reaches the browser).
      const tokenRes = await fetch('/api/anam/session-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientLabel: 'fish-scholar' }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok || !tokenJson.sessionToken) {
        setStatus({ state: 'error', message: tokenJson.error || 'Could not start a session.' });
        return;
      }

      // 2) Load the anam SDK dynamically (kept out of the bundle).
      const mod: any = await import(/* @vite-ignore */ ANAM_SDK_URL);
      const createClient = mod.createClient || mod.default?.createClient;
      if (!createClient) {
        setStatus({ state: 'error', message: 'The anam SDK could not be loaded in this environment.' });
        return;
      }

      // 3) Start streaming into the <video> element.
      const client = createClient(tokenJson.sessionToken);
      clientRef.current = client;
      if (videoRef.current) {
        await client.streamToVideoElement(videoRef.current.id);
      }
      setStatus({ state: 'live' });
    } catch (err: any) {
      setStatus({ state: 'error', message: err?.message || 'The avatar session failed to start.' });
    }
  };

  const stop = () => {
    try {
      clientRef.current?.stopStreaming?.();
    } catch {
      /* ignore */
    }
    clientRef.current = null;
    setStatus({ state: 'ready' });
  };

  return (
    <section aria-labelledby="talk-heading" className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-2.5">
        <Video className="h-5 w-5 text-amber-600" aria-hidden="true" />
        <div>
          <h1 id="talk-heading" className="text-lg font-serif font-bold text-neutral-900">
            Talk to FISH
          </h1>
          <p className="text-xs text-neutral-500">
            A face-to-face study companion, grounded in your own coursework.
          </p>
        </div>
      </header>

      {/* Integrity note */}
      <p className="inline-flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
        The avatar answers from your F.I.S.H. Scholar data first and labels anything general as
        unverified — it won't invent citations, grades, or deadlines.
      </p>

      {status.state === 'checking' && (
        <p className="inline-flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking availability…
        </p>
      )}

      {status.state === 'unconfigured' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          {status.needsPersona ? (
            <>
              <p className="font-medium text-neutral-800">Almost there — finish the avatar setup.</p>
              <p className="mt-1">
                <code className="rounded bg-neutral-100 px-1">ANAM_API_KEY</code> is set, but the persona
                isn't. Set <code className="rounded bg-neutral-100 px-1">ANAM_PERSONA_ID</code>, or all of{' '}
                <code className="rounded bg-neutral-100 px-1">ANAM_AVATAR_ID</code>,{' '}
                <code className="rounded bg-neutral-100 px-1">ANAM_VOICE_ID</code>, and{' '}
                <code className="rounded bg-neutral-100 px-1">ANAM_LLM_ID</code> in your server{' '}
                <code className="rounded bg-neutral-100 px-1">.env</code>, then reload.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-neutral-800">The avatar isn't configured yet.</p>
              <p className="mt-1">
                Add <code className="rounded bg-neutral-100 px-1">ANAM_API_KEY</code> to your server{' '}
                <code className="rounded bg-neutral-100 px-1">.env</code> (never in the browser). Meanwhile,
                the text-based <strong>Ask FISH</strong> tab already answers from your data.
              </p>
            </>
          )}
        </div>
      )}

      {(status.state === 'ready' || status.state === 'connecting' || status.state === 'live') && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              id="anam-video"
              ref={videoRef}
              autoPlay
              playsInline
              className="aspect-video w-full bg-neutral-900"
            />
          </div>
          <div className="flex items-center gap-2">
            {status.state === 'live' ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              >
                End session
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={status.state === 'connecting'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                {status.state === 'connecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Connecting…
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" aria-hidden="true" /> Start conversation
                  </>
                )}
              </button>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Your key stays on the server
            </span>
          </div>
        </div>
      )}

      {status.state === 'error' && (
        <p role="alert" className="inline-flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {status.message} Your academic records remain accessible.
        </p>
      )}

      {/* Text chat — always available, works even before the avatar is configured. */}
      <TextChatPanel />
    </section>
  );
};

/** Build the grounding inputs the server needs from the browser store. */
function useGroundingInputs(): () => GroundingInputs {
  const store = useStore();
  return () => {
    const dash = {
      assignments: store.assignments,
      discussions: store.discussions,
      discussionResponses: store.discussionResponses,
      readings: store.readings,
      assessments: store.assessments,
    };
    return {
      askCtx: { data: dash, courses: store.courses, now: new Date() },
      search: { ...dash, courses: store.courses, citations: store.citations, notes: store.notes },
      courses: store.courses,
    };
  };
}

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  note?: string;
}

const TextChatPanel: React.FC = () => {
  const buildInputs = useGroundingInputs();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const nextTurns: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(nextTurns);
    setInput('');
    setBusy(true);

    // Only send the conversation as chat messages; grounding is added server-side.
    const messages: ChatMessage[] = nextTurns.map((t) => ({ role: t.role, content: t.content }));
    try {
      const res = await fetch('/api/anam/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, groundingInputs: buildInputs() }),
      });
      const data = await res.json();
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || "I couldn't answer that.", note: data.note },
      ]);
    } catch {
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: 'AI assistance is temporarily unavailable. Your records are safe.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
        <MessageSquareQuote className="h-4 w-4 text-amber-600" aria-hidden="true" /> Text chat
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Chat in text with the same knowledge-base-grounded companion — works now, even before the
        avatar is set up.
      </p>

      <div ref={logRef} aria-live="polite" className="mt-3 max-h-72 space-y-2 overflow-auto">
        {turns.length === 0 ? (
          <p className="text-sm text-neutral-400">Ask about your coursework to get started.</p>
        ) : (
          turns.map((t, i) => (
            <div key={i} className={t.role === 'user' ? 'text-right' : 'text-left'}>
              <span
                className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  t.role === 'user'
                    ? 'rounded-br-sm bg-neutral-900 text-white'
                    : 'rounded-bl-sm border border-neutral-200 bg-neutral-50 text-neutral-800'
                }`}
              >
                {t.content}
                {t.note && <span className="mt-1 block text-[10px] text-neutral-400">{t.note}</span>}
              </span>
            </div>
          ))
        )}
        {busy && (
          <p className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Thinking…
          </p>
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <label htmlFor="talk-text-input" className="sr-only">
          Message FISH
        </label>
        <input
          id="talk-text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about what's due, replies, workload…"
          className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Send</span>
        </button>
      </form>
    </div>
  );
};
