import type {
  Collection,
  EntityBase,
  Persistable,
  Repository,
  Snapshot,
} from '../types';

/**
 * Persistence layer for F.I.S.H. Scholar.
 *
 * The app talks ONLY to the `Repository` interface (see src/types.ts). This module provides
 * two implementations:
 *   - `IndexedDbRepository`: durable, client-side, survives refresh (default).
 *   - `InMemoryRepository`: a dependency-free fake used by unit tests and as a fallback
 *     when IndexedDB is unavailable (e.g. SSR / private-mode edge cases).
 *
 * Swapping to a server-backed implementation later must not require UI changes
 * (see .kiro/steering/architecture.md).
 */

export const SCHEMA_VERSION = 1;

export const ALL_COLLECTIONS: Collection[] = [
  'institutions',
  'courses',
  'semesters',
  'weekModules',
  'assignments',
  'discussions',
  'discussionResponses',
  'readings',
  'assessments',
  'citations',
  'notes',
  'calendarEvents',
  'notifications',
  'notionSyncRecords',
  'settings',
];

const DB_NAME = 'fish-scholar';

function nowIso(): string {
  return new Date().toISOString();
}

/** Ensure createdAt/updatedAt are set/refreshed on write. */
function stamp<T extends Persistable>(entity: T): T & EntityBase {
  const ts = nowIso();
  const existing = entity as Partial<EntityBase>;
  return {
    ...entity,
    createdAt: existing.createdAt || ts,
    updatedAt: ts,
  } as T & EntityBase;
}

// ---------------------------------------------------------------------------
// In-memory implementation (tests + fallback)
// ---------------------------------------------------------------------------

export class InMemoryRepository implements Repository {
  private store: Map<Collection, Map<string, EntityBase>> = new Map();

  constructor() {
    for (const c of ALL_COLLECTIONS) this.store.set(c, new Map());
  }

  private col(collection: Collection): Map<string, EntityBase> {
    let m = this.store.get(collection);
    if (!m) {
      m = new Map();
      this.store.set(collection, m);
    }
    return m;
  }

  async getAll<T extends EntityBase>(collection: Collection): Promise<T[]> {
    return Array.from(this.col(collection).values()) as T[];
  }

  async get<T extends EntityBase>(
    collection: Collection,
    id: string,
  ): Promise<T | undefined> {
    return this.col(collection).get(id) as T | undefined;
  }

  async put<T extends Persistable>(
    collection: Collection,
    entity: T,
  ): Promise<T & EntityBase> {
    const stamped = stamp(entity);
    this.col(collection).set(stamped.id, stamped);
    return stamped;
  }

  async bulkPut<T extends Persistable>(
    collection: Collection,
    entities: T[],
  ): Promise<void> {
    const m = this.col(collection);
    for (const e of entities) {
      const stamped = stamp(e);
      m.set(stamped.id, stamped);
    }
  }

  async remove(collection: Collection, id: string): Promise<void> {
    this.col(collection).delete(id);
  }

  async clearDemo(): Promise<void> {
    for (const c of ALL_COLLECTIONS) {
      const m = this.col(c);
      for (const [id, e] of m) {
        if ((e as EntityBase).isDemo) m.delete(id);
      }
    }
  }

  async exportAll(): Promise<Snapshot> {
    const collections: Snapshot['collections'] = {};
    for (const c of ALL_COLLECTIONS) {
      collections[c] = Array.from(this.col(c).values());
    }
    return { schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), collections };
  }

  async importAll(snapshot: Snapshot): Promise<void> {
    for (const c of ALL_COLLECTIONS) {
      const items = snapshot.collections[c];
      if (!items) continue;
      const m = this.col(c);
      for (const e of items) m.set(e.id, e);
    }
  }
}

// ---------------------------------------------------------------------------
// IndexedDB implementation (default in the browser)
// ---------------------------------------------------------------------------

function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDbRepository implements Repository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        // Additive migration only: create stores that don't yet exist. Never drop
        // existing stores/data on a version bump (architecture steering).
        for (const c of ALL_COLLECTIONS) {
          if (!db.objectStoreNames.contains(c)) {
            db.createObjectStore(c, { keyPath: 'id' });
          }
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  private async tx(
    collection: Collection | 'meta',
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction(collection, mode).objectStore(collection);
  }

  async getAll<T extends EntityBase>(collection: Collection): Promise<T[]> {
    const store = await this.tx(collection, 'readonly');
    return (await promisify(store.getAll())) as T[];
  }

  async get<T extends EntityBase>(
    collection: Collection,
    id: string,
  ): Promise<T | undefined> {
    const store = await this.tx(collection, 'readonly');
    return (await promisify(store.get(id))) as T | undefined;
  }

  async put<T extends Persistable>(
    collection: Collection,
    entity: T,
  ): Promise<T & EntityBase> {
    const stamped = stamp(entity);
    const store = await this.tx(collection, 'readwrite');
    await promisify(store.put(stamped));
    return stamped;
  }

  async bulkPut<T extends Persistable>(
    collection: Collection,
    entities: T[],
  ): Promise<void> {
    if (entities.length === 0) return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(collection, 'readwrite');
      const store = t.objectStore(collection);
      for (const e of entities) store.put(stamp(e));
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  async remove(collection: Collection, id: string): Promise<void> {
    const store = await this.tx(collection, 'readwrite');
    await promisify(store.delete(id));
  }

  async clearDemo(): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(ALL_COLLECTIONS, 'readwrite');
      for (const c of ALL_COLLECTIONS) {
        const store = t.objectStore(c);
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) return;
          const value = cursor.value as EntityBase;
          if (value.isDemo) cursor.delete();
          cursor.continue();
        };
      }
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  async exportAll(): Promise<Snapshot> {
    const collections: Snapshot['collections'] = {};
    for (const c of ALL_COLLECTIONS) {
      collections[c] = await this.getAll(c);
    }
    return { schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), collections };
  }

  async importAll(snapshot: Snapshot): Promise<void> {
    for (const c of ALL_COLLECTIONS) {
      const items = snapshot.collections[c];
      if (items && items.length) await this.bulkPut(c, items);
    }
  }
}

/**
 * Returns the best available repository for the current environment.
 * Falls back to in-memory when IndexedDB is unavailable so the app never hard-crashes.
 */
export function createRepository(): Repository {
  return isIndexedDbAvailable() ? new IndexedDbRepository() : new InMemoryRepository();
}
