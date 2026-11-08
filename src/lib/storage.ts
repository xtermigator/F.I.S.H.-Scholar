import {
  Institution,
  Course,
  Assignment,
  Citation,
  AcademicMemoryNode,
  StudentProfile
} from '../types';

const STORAGE_KEYS = {
  INSTITUTIONS: 'fish_scholar_institutions_v1',
  COURSES: 'fish_scholar_courses_v1',
  ASSIGNMENTS: 'fish_scholar_assignments_v1',
  CITATIONS: 'fish_scholar_citations_v1',
  ACADEMIC_MEMORY: 'fish_scholar_academic_memory_v1',
  PROFILE: 'fish_scholar_profile_v1',
  LAST_SAVED: 'fish_scholar_last_saved_v1'
};

export interface ScholarWorkspaceState {
  institutions: Institution[];
  courses: Course[];
  assignments: Assignment[];
  citations: Citation[];
  academicMemory: AcademicMemoryNode[];
  profile: StudentProfile;
}

// Safe read helper
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

// Safe write helper
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  loadInstitutions: (fallback: Institution[]): Institution[] =>
    loadFromStorage(STORAGE_KEYS.INSTITUTIONS, fallback),

  saveInstitutions: (data: Institution[]): void =>
    saveToStorage(STORAGE_KEYS.INSTITUTIONS, data),

  loadCourses: (fallback: Course[]): Course[] =>
    loadFromStorage(STORAGE_KEYS.COURSES, fallback),

  saveCourses: (data: Course[]): void =>
    saveToStorage(STORAGE_KEYS.COURSES, data),

  loadAssignments: (fallback: Assignment[]): Assignment[] =>
    loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, fallback),

  saveAssignments: (data: Assignment[]): void =>
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, data),

  loadCitations: (fallback: Citation[]): Citation[] =>
    loadFromStorage(STORAGE_KEYS.CITATIONS, fallback),

  saveCitations: (data: Citation[]): void =>
    saveToStorage(STORAGE_KEYS.CITATIONS, data),

  loadAcademicMemory: (fallback: AcademicMemoryNode[]): AcademicMemoryNode[] =>
    loadFromStorage(STORAGE_KEYS.ACADEMIC_MEMORY, fallback),

  saveAcademicMemory: (data: AcademicMemoryNode[]): void =>
    saveToStorage(STORAGE_KEYS.ACADEMIC_MEMORY, data),

  loadProfile: (fallback: StudentProfile): StudentProfile =>
    loadFromStorage(STORAGE_KEYS.PROFILE, fallback),

  saveProfile: (data: StudentProfile): void =>
    saveToStorage(STORAGE_KEYS.PROFILE, data),

  saveAll: (state: ScholarWorkspaceState): void => {
    saveToStorage(STORAGE_KEYS.INSTITUTIONS, state.institutions);
    saveToStorage(STORAGE_KEYS.COURSES, state.courses);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, state.assignments);
    saveToStorage(STORAGE_KEYS.CITATIONS, state.citations);
    saveToStorage(STORAGE_KEYS.ACADEMIC_MEMORY, state.academicMemory);
    saveToStorage(STORAGE_KEYS.PROFILE, state.profile);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
  },

  getLastSavedTimestamp: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
  },

  exportScholarArchive: (state: ScholarWorkspaceState): void => {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      studentName: state.profile.name,
      payload: state
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fish-scholar-archive-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportArchive: (state?: ScholarWorkspaceState): void => {
    const currentState: ScholarWorkspaceState = state || {
      institutions: loadFromStorage(STORAGE_KEYS.INSTITUTIONS, []),
      courses: loadFromStorage(STORAGE_KEYS.COURSES, []),
      assignments: loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, []),
      citations: loadFromStorage(STORAGE_KEYS.CITATIONS, []),
      academicMemory: loadFromStorage(STORAGE_KEYS.ACADEMIC_MEMORY, []),
      profile: loadFromStorage(STORAGE_KEYS.PROFILE, {} as any)
    };
    StorageService.exportScholarArchive(currentState);
  },

  importArchive: (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      const data: ScholarWorkspaceState = parsed.payload || parsed;
      if (data.courses || data.assignments || data.citations) {
        if (data.institutions) saveToStorage(STORAGE_KEYS.INSTITUTIONS, data.institutions);
        if (data.courses) saveToStorage(STORAGE_KEYS.COURSES, data.courses);
        if (data.assignments) saveToStorage(STORAGE_KEYS.ASSIGNMENTS, data.assignments);
        if (data.citations) saveToStorage(STORAGE_KEYS.CITATIONS, data.citations);
        if (data.academicMemory) saveToStorage(STORAGE_KEYS.ACADEMIC_MEMORY, data.academicMemory);
        if (data.profile) saveToStorage(STORAGE_KEYS.PROFILE, data.profile);
        localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  parseImportedArchive: async (file: File): Promise<ScholarWorkspaceState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.payload && parsed.payload.courses && parsed.payload.assignments) {
            resolve(parsed.payload as ScholarWorkspaceState);
          } else if (parsed.courses && parsed.assignments) {
            resolve(parsed as ScholarWorkspaceState);
          } else {
            reject(new Error('Invalid F.I.S.H. Scholar Archive format.'));
          }
        } catch (err: any) {
          reject(new Error(`Failed to parse file: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  },

  resetAllToDefault: (): void => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
};
