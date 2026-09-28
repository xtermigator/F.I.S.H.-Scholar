import React, { useMemo, useState } from 'react';
import { Brain, Info, RotateCw } from 'lucide-react';
import { useStore } from '../state/store';
import {
  buildStudyGuide,
  buildFlashcards,
  buildPracticeQuestions,
  STUDY_DISCLAIMER,
  type Flashcard,
} from '../state/studyTools';

/**
 * Study tools UI (spec R9). Generates a study guide, flashcards, or practice prompts from the
 * student's OWN readings, assessments, and saved citations. The non-official disclaimer is
 * always visible (academic-integrity steering).
 */

type Mode = 'guide' | 'flashcards' | 'practice';

const MODES: { value: Mode; label: string }[] = [
  { value: 'guide', label: 'Study guide' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'practice', label: 'Practice questions' },
];

export const StudyView: React.FC = () => {
  const store = useStore();
  const [courseId, setCourseId] = useState(store.courses[0]?.id ?? '');
  const [mode, setMode] = useState<Mode>('guide');

  const course = store.courses.find((c) => c.id === courseId);

  const guide = useMemo(
    () => (course ? buildStudyGuide(course, store.readings, store.assessments, store.citations) : null),
    [course, store.readings, store.assessments, store.citations],
  );
  const flashcards = useMemo(
    () => (course ? buildFlashcards(course, store.readings, store.citations) : []),
    [course, store.readings, store.citations],
  );
  const practice = useMemo(
    () => (course ? buildPracticeQuestions(course, store.readings, store.assessments) : []),
    [course, store.readings, store.assessments],
  );

  return (
    <section aria-labelledby="study-heading" className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-center gap-2.5">
        <Brain className="h-5 w-5 text-amber-600" aria-hidden="true" />
        <div>
          <h1 id="study-heading" className="text-lg font-serif font-bold text-neutral-900">
            Study tools
          </h1>
          <p className="text-xs text-neutral-500">Built from your notes, readings, and sources.</p>
        </div>
      </header>

      {/* Always-visible integrity disclaimer */}
      <p className="inline-flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
        {STUDY_DISCLAIMER}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="study-course" className="sr-only">Course</label>
        <select
          id="study-course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          {store.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}{c.title ? ` · ${c.title}` : ''}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={`rounded-full px-3 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
                mode === m.value
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!course ? (
        <p className="text-sm text-neutral-500">Add a course first.</p>
      ) : mode === 'guide' ? (
        guide && !guide.empty ? (
          <div className="space-y-4">
            {guide.sections.map((s) => (
              <div key={s.heading} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-semibold text-neutral-900">{s.heading}</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {s.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No readings, saved sources, or test coverage for this course yet. Add reading concepts, citation quotes, or assessment coverage and they'll appear here." />
        )
      ) : mode === 'flashcards' ? (
        flashcards.length > 0 ? (
          <FlashcardDeck cards={flashcards} />
        ) : (
          <EmptyState message="No flashcards yet. Add reading concepts or saved citations for this course." />
        )
      ) : practice.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <ol className="list-decimal space-y-3 pl-5">
            {practice.map((q, i) => (
              <li key={i} className="text-sm text-neutral-800">
                {q.prompt}
                <span className="mt-0.5 block text-[11px] text-neutral-400">{q.basedOn}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <EmptyState message="No practice questions yet. Add test/quiz coverage or reading concepts for this course." />
      )}
    </section>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
    {message}
  </p>
);

const FlashcardDeck: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => (i + delta + cards.length) % cards.length);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
          {flipped ? 'Answer' : 'Prompt'} · from {card.source}
        </p>
        <p className="min-h-[4rem] whitespace-pre-wrap text-neutral-800">
          {flipped ? card.back : card.front}
        </p>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> {flipped ? 'Show prompt' : 'Flip'}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          Previous
        </button>
        <span className="text-xs text-neutral-500" aria-live="polite">
          Card {index + 1} of {cards.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          Next
        </button>
      </div>
    </div>
  );
};
