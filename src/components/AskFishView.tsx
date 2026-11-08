import React, { useMemo, useRef, useState } from 'react';
import { Sparkles, Send, ShieldCheck, ClipboardList, MessagesSquare, BookOpen, GraduationCap } from 'lucide-react';
import { useStore } from '../state/store';
import {
  answerQuestion,
  type AskAnswer,
  type AskContext,
  type AnswerItem,
} from '../state/askFish';

/**
 * "Ask FISH" — database-aware assistant (spec R8.5 / milestone M3).
 *
 * Answers come from the student's own persisted data via the pure askFish engine, so this
 * works with NO AI key and never fabricates. Each answer shows its source ("your F.I.S.H.
 * Scholar data") for provenance (academic-integrity steering).
 */

interface Turn {
  id: string;
  question: string;
  answer: AskAnswer;
}

const STARTER_QUESTIONS = [
  "What's due today?",
  "What's due this week?",
  'What discussion replies do I still owe?',
  'What should I work on next?',
  'Which course has the heaviest workload?',
  "What's overdue?",
];

export const AskFishView: React.FC = () => {
  const store = useStore();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const liveRef = useRef<HTMLDivElement>(null);

  const ctx: AskContext = useMemo(
    () => ({
      data: {
        assignments: store.assignments,
        discussions: store.discussions,
        discussionResponses: store.discussionResponses,
        readings: store.readings,
        assessments: store.assessments,
      },
      courses: store.courses,
      now: new Date(),
    }),
    [store.assignments, store.discussions, store.discussionResponses, store.readings, store.assessments, store.courses],
  );

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const answer = answerQuestion(q, ctx);
    setTurns((prev) => [...prev, { id: `turn-${Date.now()}`, question: q, answer }]);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <section aria-labelledby="ask-heading" className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-2.5">
        <Sparkles className="h-5 w-5 text-amber-600" aria-hidden="true" />
        <div>
          <h1 id="ask-heading" className="text-lg font-serif font-bold text-neutral-900">
            Ask FISH
          </h1>
          <p className="text-xs text-neutral-500">
            Answers come straight from your own data — nothing is made up.
          </p>
        </div>
      </header>

      {/* Starter questions (also serve as empty state) */}
      {turns.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div ref={liveRef} aria-live="polite" className="space-y-4">
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <p className="text-right">
              <span className="inline-block rounded-2xl rounded-br-sm bg-neutral-900 px-3 py-2 text-sm text-white">
                {turn.question}
              </span>
            </p>
            <AnswerCard answer={turn.answer} onAsk={ask} />
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="sticky bottom-4 flex items-center gap-2">
        <label htmlFor="ask-input" className="sr-only">
          Ask a question about your coursework
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about what's due, replies, workload…"
          className="flex-1 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Ask</span>
        </button>
      </form>
    </section>
  );
};

const ITEM_ICON = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('repl') || l.includes('discussion')) return MessagesSquare;
  if (l.includes('read')) return BookOpen;
  if (l.includes('quiz') || l.includes('test') || l.includes('exam')) return GraduationCap;
  return ClipboardList;
};

const AnswerCard: React.FC<{ answer: AskAnswer; onAsk: (q: string) => void }> = ({ answer, onAsk }) => {
  return (
    <div className="rounded-2xl rounded-bl-sm border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-800">{answer.summary}</p>

      {answer.items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {answer.items.map((item: AnswerItem) => {
            const Icon = ITEM_ICON(item.label);
            return (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800">{item.label}</p>
                  <p className="text-[11px] text-neutral-500">
                    {item.courseCode ? `${item.courseCode}` : ''}
                    {item.courseCode && item.detail ? ' · ' : ''}
                    {item.detail ?? ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Provenance — always shown */}
      <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Source: {answer.source}
      </p>

      {answer.suggestions && answer.suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {answer.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAsk(s)}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
