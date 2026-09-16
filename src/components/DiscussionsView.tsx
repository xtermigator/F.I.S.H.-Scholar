import React, { useMemo, useState } from 'react';
import {
  MessagesSquare,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Reply,
  Inbox,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../state/store';
import { replyProgress, isDiscussionComplete } from '../state/selectors';
import type {
  Discussion,
  DiscussionResponse,
  OriginalPostStatus,
} from '../types';

/**
 * Discussion & peer-response tracker (spec R4 — highest-priority feature).
 *
 * Shows, per discussion: original-post status, "Completed replies: X / N required",
 * "N remaining", incoming classmate replies, and follow-up flags. Status is conveyed with
 * text + icon, never color alone (accessibility steering).
 */

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const POST_STATUS_LABEL: Record<OriginalPostStatus, string> = {
  not_started: 'Not started',
  drafting: 'Drafting',
  ready: 'Ready',
  submitted: 'Submitted',
};

export const DiscussionsView: React.FC = () => {
  const {
    discussions,
    discussionResponses,
    courses,
    save,
    remove,
  } = useStore();

  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const courseLabel = (courseId: string) => {
    const c = courses.find((x) => x.id === courseId);
    return c ? `${c.code}${c.title ? ` · ${c.title}` : ''}` : 'Unassigned course';
  };

  const responsesFor = (discussionId: string) =>
    discussionResponses.filter((r) => r.discussionId === discussionId);

  return (
    <section aria-labelledby="discussions-heading" className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <MessagesSquare className="h-5 w-5 text-amber-600" aria-hidden="true" />
          <div>
            <h1 id="discussions-heading" className="text-lg font-serif font-bold text-neutral-900">
              Discussions
            </h1>
            <p className="text-xs text-neutral-500">
              Track initial posts and required peer replies across every course.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New discussion
        </button>
      </header>

      {discussions.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          No discussions yet. Add one to start tracking your initial post and required replies.
        </p>
      )}

      <ul className="space-y-3">
        {discussions.map((d) => {
          const responses = responsesFor(d.id);
          const progress = replyProgress(d, responses);
          const complete = isDiscussionComplete(d, responses);
          const posted = d.originalPost?.status === 'submitted';
          const expanded = expandedId === d.id;

          return (
            <li
              key={d.id}
              className="rounded-xl border border-neutral-200 bg-white shadow-xs"
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {d.isDemo && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                        DEMO
                      </span>
                    )}
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                      {courseLabel(d.courseId)}
                    </span>
                    {d.week != null && (
                      <span className="text-[10px] text-neutral-400">Week {d.week}</span>
                    )}
                  </div>
                  <h2 className="mt-1 truncate font-semibold text-neutral-900">{d.title}</h2>
                  {d.prompt && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{d.prompt}</p>
                  )}
                </div>

                {/* Status summary — text + icon, not color alone */}
                <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                    {posted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                    )}
                    Initial post: {POST_STATUS_LABEL[d.originalPost?.status ?? 'not_started']}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                    <Reply className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                    Replies: {progress.completed} / {progress.required} required
                    {progress.remaining > 0 && (
                      <span className="font-semibold text-neutral-900">
                        · {progress.remaining} remaining
                      </span>
                    )}
                  </span>
                  {progress.incomingUnanswered > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                      <Inbox className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      {progress.incomingUnanswered} classmate repl
                      {progress.incomingUnanswered === 1 ? 'y' : 'ies'} to you
                    </span>
                  )}
                  {progress.followUps > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                      {progress.followUps} may warrant follow-up
                    </span>
                  )}
                  {complete && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Complete
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-neutral-500" htmlFor={`post-${d.id}`}>
                    Original post status
                  </label>
                  <select
                    id={`post-${d.id}`}
                    value={d.originalPost?.status ?? 'not_started'}
                    onChange={(e) =>
                      save<Discussion>('discussions', {
                        ...d,
                        originalPost: {
                          ...d.originalPost,
                          status: e.target.value as OriginalPostStatus,
                          submittedAt:
                            e.target.value === 'submitted'
                              ? new Date().toISOString()
                              : d.originalPost?.submittedAt,
                        },
                      })
                    }
                    className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    <option value="not_started">Not started</option>
                    <option value="drafting">Drafting</option>
                    <option value="ready">Ready</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : d.id)}
                    aria-expanded={expanded}
                    className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    {expanded ? 'Hide replies' : `Manage replies (${responses.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this discussion and its tracked replies?')) {
                        responses.forEach((r) => remove('discussionResponses', r.id));
                        remove('discussions', d.id);
                      }
                    }}
                    aria-label={`Delete discussion ${d.title}`}
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {expanded && (
                <ResponseManager discussionId={d.id} responses={responses} />
              )}
            </li>
          );
        })}
      </ul>

      {showNew && (
        <NewDiscussionModal onClose={() => setShowNew(false)} />
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Peer-response manager
// ---------------------------------------------------------------------------

const ResponseManager: React.FC<{
  discussionId: string;
  responses: DiscussionResponse[];
}> = ({ discussionId, responses }) => {
  const { save, remove } = useStore();
  const [name, setName] = useState('');

  const addResponse = (direction: 'peer' | 'incoming') => {
    if (!name.trim()) return;
    const resp: DiscussionResponse = {
      id: uid('resp'),
      discussionId,
      direction,
      classmateName: name.trim(),
      drafted: false,
      submitted: false,
      followUpRequired: false,
      createdAt: '',
      updatedAt: '',
    };
    save('discussionResponses', resp);
    setName('');
  };

  return (
    <div className="border-t border-neutral-100 bg-neutral-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor={`add-resp-${discussionId}`} className="block text-[11px] font-medium text-neutral-600">
            Classmate name
          </label>
          <input
            id={`add-resp-${discussionId}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan P."
            className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          />
        </div>
        <button
          type="button"
          onClick={() => addResponse('peer')}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <Reply className="h-3.5 w-3.5" aria-hidden="true" /> Reply I owe
        </button>
        <button
          type="button"
          onClick={() => addResponse('incoming')}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        >
          <Inbox className="h-3.5 w-3.5" aria-hidden="true" /> Replied to me
        </button>
      </div>

      {responses.length === 0 ? (
        <p className="text-xs text-neutral-500">No replies tracked yet.</p>
      ) : (
        <ul className="space-y-2">
          {responses.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                {r.direction === 'incoming' ? (
                  <Inbox className="h-4 w-4 text-blue-600" aria-hidden="true" />
                ) : (
                  <Reply className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                )}
                <span className="font-medium">{r.classmateName}</span>
                <span className="text-[11px] text-neutral-400">
                  {r.direction === 'incoming' ? 'replied to me' : 'my reply'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={r.submitted}
                    onChange={() =>
                      save('discussionResponses', { ...r, submitted: !r.submitted })
                    }
                    className="rounded border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  />
                  Submitted
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={r.followUpRequired}
                    onChange={() =>
                      save('discussionResponses', {
                        ...r,
                        followUpRequired: !r.followUpRequired,
                      })
                    }
                    className="rounded border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  />
                  Follow-up
                </label>
                <button
                  type="button"
                  onClick={() => remove('discussionResponses', r.id)}
                  aria-label={`Remove reply record for ${r.classmateName}`}
                  className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// New discussion modal
// ---------------------------------------------------------------------------

const NewDiscussionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { courses, save } = useStore();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [minResponses, setMinResponses] = useState(2);
  const [week, setWeek] = useState<string>('');
  const [prompt, setPrompt] = useState('');

  const canSave = title.trim().length > 0 && courseId;

  const handleSave = () => {
    if (!canSave) return;
    const d: Discussion = {
      id: uid('disc'),
      courseId,
      title: title.trim(),
      prompt: prompt.trim() || undefined,
      week: week ? Number(week) : undefined,
      minResponses: Math.max(0, minResponses),
      status: 'not_started',
      originalPost: { status: 'not_started' },
      createdAt: '',
      updatedAt: '',
    };
    save('discussions', d);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-disc-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="new-disc-title" className="font-serif text-base font-bold text-neutral-900">
            New discussion
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
            <label htmlFor="nd-course" className="block text-xs font-medium text-neutral-600">
              Course
            </label>
            <select
              id="nd-course"
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
          <div>
            <label htmlFor="nd-title" className="block text-xs font-medium text-neutral-600">
              Title
            </label>
            <input
              id="nd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="w-24">
              <label htmlFor="nd-week" className="block text-xs font-medium text-neutral-600">
                Week
              </label>
              <input
                id="nd-week"
                type="number"
                min={1}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              />
            </div>
            <div className="w-40">
              <label htmlFor="nd-min" className="block text-xs font-medium text-neutral-600">
                Required replies
              </label>
              <input
                id="nd-min"
                type="number"
                min={0}
                value={minResponses}
                onChange={(e) => setMinResponses(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nd-prompt" className="block text-xs font-medium text-neutral-600">
              Prompt (optional)
            </label>
            <textarea
              id="nd-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-neutral-200 px-2.5 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            />
          </div>
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
            Add discussion
          </button>
        </div>
      </div>
    </div>
  );
};
