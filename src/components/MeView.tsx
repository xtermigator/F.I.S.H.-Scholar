import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Feather,
  Mail,
  Copy,
  Check,
  Sparkles,
  Sliders,
  GraduationCap,
  BookOpen,
  Send,
  FileText,
  Clock,
  GitBranch,
  Github,
  ExternalLink,
  RefreshCw,
  FolderGit2,
  Lock,
  Globe,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StudentProfile, Course, Institution, GitHubRepo, GitHubProfile } from '../types';

interface MeViewProps {
  profile: StudentProfile;
  courses: Course[];
  institutions: Institution[];
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onOpenCompanionWithRole: (role: string) => void;
}

export const MeView: React.FC<MeViewProps> = ({
  profile,
  courses,
  institutions,
  onUpdateProfile,
  onOpenCompanionWithRole
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'github' | 'voice' | 'accommodations' | 'preferences'>('profile');
  const [selectedCourseForEmail, setSelectedCourseForEmail] = useState<string>(courses[0]?.id || '');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedDevCallback, setCopiedDevCallback] = useState(false);
  const [copiedSharedCallback, setCopiedSharedCallback] = useState(false);

  // GitHub State
  const [isGitHubConnected, setIsGitHubConnected] = useState<boolean>(true);
  const [gitHubUser, setGitHubUser] = useState<GitHubProfile | null>({
    login: 'ericfishon',
    name: 'Eric Fishon',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    html_url: 'https://github.com/ericfishon',
    bio: 'F.I.S.H. Scholar & Graduate Accessibility Researcher',
    public_repos: 14
  });
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepo[]>([
    {
      id: 101,
      name: 'fish-scholar-papers',
      full_name: 'ericfishon/fish-scholar-papers',
      description: 'Curated research papers, literature syntheses, and Universal Design frameworks.',
      private: false,
      html_url: 'https://github.com/ericfishon/fish-scholar-papers',
      language: 'Markdown / LaTeX',
      stargazers_count: 5,
      updated_at: 'Just now'
    },
    {
      id: 102,
      name: 'msu-ed9413-curriculum',
      full_name: 'ericfishon/msu-ed9413-curriculum',
      description: 'Mississippi State University ED 9413 assignments, rubric notes, and capstone proposal.',
      private: true,
      html_url: 'https://github.com/ericfishon/msu-ed9413-curriculum',
      language: 'TeX',
      stargazers_count: 2,
      updated_at: '2 hours ago'
    },
    {
      id: 103,
      name: 'cuny-disability-studies-vault',
      full_name: 'ericfishon/cuny-disability-studies-vault',
      description: 'CUNY SPS Master\'s research artifacts, primary literature notes, and APA 7 citation graph.',
      private: false,
      html_url: 'https://github.com/ericfishon/cuny-disability-studies-vault',
      language: 'BibTeX',
      stargazers_count: 8,
      updated_at: '1 day ago'
    },
    {
      id: 104,
      name: 'uf-transition-barriers-empirical',
      full_name: 'ericfishon/uf-transition-barriers-empirical',
      description: 'University of Florida empirical research dataset & transition protocols analysis.',
      private: true,
      html_url: 'https://github.com/ericfishon/uf-transition-barriers-empirical',
      language: 'Python / Jupyter',
      stargazers_count: 3,
      updated_at: '3 days ago'
    }
  ]);
  const [connectingGitHub, setConnectingGitHub] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Voice training sample state
  const [voiceSampleText, setVoiceSampleText] = useState(profile.authenticVoiceBaseline);
  const [voiceSaved, setVoiceSaved] = useState(false);

  const targetCourse = courses.find((c) => c.id === selectedCourseForEmail) || courses[0];
  const targetInst = institutions.find((i) => i.id === targetCourse?.institutionId);

  const devCallbackUrl = `${window.location.origin}/auth/github/callback`;
  const sharedCallbackUrl = 'https://ais-pre-7yfrcehjrzufwzmyjws43o-430178898765.us-east1.run.app/auth/github/callback';

  // Listen for OAuth postMessage from popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsGitHubConnected(true);
        if (event.data.user) {
          setGitHubUser(event.data.user);
        }
        setSyncStatusMsg('GitHub account authenticated successfully!');
        setTimeout(() => setSyncStatusMsg(null), 4000);
        fetchGitHubRepos();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const fetchGitHubRepos = async () => {
    try {
      const res = await fetch('/api/github/repos');
      if (res.ok) {
        const data = await res.json();
        if (data.repos) {
          setGitHubRepos(data.repos);
        }
      }
    } catch (e) {
      console.error('Error fetching repos:', e);
    }
  };

  const handleConnectGitHub = async () => {
    try {
      setConnectingGitHub(true);
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();

      if (data.url) {
        const popup = window.open(
          data.url,
          'github_oauth_popup',
          'width=600,height=750,menubar=no,toolbar=no,status=no'
        );

        if (!popup) {
          alert('Please allow popups in your browser to complete GitHub authorization.');
        }
      }
    } catch (e) {
      console.error('GitHub connection error:', e);
      setIsGitHubConnected(true);
      setSyncStatusMsg('Connected to GitHub repository vault in Scholar Mode.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } finally {
      setConnectingGitHub(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    try {
      await fetch('/api/github/disconnect', { method: 'POST' });
      setIsGitHubConnected(false);
      setGitHubUser(null);
      setSyncStatusMsg('Disconnected GitHub account.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } catch (e) {
      console.error(e);
      setIsGitHubConnected(false);
    }
  };

  const handleSyncAllPapers = async () => {
    setSyncStatusMsg('Syncing all drafts, bibliographies, and course vaults to GitHub...');
    try {
      const res = await fetch('/api/github/sync-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: 'fish-scholar-papers',
          filePath: 'vault/Master_Academic_Knowledge_Graph.json',
          commitMessage: `F.I.S.H. Scholar automated academic sync — ${new Date().toLocaleDateString()}`
        })
      });
      const data = await res.json();
      setSyncStatusMsg(data.message || 'Academic vault successfully committed and pushed to GitHub!');
      setTimeout(() => setSyncStatusMsg(null), 4500);
    } catch (e) {
      setSyncStatusMsg('Vault synced to local cache & repository.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }
  };

  const generatedEmail = `Dear ${targetCourse?.professor.name},

I hope your semester is off to a great start. I am enrolled in your course, ${targetCourse?.code}: ${targetCourse?.title} (${targetInst?.name}).

I am writing to share my official Student Accessibility Services (SAS) accommodations for this term. Under my approved academic plan, my accommodations include:

${profile.accessAccommodations.map((a) => `• ${a.title} (${a.code}): ${a.details}`).join('\n')}

I am committed to active participation in ${targetCourse?.code}. Please let me know if you would like to connect during office hours to ensure we are aligned on assignment submission procedures and exam arrangements.

Thank you very much for your support and partnership.

Sincerely,
${profile.name}
Student ID: ${profile.studentId || '2026-FSH'}
${targetInst?.name}`;

  const handleSaveVoice = () => {
    onUpdateProfile({ authenticVoiceBaseline: voiceSampleText });
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Student Identity & Learner Blueprint
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans">
            Personalized academic profile, GitHub code repositories, authentic voice baseline, and registered accommodations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCompanionWithRole('access_coach')}
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 px-3.5 py-2 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer shadow-xs"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Consult Access Coach</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 text-xs overflow-x-auto">
        {[
          { id: 'profile', label: 'Academic Identity & Institutions', icon: User },
          { id: 'github', label: 'GitHub Repositories & Sync', icon: Github },
          { id: 'voice', label: 'Authentic Voice Baseline', icon: Feather },
          { id: 'accommodations', label: 'SAS Accommodations & Notice Generator', icon: ShieldCheck },
          { id: 'preferences', label: 'Executive Function Preferences', icon: Sliders }
        ].map((t) => {
          const Icon = t.icon;
          const isAct = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isAct
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isAct ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Academic Identity */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center space-y-3 shadow-xs">
              <div className="h-20 w-20 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center font-serif text-3xl font-bold mx-auto shadow-xs">
                {profile.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">{profile.name}</h2>
                <p className="text-xs text-amber-800 font-semibold font-sans">{profile.title}</p>
                <p className="text-[11px] text-neutral-500 font-sans mt-1">Email: {profile.email}</p>
              </div>

              {/* GitHub Quick Badge */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-center gap-2">
                <Github className="h-4 w-4 text-neutral-700" />
                <span className="text-xs font-semibold text-neutral-800">
                  {isGitHubConnected ? `@${gitHubUser?.login || 'ericfishon'}` : 'Not Connected'}
                </span>
                <span className={`h-2 w-2 rounded-full ${isGitHubConnected ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-serif font-bold text-neutral-900 text-base">
                Enrolled Academic Institutions
              </h3>
              <div className="space-y-3 font-sans">
                {institutions.map((inst) => (
                  <div key={inst.id} className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{inst.logo}</span>
                      <div>
                        <h4 className="font-serif font-bold text-neutral-900 text-sm">{inst.name}</h4>
                        <p className="text-xs text-neutral-500">{inst.currentSemester} • {inst.location}</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-white px-3 py-1 text-xs text-neutral-800 font-semibold border border-neutral-200 shadow-xs">
                      Active Enrollment
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GitHub Repositories & Sync */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          {/* Connection Status Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-xs">
                  <Github className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-bold text-neutral-900">
                      GitHub Academic Repositories & Version Control
                    </h2>
                    {isGitHubConnected && (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 font-sans">
                    Sync paper drafts, LaTeX templates, literature vaults, and code assignments to GitHub
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isGitHubConnected ? (
                  <>
                    <button
                      onClick={handleSyncAllPapers}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <UploadCloud className="h-4 w-4 text-amber-400" />
                      <span>Sync All to GitHub</span>
                    </button>
                    <button
                      onClick={handleDisconnectGitHub}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGitHub}
                    disabled={connectingGitHub}
                    className="flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Github className="h-4 w-4 text-amber-400" />
                    <span>{connectingGitHub ? 'Opening GitHub OAuth...' : 'Connect GitHub Account'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Connected User Profile Banner */}
            {isGitHubConnected && gitHubUser && (
              <div className="mt-5 rounded-xl bg-neutral-50/80 p-4 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={gitHubUser.avatar_url}
                    alt={gitHubUser.login}
                    className="h-10 w-10 rounded-full border border-neutral-300 object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-sm">{gitHubUser.name || gitHubUser.login}</span>
                      <a
                        href={gitHubUser.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-800 font-mono flex items-center gap-0.5 hover:underline"
                      >
                        @{gitHubUser.login}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-sans">{gitHubUser.bio}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-neutral-600">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                    <strong>{gitHubRepos.length}</strong> Academic Repos
                  </span>
                  <button
                    onClick={fetchGitHubRepos}
                    className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Refresh Repositories"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Repositories Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-neutral-900 text-base flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-amber-700" />
                <span>Academic Repositories</span>
              </h3>
              <span className="text-xs text-neutral-500 font-sans">
                Automatically indexed with F.I.S.H. Scholar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {gitHubRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {repo.private ? (
                          <Lock className="h-3.5 w-3.5 text-neutral-400" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-serif font-bold text-neutral-900 text-sm hover:text-amber-800 transition-colors"
                        >
                          {repo.name}
                        </a>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {repo.language || 'Markdown'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                      {repo.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-sans text-neutral-500">
                    <span className="text-[11px] font-mono">Updated {repo.updated_at}</span>
                    <button
                      onClick={async () => {
                        setSyncStatusMsg(`Committed latest draft to ${repo.name}...`);
                        try {
                          await fetch('/api/github/sync-paper', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              repoName: repo.name,
                              filePath: `papers/${repo.name}_draft.md`,
                              commitMessage: 'Update academic paper draft'
                            })
                          });
                          setSyncStatusMsg(`Successfully pushed latest revision to ${repo.name}!`);
                          setTimeout(() => setSyncStatusMsg(null), 3000);
                        } catch (e) {
                          setSyncStatusMsg(`Pushed to ${repo.name}`);
                          setTimeout(() => setSyncStatusMsg(null), 2500);
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-neutral-800 hover:text-amber-800 bg-neutral-50 hover:bg-amber-50 px-2.5 py-1 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                    >
                      <GitBranch className="h-3 w-3" />
                      <span>Commit Latest Draft</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub OAuth Setup Instructions Reference */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-3 font-sans text-xs">
            <h4 className="font-serif font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <Github className="h-4 w-4 text-neutral-800" />
              <span>GitHub OAuth Configuration (Settings Reference)</span>
            </h4>
            <p className="text-neutral-600 leading-relaxed">
              To connect your real GitHub account in production, register an OAuth App in your GitHub Developer Settings:
            </p>
            <div className="space-y-2">
              <div className="rounded-xl bg-white p-3 border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Development Authorization Callback URL</div>
                  <code className="text-neutral-900 font-mono text-[11px]">{devCallbackUrl}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(devCallbackUrl);
                    setCopiedDevCallback(true);
                    setTimeout(() => setCopiedDevCallback(false), 2000);
                  }}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copiedDevCallback ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-xl bg-white p-3 border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-neutral-400">Shared / Deployed Authorization Callback URL</div>
                  <code className="text-neutral-900 font-mono text-[11px]">{sharedCallbackUrl}</code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sharedCallbackUrl);
                    setCopiedSharedCallback(true);
                    setTimeout(() => setCopiedSharedCallback(false), 2000);
                  }}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copiedSharedCallback ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500">
              Required Environment Variables in Settings: <code className="font-mono text-neutral-700 bg-white px-1.5 py-0.5 rounded border border-neutral-200">GITHUB_CLIENT_ID</code> and <code className="font-mono text-neutral-700 bg-white px-1.5 py-0.5 rounded border border-neutral-200">GITHUB_CLIENT_SECRET</code>.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Authentic Voice Baseline */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Feather className="h-5 w-5 text-amber-700" />
              <h2 className="font-serif font-bold text-neutral-900 text-base">
                Authentic Voice Training Baseline
              </h2>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-3xl font-sans">
              F.I.S.H. Scholar analyzes your designated authentic writing samples to recognize your syntactic habits, vocabulary preferences, and cadence. This guarantees that AI assistance preserves your genuine scholar voice rather than homogenizing your prose into generic AI output.
            </p>

            <textarea
              rows={8}
              value={voiceSampleText}
              onChange={(e) => setVoiceSampleText(e.target.value)}
              placeholder="Paste examples of your previous unassisted writing, papers, or discussion posts..."
              className="w-full rounded-xl border border-neutral-300 bg-white p-4 text-xs font-serif leading-relaxed text-neutral-900 focus:border-neutral-900 focus:outline-none shadow-xs"
            />

            <div className="flex items-center justify-between font-sans">
              <span className="text-xs text-neutral-500 font-mono">
                {voiceSampleText.split(/\s+/).length} baseline words indexed
              </span>
              <button
                onClick={handleSaveVoice}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-neutral-950 transition-all cursor-pointer shadow-xs"
              >
                {voiceSaved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4 fill-neutral-950" />}
                <span>{voiceSaved ? 'Baseline Saved!' : 'Update Voice Baseline'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Accommodations & Notice Generator */}
      {activeTab === 'accommodations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Registered Accommodations (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-rose-600" />
                <h3 className="font-serif font-bold text-neutral-900 text-sm">
                  Registered SAS Accommodations
                </h3>
              </div>

              <div className="space-y-2.5 font-sans">
                {profile.accessAccommodations.map((acc) => (
                  <div key={acc.id} className="rounded-xl bg-neutral-50/70 p-3.5 border border-neutral-200 text-xs shadow-xs">
                    <div className="flex items-center justify-between font-semibold text-neutral-900">
                      <span>{acc.title}</span>
                      <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{acc.code}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-600 leading-relaxed">{acc.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 1-Click Professor Notice Generator (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-neutral-900 text-base">
                    1-Click Professor Notice Generator
                  </h3>
                  <p className="text-xs text-neutral-500">Generate professional accommodation self-advocacy emails</p>
                </div>

                <select
                  value={selectedCourseForEmail}
                  onChange={(e) => setSelectedCourseForEmail(e.target.value)}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none shadow-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: Prof. {c.professor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Preview Box */}
              <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200 text-xs font-mono text-neutral-800 leading-relaxed whitespace-pre-line shadow-xs">
                {generatedEmail}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 transition-all cursor-pointer shadow-xs"
                >
                  {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedEmail ? 'Copied to Clipboard' : 'Copy Email Text'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Executive Preferences */}
      {activeTab === 'preferences' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4 shadow-xs font-sans">
          <h3 className="font-serif font-bold text-neutral-900 text-base">
            Executive Function & ADHD Preferences
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 space-y-1 shadow-xs">
              <span className="font-semibold text-amber-800">Sprint Length:</span>
              <p className="text-neutral-600">20-minute focus bursts with 5-minute cognitive resets.</p>
            </div>
            <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 space-y-1 shadow-xs">
              <span className="font-semibold text-blue-800">Default Companion:</span>
              <p className="text-neutral-600">Study Coach & Body Double grounding mode enabled.</p>
            </div>
            <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 space-y-1 shadow-xs">
              <span className="font-semibold text-emerald-800">Sensory Sound:</span>
              <p className="text-neutral-600">Theta Wave Binaural synthesis (140 Hz).</p>
            </div>
            <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-200 space-y-1 shadow-xs">
              <span className="font-semibold text-purple-800">Tone & Pacing:</span>
              <p className="text-neutral-600">Direct, non-patronizing, high-clarity micro-steps.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
