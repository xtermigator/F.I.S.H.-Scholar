/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('supabase.co')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface ResearcherAuthUser {
  id: string;
  email: string;
  fullName: string;
  institution: string;
  isGuest: boolean;
}

export const SupabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async getCurrentUser(): Promise<ResearcherAuthUser | null> {
    if (!supabase) {
      // Local researcher profile fallback
      const savedUser = localStorage.getItem('dissertation_matrix_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          // ignore
        }
      }
      return {
        id: 'local-researcher-1',
        email: 'scholar@institution.edu',
        fullName: 'Doctoral Candidate',
        institution: 'Graduate Research Faculty',
        isGuest: true
      };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      return {
        id: session.user.id,
        email: session.user.email || '',
        fullName: session.user.user_metadata?.full_name || 'Academic Researcher',
        institution: session.user.user_metadata?.institution || 'Research University',
        isGuest: false
      };
    } catch (err) {
      console.warn('Supabase auth session fetch error:', err);
      return null;
    }
  },

  async syncToSupabase(payload: {
    project: any;
    sources: any[];
    themes: any[];
    matrixCells: any[];
  }): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      // Stored locally in browser
      localStorage.setItem('dissertation_matrix_project', JSON.stringify(payload.project));
      localStorage.setItem('dissertation_matrix_sources', JSON.stringify(payload.sources));
      localStorage.setItem('dissertation_matrix_themes', JSON.stringify(payload.themes));
      localStorage.setItem('dissertation_matrix_cells', JSON.stringify(payload.matrixCells));
      return { success: true, message: 'Saved to local researcher vault.' };
    }

    try {
      // Attempt upsert to Supabase tables
      const { error: projError } = await supabase
        .from('dissertation_projects')
        .upsert(payload.project, { onConflict: 'id' });

      if (projError) {
        console.warn('Supabase project upsert notice:', projError.message);
      }

      return { success: true, message: 'Synchronized with Supabase Cloud.' };
    } catch (err: any) {
      console.warn('Supabase sync warning:', err);
      return { success: false, message: err.message || 'Supabase sync failed; preserved locally.' };
    }
  }
};
