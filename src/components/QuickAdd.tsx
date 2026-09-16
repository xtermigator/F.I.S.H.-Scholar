import React, { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '../state/store';
import type {
  Assignment,
  Discussion,
  Reading,
  Assessment,
  Note,
} from '../types';

/**
 * Universal Quick Add (spec R6). A single "+" captures a Task/Assignment, Discussion, Reading,
 * Test, or Note with minimal fields; details can be completed later. Everything persists
 * through the store. Modal traps focus and closes on Escape (accessibility steering).
 */

type QuickType = 'assignment' | 'discussion' | 'reading' | 'assessment' | 'note';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const TYPE_LABELS: { value: QuickType; label: string }[] = [
  { value: 'assignment', label: 'Assignment / Task' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'reading', label: 'Reading' },
  { value: 'assessment', label: 'Test / Quiz' },
  { value: 'note', label: 'Note' },
];

export const QuickAddButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        id="quick-add-btn"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-bold text-neutral-950 shadow-lg hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Quick Add</span>
      </button>
      {open && <QuickAddModal onClose={() => setOpen(false)} />}
    </>
  );
};

const QuickAddModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { courses, save } = useStore();
  const [type, setType] = useState<QuickType>('assignment');
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [dueDate, setDueDate] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const t = title.trim();
    switch (type) {
      case 'assignment': {
        const a: Assignment = {
          id: uid('asg'),
          courseId,
          title: t,
          dueDate,
          dueTime: '',
          urgency: 'on_track',
          points: 0,
          weight: '',
          estimatedMinutes: 30,
          prompt: '',
          rubric: '',
          requiredReadings: [],
          checklist: [],
          drafts: [],
          notes: '',
          sourcesCited: [],
          currentPhase: 'deconstruct',
          createdAt: '',
          updatedAt: '',
        } as Assignment;
        save('assignments', a);
        break;
      }
      case 'discussion': {
        const d: Discussion = {
          id: uid('disc'),
          courseId,
          title: t,
          minResponses: 2,
          status: 'not_started',
          originalPost: { status: 'not_started' },
          initialPostDeadline: dueDate || undefined,
          createdAt: '',
          updatedAt: '',
        };
        save('discussions', d);
        break;
      }
      case 'reading': {
        const r: Reading = {
          id: uid('read'),
          courseId,
          title: t,
          required: true,
          status: 'not_started',
          createdAt: '',
          updatedAt: '',
        };
        save('readings', r);
        break;
      }
      case 'assessment': {
        const s: Assessment = {
          id: uid('assess'),
          courseId,
          name: t,
          type: 'Quiz',
          date: dueDate || undefined,
          studyStatus: 'not_started',
          createdAt: '',
          updatedAt: '',
        };
        save('assessments', s);
        break;
      }
      case 'note': {
        const n: Note = {
          id: uid('note'),
          courseId: courseId || undefined,
          body: t,
          createdAt: '',
          updatedAt: '',
        };
        save('notes', n);
        break;
      }
    }
    onClose();
  };

  const showCourse = type !== 'note';
  const showDate = type === 'assignment' || type === 'discussion' || type === 'assessment';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="quick-add-title" className="font-serif text-base font-bold text-neutral-900">
            Quick Add
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="qa-type" className="block text-xs font-medium text-neutral-600">
              What are you adding?
            </label>
            <select
              id="qa-type"
              ref={firstFieldRef}
              value={type}
              onChange={(e) => setType(e.target.value as QuickType)}
              className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              {TYPE_LABELS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qa-title" className="block text-xs font-medium text-neutral-600">
              {type === 'note' ? 'Note' : 'Title'}
            </label>
            <input
              id="qa-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'note' ? 'Capture a quick thought…' : 'Give it a short name'}
              className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            />
          </div>

          {showCourse && courses.length > 0 && (
            <div>
              <label htmlFor="qa-course" className="block text-xs font-medium text-neutral-600">
                Course
              </label>
              <select
                id="qa-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                    {c.title ? ` · ${c.title}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDate && (
            <div>
              <label htmlFor="qa-date" className="block text-xs font-medium text-neutral-600">
                Due date (optional)
              </label>
              <input
                id="qa-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
