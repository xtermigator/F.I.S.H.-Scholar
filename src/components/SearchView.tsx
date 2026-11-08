import React, { useMemo, useState } from 'react';
import {
  Search as SearchIcon,
  ClipboardList,
  MessagesSquare,
  BookOpen,
  GraduationCap,
  Quote,
  StickyNote,
  Reply,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../state/store';
import {
  searchAll,
  SEARCH_TYPE_LABELS,
  type SearchEntityType,
  type SearchResult,
  type SearchIndexData,
} from '../state/search';
import type { TabType } from '../types';

/**
 * Global search UI (spec: global search / M4). Searches every entity type from the store and
 * lets the student jump to the relevant tab. Fully client-side over persisted data.
 */

const TYPE_ICON: Record<SearchEntityType, React.ComponentType<{ className?: string }>> = {
  course: GraduationCap,
  assignment: ClipboardList,
  discussion: MessagesSquare,
  discussionResponse: Reply,
  reading: BookOpen,
  assessment: GraduationCap,
  citation: Quote,
  note: StickyNote,
};

const FILTERABLE_TYPES: SearchEntityType[] = [
  'assignment',
  'discussion',
  'reading',
  'assessment',
  'citation',
  'note',
  'course',
];

export const SearchView: React.FC<{ onNavigate?: (tab: TabType) => void }> = ({ onNavigate }) => {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<SearchEntityType | 'all'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('');

  const data: SearchIndexData = useMemo(
    () => ({
      courses: store.courses,
      assignments: store.assignments,
      discussions: store.discussions,
      discussionResponses: store.discussionResponses,
      readings: store.readings,
      assessments: store.assessments,
      citations: store.citations,
      notes: store.notes,
    }),
    [store.courses, store.assignments, store.discussions, store.discussionResponses, store.readings, store.assessments, store.citations, store.notes],
  );

  const results: SearchResult[] = useMemo(
    () =>
      searchAll(query, data, {
        types: activeType === 'all' ? undefined : [activeType],
        courseId: courseFilter || undefined,
      }),
    [query, data, activeType, courseFilter],
  );

  return (
    <section aria-labelledby="search-heading" className="mx-auto max-w-3xl space-y-5">
      <header className="flex items-center gap-2.5">
        <SearchIcon className="h-5 w-5 text-amber-600" aria-hidden="true" />
        <div>
          <h1 id="search-heading" className="text-lg font-serif font-bold text-neutral-900">
            Search
          </h1>
          <p className="text-xs text-neutral-500">
            Across courses, assignments, discussions, readings, sources, and notes.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xs">
        <label htmlFor="global-search" className="sr-only">
          Search your academic data
        </label>
        <div className="flex items-center gap-2 px-2">
          <SearchIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
          <input
            id="global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search everything…"
            className="w-full bg-transparent py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveType('all')}
          aria-pressed={activeType === 'all'}
          className={`rounded-full px-3 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
            activeType === 'all'
              ? 'bg-neutral-900 text-white'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          All
        </button>
        {FILTERABLE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            aria-pressed={activeType === t}
            className={`rounded-full px-3 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 ${
              activeType === t
                ? 'bg-neutral-900 text-white'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {SEARCH_TYPE_LABELS[t]}
          </button>
        ))}
        {store.courses.length > 0 && (
          <select
            aria-label="Filter by course"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="ml-auto rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          >
            <option value="">All courses</option>
            {store.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {query.trim() === '' ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          Start typing to search across everything you've added.
        </p>
      ) : results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          No matches for “{query}”.
        </p>
      ) : (
        <>
          <p className="text-xs text-neutral-500">
            {results.length} result{results.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-2">
            {results.map((r) => {
              const Icon = TYPE_ICON[r.type];
              return (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(r.tab as TabType)}
                    className="flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-neutral-800">{r.title}</span>
                        <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                          {SEARCH_TYPE_LABELS[r.type]}
                        </span>
                        {r.courseCode && (
                          <span className="shrink-0 text-[10px] text-neutral-400">{r.courseCode}</span>
                        )}
                      </div>
                      {r.snippet && <p className="mt-0.5 truncate text-xs text-neutral-500">{r.snippet}</p>}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};
