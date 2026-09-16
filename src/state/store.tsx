import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import type {
  Repository,
  Institution,
  Course,
  Assignment,
  Discussion,
  DiscussionResponse,
  Reading,
  Assessment,
  Citation,
  Note,
  EntityBase,
  Persistable,
  Collection,
} from '../types';
import { createRepository } from '../data/repository';
import { buildDemoSeed } from '../data/seed';

/**
 * Central application store. Loads all persisted entities from the Repository on boot and
 * writes every mutation straight back through it, so nothing is lost on refresh (R1).
 *
 * Components consume this via `useStore()` and never touch the repository or storage directly
 * (see .kiro/steering/architecture.md).
 */

export interface StoreState {
  loading: boolean;
  error: string | null;
  institutions: Institution[];
  courses: Course[];
  assignments: Assignment[];
  discussions: Discussion[];
  discussionResponses: DiscussionResponse[];
  readings: Reading[];
  assessments: Assessment[];
  citations: Citation[];
  notes: Note[];
}

export interface StoreActions {
  save: <T extends Persistable>(collection: Collection, entity: T) => Promise<void>;
  remove: (collection: Collection, id: string) => Promise<void>;
  clearDemo: () => Promise<void>;
  reseedDemo: () => Promise<void>;
  exportJson: () => Promise<string>;
}

type StoreContextValue = StoreState & StoreActions;

const StoreContext = createContext<StoreContextValue | null>(null);
const INITIALIZED_MARKER_ID = '__store_initialized__';

function nowIso() {
  return new Date().toISOString();
}

// Maps store slice keys <-> repository collections.
const SLICE_TO_COLLECTION: Record<string, Collection> = {
  institutions: 'institutions',
  courses: 'courses',
  assignments: 'assignments',
  discussions: 'discussions',
  discussionResponses: 'discussionResponses',
  readings: 'readings',
  assessments: 'assessments',
  citations: 'citations',
  notes: 'notes',
};

export const StoreProvider: React.FC<{ repository?: Repository; children: React.ReactNode }> = ({
  repository,
  children,
}) => {
  const repo = useMemo(() => repository ?? createRepository(), [repository]);

  const [state, setState] = useState<StoreState>({
    loading: true,
    error: null,
    institutions: [],
    courses: [],
    assignments: [],
    discussions: [],
    discussionResponses: [],
    readings: [],
    assessments: [],
    citations: [],
    notes: [],
  });

  const loadAll = useCallback(async () => {
    const [
      institutions,
      courses,
      assignments,
      discussions,
      discussionResponses,
      readings,
      assessments,
      citations,
      notes,
    ] = await Promise.all([
      repo.getAll<Institution & EntityBase>('institutions'),
      repo.getAll<Course & EntityBase>('courses'),
      repo.getAll<Assignment & EntityBase>('assignments'),
      repo.getAll<Discussion>('discussions'),
      repo.getAll<DiscussionResponse>('discussionResponses'),
      repo.getAll<Reading>('readings'),
      repo.getAll<Assessment>('assessments'),
      repo.getAll<Citation & EntityBase>('citations'),
      repo.getAll<Note>('notes'),
    ]);
    setState((s) => ({
      ...s,
      loading: false,
      error: null,
      institutions,
      courses,
      assignments,
      discussions,
      discussionResponses,
      readings,
      assessments,
      citations,
      notes,
    }));
  }, [repo]);

  // Boot: load, and seed clearly-labeled demo data on a first, empty run.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const marker = await repo.get('settings', INITIALIZED_MARKER_ID);
        if (!marker) {
          const seed = buildDemoSeed();
          for (const [collection, entities] of Object.entries(seed)) {
            await repo.bulkPut(collection as Collection, entities as EntityBase[]);
          }
          await repo.put('settings', {
            id: INITIALIZED_MARKER_ID,
            key: 'store_initialized',
            value: 'true',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            isDemo: false,
          } as Persistable);
        }
        if (!cancelled) await loadAll();
      } catch (e: any) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e?.message || 'Failed to load your F.I.S.H. Scholar data.',
          }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo, loadAll]);

  const save = useCallback<StoreActions['save']>(
    async (collection, entity) => {
      try {
        // Repository stamps createdAt/updatedAt on write.
        const saved = await repo.put(collection, entity);
        setState((s) => {
          const slice = collectionToSlice(collection);
          if (!slice) return s;
          const list = (s[slice] as EntityBase[]) ?? [];
          const idx = list.findIndex((e) => e.id === saved.id);
          const next = idx >= 0
            ? list.map((e) => (e.id === saved.id ? saved : e))
            : [saved, ...list];
          return { ...s, [slice]: next } as StoreState;
        });
      } catch (e: any) {
        setState((s) => ({ ...s, error: e?.message || 'Could not save. Your existing data is safe.' }));
      }
    },
    [repo],
  );

  const remove = useCallback<StoreActions['remove']>(
    async (collection, id) => {
      try {
        await repo.remove(collection, id);
        setState((s) => {
          const slice = collectionToSlice(collection);
          if (!slice) return s;
          const list = (s[slice] as EntityBase[]) ?? [];
          return { ...s, [slice]: list.filter((e) => e.id !== id) } as StoreState;
        });
      } catch (e: any) {
        setState((s) => ({ ...s, error: e?.message || 'Could not delete. Your data is safe.' }));
      }
    },
    [repo],
  );

  const clearDemo = useCallback(async () => {
    try {
      await repo.clearDemo();
      await loadAll();
    } catch (e: any) {
      setState((s) => ({
        ...s,
        error: e?.message || 'Could not remove demo data. Your existing data is safe.',
      }));
    }
  }, [repo, loadAll]);

  const reseedDemo = useCallback(async () => {
    const seed = buildDemoSeed();
    for (const [collection, entities] of Object.entries(seed)) {
      await repo.bulkPut(collection as Collection, entities as EntityBase[]);
    }
    await loadAll();
  }, [repo, loadAll]);

  const exportJson = useCallback(async () => {
    const snapshot = await repo.exportAll();
    return JSON.stringify(snapshot, null, 2);
  }, [repo]);

  const value: StoreContextValue = {
    ...state,
    save,
    remove,
    clearDemo,
    reseedDemo,
    exportJson,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

function collectionToSlice(collection: Collection): keyof StoreState | null {
  const entry = Object.entries(SLICE_TO_COLLECTION).find(([, c]) => c === collection);
  return (entry?.[0] as keyof StoreState) ?? null;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a <StoreProvider>');
  return ctx;
}
