import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  Download,
  UploadCloud,
  Terminal,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FolderArchive,
  RefreshCw
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/ericfishon/dissertation-matrix.git');
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    output?: string;
  } | null>(null);

  const [gitStatus, setGitStatus] = useState<string>('Loading git status...');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGitStatus();
    }
  }, [isOpen]);

  const fetchGitStatus = async () => {
    try {
      const res = await fetch('/api/git/status');
      const data = await res.json();
      if (data.success && data.details) {
        setGitStatus(data.details);
      } else {
        setGitStatus('Git initialized on main branch (ready for push)');
      }
    } catch {
      setGitStatus('Git initialized on main branch.');
    }
  };

  if (!isOpen) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          personalAccessToken: personalAccessToken.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushResult({
          success: true,
          message: data.message || 'Pushed successfully to GitHub!',
          output: data.output
        });
        fetchGitStatus();
      } else {
        setPushResult({
          success: false,
          error: data.error || 'Failed to push to GitHub remote.',
          output: data.stdout
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err.message || 'Network error attempting to push.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const cliCommands = `# 1. Create a new empty repository at https://github.com/new
# 2. In your local terminal:
git remote add origin ${repoUrl || 'https://github.com/USERNAME/dissertation-matrix.git'}
git branch -M main
git push -u origin main`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="github-export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white border border-stone-300 shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-900 text-white rounded-xs">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h2 id="github-export-modal-title" className="font-serif text-lg font-bold text-stone-900">
                Save & Export to GitHub
              </h2>
              <p className="text-xs text-stone-500 font-mono">
                Preserve codebase, clone a new copy, or push to your personal repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-stone-400 hover:text-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-stone-800 text-xs">
          {/* Quick Status Pill */}
          <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-semibold text-stone-900 font-mono">Repository Status:</span>{' '}
                <span className="text-stone-600 font-mono text-[11px]">{gitStatus}</span>
              </div>
            </div>
            <button
              onClick={fetchGitStatus}
              title="Refresh status"
              className="p-1 text-stone-400 hover:text-stone-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Option 1: Direct Push to GitHub */}
          <div className="border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-stone-700" />
                Option 1: Direct Push to Your GitHub Account
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200">
                Automated
              </span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              If you have already created an empty repository on GitHub, enter the repository URL and your GitHub Personal Access Token (PAT) below to push immediately.
            </p>

            <form onSubmit={handlePush} className="space-y-3 pt-1">
              <div>
                <label className="block font-mono text-[11px] text-stone-700 mb-1 font-medium">
                  GitHub Repository URL:
                </label>
                <input
                  type="url"
                  required
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/ericfishon/dissertation-matrix.git"
                  className="w-full border border-stone-300 px-3 py-1.5 text-xs font-mono bg-stone-50/50 focus:bg-white focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-stone-700 font-medium">
                    Personal Access Token (PAT):
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Dissertation+Matrix+Sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-stone-600 hover:text-stone-900 underline flex items-center gap-1"
                  >
                    Generate classic token with 'repo' scope <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={personalAccessToken}
                  onChange={(e) => setPersonalAccessToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (required for push access)"
                  className="w-full border border-stone-300 px-3 py-1.5 text-xs font-mono bg-stone-50/50 focus:bg-white focus:border-stone-800 focus:outline-none"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  GitHub requires a personal access token instead of a password for HTTPS command-line authentication.
                </p>
              </div>

              {pushResult && (
                <div
                  className={`p-3 border text-xs ${
                    pushResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {pushResult.success ? (
                      <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{pushResult.message || pushResult.error}</p>
                      {pushResult.output && (
                        <pre className="font-mono text-[10px] p-2 bg-black/5 overflow-x-auto whitespace-pre-wrap max-h-24">
                          {pushResult.output}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isPushing}
                  className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Pushing to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Push Code to GitHub</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Option 2: Download Complete Repository Archive (.zip) */}
          <div className="border border-stone-200 bg-[#FAF9F6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2">
                <FolderArchive className="h-4 w-4 text-stone-700" />
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Option 2: Instant Code Archive (.zip)
                </h3>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Download the complete, self-contained project package with full git commit history, ready to unzip, clone, or duplicate anywhere.
              </p>
            </div>
            <a
              href="/api/git/download"
              download="dissertation-matrix-repo.zip"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-300 hover:border-stone-800 text-stone-800 hover:text-stone-900 font-medium text-xs transition-colors shadow-2xs shrink-0"
            >
              <Download className="h-4 w-4 text-stone-600" />
              <span>Download Repository (.zip)</span>
            </a>
          </div>

          {/* Option 3: Terminal Command Reference */}
          <div className="border border-stone-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-stone-700" />
                Option 3: Manual Terminal Push Commands
              </h3>
              <button
                type="button"
                onClick={() => copyToClipboard(cliCommands, 'cli')}
                className="flex items-center gap-1 text-[11px] font-mono text-stone-600 hover:text-stone-900"
              >
                {copiedSnippet === 'cli' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-stone-600">
              Run these commands in your cloned workspace or local terminal to link this repository:
            </p>
            <div className="relative bg-stone-900 text-stone-100 p-3 font-mono text-[11px] rounded-xs overflow-x-auto">
              <pre>{cliCommands}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-[#FAF9F6] flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            Doctoral Literature Review Matrix · GitHub Sync Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-stone-300 bg-white text-stone-800 text-xs hover:bg-stone-50 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
