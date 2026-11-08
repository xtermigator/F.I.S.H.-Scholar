import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  LogOut,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Hash,
  GraduationCap,
  Quote,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
  X,
  Search,
  MessageCircle,
  Layers
} from 'lucide-react';
import {
  GoogleChatSpace,
  GoogleChatMessage,
  GoogleChatMember,
  fetchChatSpaces,
  createChatSpace,
  fetchChatMessages,
  sendChatMessage,
  deleteChatMessage,
  fetchChatMembers
} from '../lib/googleChatApi';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  GOOGLE_CHAT_SCOPES
} from '../lib/googleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Course, Citation, Assignment, Institution } from '../types';
import { User } from 'firebase/auth';

interface ChatViewProps {
  courses: Course[];
  citations: Citation[];
  assignments: Assignment[];
  institutions: Institution[];
}

export const ChatView: React.FC<ChatViewProps> = ({
  courses,
  citations,
  assignments,
  institutions
}) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spaces & Messages state
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [members, setMembers] = useState<GoogleChatMember[]>([]);
  
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter
  const [spaceSearch, setSpaceSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);

  // Quick Inserters Dropdown
  const [showCitationPicker, setShowCitationPicker] = useState(false);
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);

  // Confirmation Modals (MANDATORY User Confirmation for Destructive/Mutating Operations)
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Create Space Modal
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [selectedCoursePreset, setSelectedCoursePreset] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize auth
  useEffect(() => {
    setIsAuthLoading(true);
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch spaces when access token is ready
  useEffect(() => {
    if (accessToken) {
      loadSpaces();
    }
  }, [accessToken]);

  // Fetch messages and members when space changes
  useEffect(() => {
    if (accessToken && selectedSpace) {
      loadMessages(selectedSpace.name);
      loadMembers(selectedSpace.name);
    }
  }, [selectedSpace, accessToken]);

  // Scroll to bottom of message stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Chat Sign In Error:', err);
      setAuthError(err?.message || 'Authentication failed. Please check popup permissions.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSpaces([]);
    setSelectedSpace(null);
    setMessages([]);
  };

  const loadSpaces = async () => {
    if (!accessToken) return;
    setIsLoadingSpaces(true);
    setErrorMsg(null);
    try {
      const fetchedSpaces = await fetchChatSpaces(accessToken);
      setSpaces(fetchedSpaces);
      if (fetchedSpaces.length > 0 && !selectedSpace) {
        setSelectedSpace(fetchedSpaces[0]);
      }
    } catch (err: any) {
      console.error('Error fetching chat spaces:', err);
      setErrorMsg(err.message || 'Unable to retrieve Google Chat spaces.');
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const loadMessages = async (spaceName: string) => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await fetchChatMessages(accessToken, spaceName);
      setMessages(fetchedMessages);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMembers = async (spaceName: string) => {
    if (!accessToken) return;
    setIsLoadingMembers(true);
    try {
      const fetchedMembers = await fetchChatMembers(accessToken, spaceName);
      setMembers(fetchedMembers);
    } catch (err: any) {
      console.error('Error fetching members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Request user confirmation before sending message (MANDATORY confirmation)
  const handleRequestSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSpace || !accessToken) return;

    const messageText = messageInput.trim();
    const spaceTitle = selectedSpace.displayName || selectedSpace.name;

    setConfirmationModal({
      isOpen: true,
      title: 'Confirm Sending Message',
      description: `You are about to post this message to "${spaceTitle}" from your Google account (${user?.email || 'Google User'}):\n\n"${messageText.slice(0, 140)}${messageText.length > 140 ? '...' : ''}"`,
      actionLabel: 'Send to Google Chat',
      isDestructive: false,
      onConfirm: async () => {
        setIsSending(true);
        try {
          const sent = await sendChatMessage(accessToken, selectedSpace.name, messageText);
          setMessages((prev) => [...prev, sent]);
          setMessageInput('');
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to post message to Google Chat.');
        } finally {
          setIsSending(false);
          setConfirmationModal(null);
        }
      }
    });
  };

  // Request user confirmation before deleting message (MANDATORY confirmation)
  const handleRequestDeleteMessage = (messageName: string) => {
    if (!accessToken) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Google Chat Message?',
      description: 'Are you sure you want to delete this message? This action removes the message permanently from the Google Chat space.',
      actionLabel: 'Delete Message',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteChatMessage(accessToken, messageName);
          setMessages((prev) => prev.filter((m) => m.name !== messageName));
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete message.');
        } finally {
          setConfirmationModal(null);
        }
      }
    });
  };

  // Request user confirmation before creating a new Google Chat Space (MANDATORY confirmation)
  const handleRequestCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !accessToken) return;

    const nameToCreate = newSpaceName.trim();
    const descToCreate = newSpaceDesc.trim();

    setConfirmationModal({
      isOpen: true,
      title: 'Create Google Chat Study Space',
      description: `Create a new collaborative Google Chat space named "${nameToCreate}"? This will provision a new room under your Google Workspace account where peers, advisors, and faculty can be invited.`,
      actionLabel: 'Create Space',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const created = await createChatSpace(accessToken, nameToCreate, descToCreate);
          setSpaces((prev) => [created, ...prev]);
          setSelectedSpace(created);
          setShowCreateSpaceModal(false);
          setNewSpaceName('');
          setNewSpaceDesc('');
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to create Google Chat space.');
        } finally {
          setConfirmationModal(null);
        }
      }
    });
  };

  const handleApplyPresetCourse = (course: Course) => {
    setSelectedCoursePreset(course.id);
    const inst = institutions.find((i) => i.id === course.institutionId);
    setNewSpaceName(`${inst?.shortName || ''} ${course.code}: ${course.title} Study Cohort`.trim());
    setNewSpaceDesc(`Collaborative academic study and citation exchange space for ${course.code} (${course.title}).`);
  };

  // Insert APA citation snippet into draft
  const handleInsertCitation = (citation: Citation) => {
    const formatted = `📚 ${citation.inText} — ${citation.title} (${citation.year})\nKey Quote: "${citation.keyQuotes?.[0] || citation.apa7}"`;
    setMessageInput((prev) => (prev ? `${prev}\n\n${formatted}` : formatted));
    setShowCitationPicker(false);
  };

  // Insert Assignment progress snippet
  const handleInsertAssignment = (assignment: Assignment) => {
    const course = courses.find((c) => c.id === assignment.courseId);
    const formatted = `🎯 Deliverable Update: [${course?.code || ''}] ${assignment.title} (Due: ${assignment.dueDate})\nStatus: ${assignment.currentPhase.toUpperCase()} | Points: ${assignment.points}`;
    setMessageInput((prev) => (prev ? `${prev}\n\n${formatted}` : formatted));
    setShowAssignmentPicker(false);
  };

  const filteredSpaces = spaces.filter((s) => {
    const query = spaceSearch.toLowerCase();
    const name = (s.displayName || s.name).toLowerCase();
    const desc = (s.spaceDetails?.description || '').toLowerCase();
    return name.includes(query) || desc.includes(query);
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              Google Chat Study Spaces
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Google Workspace Connected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans mt-0.5">
            Synchronize collaborative study cohorts, advisor check-ins, and peer citation exchanges across Mississippi State, CUNY SPS, and University of Florida.
          </p>
        </div>

        {/* Header Actions / Sign In state */}
        <div className="flex items-center gap-2 flex-wrap">
          {user && accessToken ? (
            <div className="flex items-center gap-2.5 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-6 w-6 rounded-full border border-neutral-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-xs">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-neutral-900 text-xs leading-none">
                    {user.displayName || 'Google User'}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate max-w-[130px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="text-neutral-500 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
                title="Sign out of Google Chat"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton onClick={handleSignIn} disabled={isAuthLoading} />
          )}

          {user && accessToken && (
            <button
              onClick={() => setShowCreateSpaceModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4 text-amber-400" />
              <span>Create Space</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-xs text-rose-950 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-4 w-4 text-rose-700 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold block text-rose-900">Google Authentication Notice</span>
            <p className="text-[11px] text-rose-800 font-sans mt-0.5">{authError}</p>
          </div>
          <button onClick={() => setAuthError(null)} className="text-rose-700 hover:text-rose-950">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      {!accessToken || !user ? (
        /* Sign-in Promotion & Explanation Card */
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-800 mx-auto">
            <MessageSquare className="h-8 w-8 text-amber-700" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Connect Your Google Chat Academic Hub
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-lg mx-auto leading-relaxed">
              Sign in with your Google account to access your institutional spaces, create course-specific study cohorts, and exchange APA citations with professors and peer researchers with verified user confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto pt-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 font-serif">
                <Users className="h-3.5 w-3.5 text-amber-700" />
                <span>Course Cohorts</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                1-click room creation for MSU, CUNY SPS, & UF coursework.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 font-serif">
                <Quote className="h-3.5 w-3.5 text-amber-700" />
                <span>Citation Share</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                Inject peer-reviewed APA sources and excerpts directly into chats.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 font-serif">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>Explicit Privacy</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                All messages and creations require explicit user confirmation.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center justify-center gap-3">
            <GoogleSignInButton
              onClick={handleSignIn}
              disabled={isAuthLoading}
              label={isAuthLoading ? 'Connecting to Google...' : 'Sign in with Google to Connect Chat'}
              className="py-3 px-6 shadow-sm"
            />
            <span className="text-[11px] text-neutral-400 font-sans">
              Requires permission to view and message Google Chat spaces with your consent.
            </span>
          </div>
        </div>
      ) : (
        /* Authenticated Two-Column Workspace Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
          {/* Left Sidebar: Spaces List (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              {/* Header & Search */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-neutral-900" />
                  <span className="font-serif font-bold text-neutral-900 text-sm">
                    Spaces & Cohorts ({spaces.length})
                  </span>
                </div>

                <button
                  onClick={loadSpaces}
                  disabled={isLoadingSpaces}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Refresh spaces from Google Chat"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={spaceSearch}
                  onChange={(e) => setSpaceSearch(e.target.value)}
                  placeholder="Filter chat spaces..."
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none shadow-xs"
                />
              </div>

              {/* Course Presets Quick Filters */}
              <div className="pt-1 flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSpaceSearch(spaceSearch === c.code ? '' : c.code)}
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-mono whitespace-nowrap cursor-pointer transition-all ${
                      spaceSearch === c.code
                        ? 'bg-amber-500/20 text-neutral-900 border-amber-400 font-bold'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>

              {/* Spaces List Scroll */}
              <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
                {isLoadingSpaces ? (
                  <div className="py-8 text-center text-xs text-neutral-400 space-y-2">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-600" />
                    <span>Loading Google Chat spaces...</span>
                  </div>
                ) : filteredSpaces.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 space-y-3 bg-neutral-50 rounded-xl p-4 border border-dashed border-neutral-200">
                    <MessageSquare className="h-6 w-6 text-neutral-400 mx-auto" />
                    <div>
                      <p className="font-semibold text-neutral-800">No matching spaces</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Create a new study cohort or adjust your search filter.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateSpaceModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      + Create First Cohort
                    </button>
                  </div>
                ) : (
                  filteredSpaces.map((s) => {
                    const isSelected = selectedSpace?.name === s.name;
                    const displayName = s.displayName || s.name.replace('spaces/', 'Space #');

                    return (
                      <button
                        key={s.name}
                        onClick={() => setSelectedSpace(s)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : 'bg-neutral-50/70 text-neutral-800 border-neutral-200 hover:bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Hash
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isSelected ? 'text-amber-400' : 'text-neutral-500'
                              }`}
                            />
                            <span
                              className={`font-serif font-bold text-xs truncate ${
                                isSelected ? 'text-white' : 'text-neutral-900'
                              }`}
                            >
                              {displayName}
                            </span>
                          </div>

                          {s.spaceDetails?.description && (
                            <p
                              className={`text-[11px] truncate mt-1 font-sans ${
                                isSelected ? 'text-neutral-300' : 'text-neutral-500'
                              }`}
                            >
                              {s.spaceDetails.description}
                            </p>
                          )}
                        </div>

                        <ChevronRight
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            isSelected ? 'text-amber-400' : 'text-neutral-400'
                          }`}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create Space Trigger button in sidebar */}
            <div className="pt-2 border-t border-neutral-200">
              <button
                onClick={() => setShowCreateSpaceModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 text-amber-700" />
                <span>New Course Study Space</span>
              </button>
            </div>
          </div>

          {/* Right Area: Active Space Conversation & Tools (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
            {selectedSpace ? (
              <>
                {/* Active Space Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-amber-700" />
                      <h2 className="font-serif font-bold text-neutral-900 text-base sm:text-lg">
                        {selectedSpace.displayName || selectedSpace.name}
                      </h2>
                    </div>
                    {selectedSpace.spaceDetails?.description && (
                      <p className="text-xs text-neutral-600 font-sans mt-0.5">
                        {selectedSpace.spaceDetails.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMembersDrawer(!showMembersDrawer)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        showMembersDrawer
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Members ({members.length})</span>
                    </button>

                    <button
                      onClick={() => selectedSpace && loadMessages(selectedSpace.name)}
                      disabled={isLoadingMessages}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 cursor-pointer"
                      title="Refresh messages"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Optional Members Drawer */}
                {showMembersDrawer && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/90 p-3 space-y-2 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-neutral-900 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-amber-700" />
                        Space Members & Permissions
                      </span>
                      <button
                        onClick={() => setShowMembersDrawer(false)}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {members.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 text-[11px]"
                        >
                          <div className="h-4 w-4 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-[9px]">
                            {m.member?.displayName?.charAt(0) || 'M'}
                          </div>
                          <span className="font-medium text-neutral-800">
                            {m.member?.displayName || m.name}
                          </span>
                          {m.role && (
                            <span className="text-[9px] bg-neutral-100 px-1 py-0.2 rounded text-neutral-500 font-mono">
                              {m.role}
                            </span>
                          )}
                        </div>
                      ))}
                      {members.length === 0 && !isLoadingMembers && (
                        <span className="text-neutral-500 text-[11px]">No external members listed yet.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message Stream Area */}
                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3.5 pr-2">
                  {isLoadingMessages ? (
                    <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-600" />
                      <span>Retrieving conversations from Google Chat...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-500 bg-neutral-50/60 rounded-2xl border border-dashed border-neutral-200 p-6 space-y-2">
                      <Sparkles className="h-6 w-6 text-amber-600 mx-auto" />
                      <p className="font-serif font-bold text-neutral-900 text-sm">
                        Start the Academic Exchange
                      </p>
                      <p className="text-neutral-500 max-w-sm mx-auto text-[11px] leading-relaxed">
                        Send a message, paste an APA citation from your library vault, or share a deliverable update.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender?.email === user.email || msg.sender?.displayName === user.displayName;
                      const senderName = msg.sender?.displayName || 'Google User';
                      const formattedDate = msg.createTime
                        ? new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div
                          key={msg.name}
                          className={`flex items-start gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                          {/* Sender Avatar */}
                          {msg.sender?.avatarUrl ? (
                            <img
                              src={msg.sender.avatarUrl}
                              alt={senderName}
                              className="h-7 w-7 rounded-full border border-neutral-200 shrink-0 mt-0.5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-neutral-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {senderName.charAt(0)}
                            </div>
                          )}

                          {/* Message Content Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 text-xs max-w-[80%] space-y-1 ${
                              isMe
                                ? 'bg-neutral-900 text-white rounded-tr-xs'
                                : 'bg-neutral-100 text-neutral-900 rounded-tl-xs border border-neutral-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] pb-0.5 border-b border-white/10">
                              <span className={`font-semibold ${isMe ? 'text-amber-300' : 'text-neutral-700'}`}>
                                {senderName}
                              </span>
                              <span className={isMe ? 'text-neutral-400' : 'text-neutral-400'}>
                                {formattedDate}
                              </span>
                            </div>

                            <p className="font-sans whitespace-pre-wrap leading-relaxed pt-0.5">
                              {msg.text || msg.formattedText}
                            </p>

                            {/* Delete Action (only visible on hover or if isMe) */}
                            {isMe && (
                              <div className="pt-1 flex justify-end">
                                <button
                                  onClick={() => handleRequestDeleteMessage(msg.name)}
                                  className="text-neutral-400 hover:text-rose-400 p-0.5 transition-colors cursor-pointer text-[10px] flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
                                  title="Delete message"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer & Quick Academic Inserters */}
                <form onSubmit={handleRequestSendMessage} className="pt-2 border-t border-neutral-200 space-y-2">
                  {/* Inserter Action Strip */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider font-sans">
                        Quick Insert:
                      </span>

                      {/* Citation Inserter Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowCitationPicker(!showCitationPicker);
                          setShowAssignmentPicker(false);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <BookOpen className="h-3 w-3 text-amber-700" />
                        <span>+ APA Citation</span>
                      </button>

                      {/* Assignment Progress Inserter Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAssignmentPicker(!showAssignmentPicker);
                          setShowCitationPicker(false);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 hover:bg-neutral-200 text-[11px] font-medium transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-3 w-3 text-neutral-600" />
                        <span>+ Deliverable Update</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-neutral-400 font-mono">
                      {messageInput.length} chars
                    </span>
                  </div>

                  {/* Inline Citation Picker Drawer */}
                  {showCitationPicker && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2 animate-fadeIn text-xs max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-950 font-serif text-xs">
                          Select Citation to Share:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCitationPicker(false)}
                          className="text-amber-800 hover:text-amber-950"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {citations.slice(0, 6).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleInsertCitation(c)}
                            className="text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="truncate">
                              <span className="font-bold text-neutral-900 font-mono text-[11px] mr-1">
                                {c.inText}
                              </span>
                              <span className="text-neutral-600 text-xs truncate">
                                {c.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0">
                              Insert
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Assignment Picker Drawer */}
                  {showAssignmentPicker && (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-2 animate-fadeIn text-xs max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 font-serif text-xs">
                          Select Deliverable to Share:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAssignmentPicker(false)}
                          className="text-neutral-500 hover:text-neutral-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {assignments.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleInsertAssignment(a)}
                            className="text-left p-2 rounded-lg bg-white border border-neutral-200 hover:border-neutral-400 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="truncate">
                              <span className="font-bold text-neutral-900 text-[11px] mr-1">
                                {a.title}
                              </span>
                              <span className="text-neutral-500 text-[10px]">
                                (Due: {a.dueDate})
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 rounded shrink-0">
                              Insert
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Box & Send Trigger */}
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleRequestSendMessage(e);
                        }
                      }}
                      placeholder={`Message #${selectedSpace.displayName || 'space'}... (Press Enter to review & send)`}
                      className="flex-1 rounded-xl border border-neutral-300 bg-white p-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none resize-none shadow-xs"
                    />

                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 p-3 text-neutral-950 font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      title="Review and send message to Google Chat"
                    >
                      <Send className={`h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-24 text-center text-xs text-neutral-400 space-y-3">
                <MessageSquare className="h-10 w-10 text-neutral-300 mx-auto" />
                <p className="font-serif font-bold text-neutral-800 text-sm">
                  Select a Google Chat Space
                </p>
                <p className="text-neutral-500 max-w-xs mx-auto">
                  Choose a space from the left column or create a new course study room.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL */}
      {confirmationModal && confirmationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 max-w-md w-full shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl ${
                  confirmationModal.isDestructive
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {confirmationModal.isDestructive ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <h3 className="font-serif font-bold text-neutral-900 text-base">
                {confirmationModal.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 font-sans leading-relaxed whitespace-pre-wrap">
              {confirmationModal.description}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmationModal(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmationModal.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  confirmationModal.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
              >
                {confirmationModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SPACE MODAL */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 max-w-lg w-full shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-600" />
                <h3 className="font-serif font-bold text-neutral-900 text-base">
                  Create Google Chat Study Space
                </h3>
              </div>
              <button
                onClick={() => setShowCreateSpaceModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Course Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider font-sans">
                Quick Preset from Enrolled Courses:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleApplyPresetCourse(c)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedCoursePreset === c.id
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="font-serif font-bold text-xs">{c.code}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{c.title}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRequestCreateSpace} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 font-sans">
                  Space Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. MSU ED 9413 Curriculum Research Cohort"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 font-sans">
                  Description & Guidelines (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="Space purpose, topic focus, or collaboration guidelines..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none resize-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSpaceName.trim()}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Proceed to Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
