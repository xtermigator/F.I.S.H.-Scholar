import React, { useState, useEffect } from 'react';
import { X, Database, ShieldCheck, Check, Key, Cloud, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured, SupabaseService, ResearcherAuthUser } from '../../lib/supabase';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTrigger: () => Promise<void>;
  isSyncing: boolean;
}

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({
  isOpen,
  onClose,
  onSyncTrigger,
  isSyncing
}) => {
  const [currentUser, setCurrentUser] = useState<ResearcherAuthUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      SupabaseService.getCurrentUser().then(u => setCurrentUser(u));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      // Local researcher mode
      const localProfile: ResearcherAuthUser = {
        id: `researcher-${Date.now()}`,
        email: email || 'scholar@university.edu',
        fullName: 'Doctoral Candidate',
        institution: 'Graduate Research Faculty',
        isGuest: false
      };
      localStorage.setItem('dissertation_matrix_user', JSON.stringify(localProfile));
      setCurrentUser(localProfile);
      setStatusMessage('Authenticated in local researcher session.');
      return;
    }

    setIsAuthLoading(true);
    setStatusMessage(null);

    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            email: data.user.email || '',
            fullName: data.user.user_metadata?.full_name || 'Doctoral Researcher',
            institution: data.user.user_metadata?.institution || 'Academic Institution',
            isGuest: false
          });
          setStatusMessage('Signed in to Supabase successfully.');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: 'Doctoral Candidate', institution: 'Research University' }
          }
        });
        if (error) throw error;
        setStatusMessage('Registration initiated. Please check your email for confirmation.');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Authentication error.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('dissertation_matrix_user');
    setCurrentUser(null);
    setStatusMessage('Logged out.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col bg-[#FDFDFD] border border-stone-300 shadow-2xl rounded-xs"
        role="dialog"
        aria-labelledby="supabase-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-200 px-6 py-5 bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <span>Cloud Persistence Engine</span>
              <span>·</span>
              <span>PostgreSQL & Auth</span>
            </div>
            <h2 id="supabase-title" className="mt-1 font-serif text-xl font-bold text-stone-900">
              Supabase Database & Authentication
            </h2>
            <p className="mt-1 text-xs text-stone-600">
              Synchronize dissertation projects, literature themes, and matrix cells to your Supabase PostgreSQL cluster.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:text-stone-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div className="border border-stone-200 p-3.5 bg-stone-50 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono uppercase font-semibold text-stone-700 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-stone-600" />
                Backend Infrastructure:
              </span>
              <span className={`font-mono font-bold text-[11px] ${
                isSupabaseConfigured ? 'text-emerald-700' : 'text-stone-700'
              }`}>
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local Researcher Vault'}
              </span>
            </div>
            <p className="text-stone-600 leading-normal">
              {isSupabaseConfigured
                ? 'Connected to remote Supabase instance. Automated sync is enabled for your research tables.'
                : 'Operating in local offline storage mode. All matrix data, themes, and citations are securely stored in your browser session with instant auto-save.'}
            </p>
          </div>

          {/* Sync Trigger */}
          <div className="flex items-center justify-between border border-stone-200 p-3 bg-white">
            <div>
              <span className="block text-xs font-semibold text-stone-900">
                Manual Cloud Sync
              </span>
              <span className="text-[11px] text-stone-500">
                Push all matrix rows, cells, and themes
              </span>
            </div>
            <button
              onClick={onSyncTrigger}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* User Profile / Auth State */}
          {currentUser && !currentUser.isGuest ? (
            <div className="border border-stone-200 p-4 bg-white space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Authenticated Researcher Profile</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-stone-900 font-semibold">{currentUser.fullName}</p>
                <p className="text-stone-600 font-mono">{currentUser.email}</p>
                <p className="text-stone-500">{currentUser.institution}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-rose-700 hover:text-rose-900 underline"
              >
                Sign out of researcher session
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="border border-stone-200 p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase text-stone-700">
                  {authMode === 'signin' ? 'Researcher Sign In' : 'Register New Account'}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-[11px] text-stone-600 hover:text-stone-900 underline"
                >
                  {authMode === 'signin' ? 'Need an account?' : 'Already registered?'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-600 mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@university.edu"
                  className="w-full border border-stone-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border border-stone-300 p-2 text-xs focus:outline-none font-mono"
                />
              </div>

              {statusMessage && (
                <p className="text-xs text-stone-700 bg-stone-50 p-2 border border-stone-200">
                  {statusMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-stone-900 text-white py-2 text-xs font-medium hover:bg-stone-800 transition-colors"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Researcher Profile'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-stone-200 px-6 py-4 bg-stone-50">
          <button
            onClick={onClose}
            className="bg-stone-900 text-white px-5 py-2 text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
