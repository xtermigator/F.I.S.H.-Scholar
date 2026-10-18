import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Code2,
  FileText,
  Copy,
  Check,
  Send,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { createClient, AnamEvent } from '@anam-ai/js-sdk';
import { Citation, Course, Assignment, AcademicMemoryNode } from '../types';

interface AnamAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  citations: Citation[];
  courses: Course[];
  assignments: Assignment[];
  onSaveCitation: (citation: Citation) => void;
  onAddMemory: (node: AcademicMemoryNode) => void;
  onInjectWritingDraft?: (text: string) => void;
}

export const AnamAvatarModal: React.FC<AnamAvatarModalProps> = ({
  isOpen,
  onClose,
  citations,
  courses,
  assignments,
  onSaveCitation,
  onAddMemory,
  onInjectWritingDraft
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const anamClientRef = useRef<any>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [lastAvatarReply, setLastAvatarReply] = useState(
    "Greetings, Eric. I'm Dr. Fisher, your F.I.S.H. Scholar Academic Avatar. I can discuss your research across Mississippi State, CUNY SPS, and UF, extract APA citations directly to your vault, or generate unified cross-paper synthesis reports."
  );

  // Active extracted data from conversation
  const [extractedCitation, setExtractedCitation] = useState<Citation | null>(null);
  const [scholarReport, setScholarReport] = useState<any | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedCitationId, setSavedCitationId] = useState<string | null>(null);
  const [injectedTextSuccess, setInjectedTextSuccess] = useState(false);

  // Speech recognition ref
  const recognitionRef = useRef<any>(null);

  // Check Anam API Status on mount
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/anam/status')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(data.configured);
        if (data.personaId) {
          setActivePersonaId(data.personaId);
        }
        if (data.configured) {
          startAnamStream();
        }
      })
      .catch((err) => {
        console.error('Error checking Anam status:', err);
      });

    return () => {
      stopAnamStream();
    };
  }, [isOpen]);

  // Start Anam Stream using session token
  const startAnamStream = async () => {
    setConnecting(true);
    setConnectionError(null);
    try {
      const res = await fetch('/api/anam/session-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Eric Fishon',
          currentContext: {
            coursesCount: courses.length,
            citationsCount: citations.length,
            topAssignment: assignments[0]?.title
          }
        })
      });

      const data = await res.json();
      if (data.success && data.sessionToken) {
        if (data.personaId) {
          setActivePersonaId(data.personaId);
        }
        // Initialize client with temporary session token
        const client = createClient(data.sessionToken);
        anamClientRef.current = client;

        // Stream video to element
        await client.streamToVideoElement('anam-video-stream');
        setIsStreaming(true);

        // Listen to events
        client.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, (history: any) => {
          if (Array.isArray(history) && history.length > 0) {
            const lastMsg = history[history.length - 1];
            if (lastMsg && lastMsg.content) {
              setLastAvatarReply(lastMsg.content);
            }
          }
        });
      } else {
        setConnectionError(data.error || data.message || 'Unable to establish Anam session token.');
      }
    } catch (error: any) {
      console.error('Failed to start Anam stream:', error);
      setConnectionError(error.message || 'Network error connecting to Anam streaming server.');
    } finally {
      setConnecting(false);
    }
  };

  const stopAnamStream = () => {
    try {
      if (anamClientRef.current) {
        if (typeof anamClientRef.current.stopStreaming === 'function') {
          anamClientRef.current.stopStreaming();
        }
        anamClientRef.current = null;
      }
    } catch (e) {
      console.error('Error stopping stream:', e);
    }
    setIsStreaming(false);
  };

  // Speech Recognition Handling
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type in the box below!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      setInputText(current);
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition event:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Send message to Avatar
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || actionLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setInputText('');
    setTranscript('');
    setActionLoading(true);

    try {
      // 1. If live Anam client is active, send talk command
      if (anamClientRef.current && typeof anamClientRef.current.talk === 'function') {
        await anamClientRef.current.talk(textToSend);
      }

      // 2. Query Companion API for response & scholar tool actions
      const res = await fetch('/api/gemini/companion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'research_librarian',
          message: textToSend,
          currentContext: {
            assignment: assignments[0] ? { title: assignments[0].title } : null,
            citationsCount: citations.length,
            courses: courses.map((c) => c.code)
          }
        })
      });

      const data = await res.json();
      if (data.reply) {
        setLastAvatarReply(data.reply);
      }

      // 3. Auto-detect if user requested citation extraction or cross-paper synthesis
      const lower = textToSend.toLowerCase();
      if (lower.includes('citation') || lower.includes('apa') || lower.includes('save') || lower.includes('burgstahler') || lower.includes('evans') || lower.includes('paper')) {
        handleExtractCitation(textToSend);
      } else if (lower.includes('synthesis') || lower.includes('report') || lower.includes('connect')) {
        handleCrossPaperSynthesis(textToSend);
      } else if (lower.includes('code') || lower.includes('python') || lower.includes('script')) {
        handleGenerateCode(textToSend);
      }
    } catch (err) {
      console.error('Error in Anam communication:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Tool Action: Extract & Save APA Citation
  const handleExtractCitation = async (snippet?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/anam/extract-citation-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionSnippet: snippet || lastAvatarReply || 'Universal Design in Higher Education',
          paperTitle: snippet || 'Burgstahler (2021) Universal Design Framework',
          targetCourseId: courses[0]?.id || 'c1'
        })
      });

      const data = await res.json();
      if (data.success && data.citation) {
        setExtractedCitation(data.citation);
      }
    } catch (err) {
      console.error('Error extracting citation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Tool Action: Cross-Paper Scholar Report
  const handleCrossPaperSynthesis = async (topic?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/anam/cross-paper-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryTopic: topic || 'Cross-Institutional Transition Barriers & Universal Design',
          selectedCitations: citations.slice(0, 4),
          currentCourses: courses
        })
      });

      const data = await res.json();
      if (data.success && data.scholarReport) {
        setScholarReport(data.scholarReport);
        if (data.scholarReport.generatedCodeScript) {
          setGeneratedCode(data.scholarReport.generatedCodeScript);
        }
      }
    } catch (err) {
      console.error('Error synthesizing report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Tool Action: Generate Academic Script
  const handleGenerateCode = async (prompt?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/anam/generate-code-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskDescription: prompt || 'Transition barrier retention analysis model across CUNY, MSU, and UF',
          language: 'python'
        })
      });

      const data = await res.json();
      if (data.success && data.code) {
        setGeneratedCode(data.code);
      }
    } catch (err) {
      console.error('Error generating code:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommitCitationToVault = () => {
    if (!extractedCitation) return;
    onSaveCitation(extractedCitation);
    setSavedCitationId(extractedCitation.id);
    setTimeout(() => setSavedCitationId(null), 3000);
  };

  const handleInjectIntoWritingStudio = () => {
    if (!scholarReport?.actionableDraftSection || !onInjectWritingDraft) return;
    onInjectWritingDraft(scholarReport.actionableDraftSection);
    setInjectedTextSuccess(true);
    setTimeout(() => setInjectedTextSuccess(false), 3000);
  };

  const handleLogMemoryFromAvatar = () => {
    const memoryNode: AcademicMemoryNode = {
      id: `mem-${Date.now()}`,
      concept: scholarReport?.reportTitle || 'Cross-Curricular Synthesis Milestone',
      originInstitution: courses[0]?.institutionId || 'Universal OS',
      originCourseCode: courses[0]?.code || 'MULTIDISCIPLINARY',
      relevanceTags: ['Avatar Synthesis', 'Anam Session', 'Voice Ideation'],
      coreInsight: lastAvatarReply || scholarReport?.synthesisOverview || 'Synthesized via live academic avatar session.',
      quotations: scholarReport?.savedCitations?.map((c) => c.apa7) || [],
      relatedCitationIds: scholarReport?.savedCitations?.map((c) => c.id) || [],
      priorDraftSnippets: scholarReport?.actionableDraftSection ? [scholarReport.actionableDraftSection] : [],
      crossSchoolApplications: courses.slice(1).map((c) => ({
        targetCourseCode: c.code,
        suggestion: `Integrate synthesized insights into ${c.name}`
      }))
    };
    onAddMemory(memoryNode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md font-sans">
      <div
        className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl"
        id="anam-avatar-modal"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-serif tracking-tight">
                  Dr. Fisher • Anam.ai Scholar Avatar
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    hasApiKey
                      ? 'border-emerald-500/30 bg-emerald-950/60 text-emerald-400'
                      : 'border-amber-500/30 bg-amber-950/60 text-amber-300'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {hasApiKey ? 'Live WebRTC Streaming' : 'Adaptive Audio Avatar Mode'}
                </span>
                {activePersonaId && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono border border-indigo-500/30 bg-indigo-950/60 text-indigo-300">
                    <Shield className="h-2.5 w-2.5" />
                    Persona: {activePersonaId.slice(0, 8)}...
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Interactive Voice, APA Citation Extraction, & Cross-Course Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasApiKey && !isStreaming && (
              <button
                onClick={startAnamStream}
                disabled={connecting}
                className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 cursor-pointer disabled:opacity-50"
                title="Reconnect video stream"
                id="anam-reconnect-btn"
              >
                <RefreshCw className={`h-3 w-3 ${connecting ? 'animate-spin' : ''}`} />
                <span>{connecting ? 'Connecting...' : 'Connect Video'}</span>
              </button>
            )}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
              id="anam-mute-toggle"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white cursor-pointer transition-colors"
              id="anam-modal-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Connection Error Banner if any */}
        {connectionError && (
          <div className="flex items-center justify-between border-b border-rose-900/40 bg-rose-950/40 px-6 py-2 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Anam Stream Warning: {connectionError}</span>
            </div>
            <button
              onClick={startAnamStream}
              className="rounded border border-rose-700/50 bg-rose-900/60 px-2 py-0.5 text-[11px] font-medium text-rose-100 hover:bg-rose-800 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Main Content Grid: Video Avatar (Left) + Scholar Intelligence & Tools (Right) */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Avatar Stream & Voice Controls (5 cols) */}
          <div className="flex flex-col border-r border-neutral-800 bg-neutral-950 p-5 lg:col-span-5 justify-between">
            {/* Video / Visualizer Canvas */}
            <div className="relative flex aspect-4/3 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-inner">
              {/* Actual Video Element for Anam.ai WebRTC */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className={`h-full w-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
                id="anam-video-stream"
              />

              {/* Animated Scholar Avatar Fallback / Visualizer when stream connecting or API key absent */}
              {!isStreaming && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-amber-500/40 bg-neutral-800 shadow-lg">
                    <Sparkles className="h-10 w-10 text-amber-400 animate-pulse" />
                    {isListening && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex h-4 w-4 rounded-full bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white font-serif">Dr. Fisher, Ph.D.</h3>
                  <p className="mt-1 text-xs text-neutral-400 max-w-xs">
                    Universal Design • Critical Disability Studies • Transition Ecology
                  </p>

                  {!hasApiKey && (
                    <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-[11px] text-neutral-400">
                      💡 To enable photorealistic HD video avatar streaming, configure{' '}
                      <code className="text-amber-300">ANAM_AI_API_KEY</code> in Settings.
                    </div>
                  )}
                </div>
              )}

              {/* Live Status Overlay */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] text-neutral-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Scholar OS Connected</span>
              </div>
            </div>

            {/* Speech Bubble / Transcript */}
            <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 text-xs text-neutral-200">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Dr. Fisher:</span>
              </div>
              <p className="leading-relaxed">{lastAvatarReply}</p>

              {transcript && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 italic">
                  🎤 Hearing: "{transcript}"
                </div>
              )}
            </div>

            {/* Voice & Quick Action Controls */}
            <div className="mt-4 space-y-2.5">
              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSendMessage('Save my APA citation for Burgstahler (2021) to vault')}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-amber-500/40 hover:bg-neutral-800 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  💾 Save Burgstahler Citation
                </button>
                <button
                  onClick={() => handleSendMessage('Synthesize my CUNY and MSU coursework into a scholar report')}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-amber-500/40 hover:bg-neutral-800 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  📊 Cross-Paper Report
                </button>
                <button
                  onClick={() => handleSendMessage('Write a Python transition barrier script for UF research')}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-amber-500/40 hover:bg-neutral-800 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  💻 Python Analysis Script
                </button>
              </div>

              {/* Input Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSpeechRecognition}
                  id="anam-mic-toggle"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-lg shadow-rose-500/20 animate-pulse'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                >
                  {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Speak or type your academic research question..."
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  id="anam-text-input"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || actionLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-colors cursor-pointer font-bold shadow-md"
                  id="anam-send-button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Scholar Two-Way Actions, APA Vault, & Reports (7 cols) */}
          <div className="flex flex-col bg-neutral-900/40 p-5 lg:col-span-7 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white font-serif">
                  Scholar Tool Returns & Active Output
                </h3>
              </div>
              <span className="text-xs text-neutral-400">Two-way synchronization</span>
            </div>

            {/* 1. Extracted APA Citation Card */}
            {extractedCitation && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-emerald-300">
                      Extracted APA 7 Citation Record
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    {extractedCitation.inText}
                  </span>
                </div>

                <p className="text-xs text-neutral-200 font-mono bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800 select-all">
                  {extractedCitation.apa7}
                </p>

                {extractedCitation.keyQuotes && extractedCitation.keyQuotes.length > 0 && (
                  <div className="mt-2 text-[11px] text-neutral-300 italic border-l-2 border-emerald-500/50 pl-2">
                    "{extractedCitation.keyQuotes[0]}"
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-emerald-900/40">
                  <div className="flex flex-wrap gap-1">
                    {extractedCitation.keywords?.map((k, i) => (
                      <span
                        key={i}
                        className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-[9px] text-emerald-300"
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={handleCommitCitationToVault}
                    disabled={savedCitationId === extractedCitation.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors cursor-pointer"
                    id="anam-save-citation-vault-btn"
                  >
                    {savedCitationId === extractedCitation.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Saved to Vault!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Save to Master Vault</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 2. Cross-Paper Scholar Synthesis Report */}
            {scholarReport ? (
              <div className="rounded-xl border border-amber-500/30 bg-neutral-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-300">
                      {scholarReport.reportTitle || 'Cross-Paper Scholar Synthesis'}
                    </h4>
                  </div>
                  <button
                    onClick={handleLogMemoryFromAvatar}
                    className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                  >
                    🧠 Save to Memory
                  </button>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {scholarReport.executiveSummary}
                </p>

                {scholarReport.synthesizedThemes && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <span className="text-[11px] font-semibold text-neutral-400">
                      Synthesized Core Themes:
                    </span>
                    {scholarReport.synthesizedThemes.map((theme: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2.5 text-xs"
                      >
                        <div className="font-semibold text-amber-200">{theme.themeName}</div>
                        <p className="text-neutral-300 text-[11px] mt-1">{theme.coreArgument}</p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400">
                          <span>Linked: {theme.citationsLinked?.join(', ')}</span>
                          <span className="text-amber-400/90">{theme.crossCourseImplication}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {scholarReport.actionableDraftSection && (
                  <div className="pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-neutral-400">
                        Synthesized Section (Ready for Paper Draft):
                      </span>
                      {onInjectWritingDraft && (
                        <button
                          onClick={handleInjectIntoWritingStudio}
                          className="flex items-center gap-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium hover:bg-amber-500/30 cursor-pointer"
                          id="anam-inject-writing-btn"
                        >
                          {injectedTextSuccess ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Injected to Writing Studio!</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3" />
                              <span>Inject to Writing Studio</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="rounded-lg bg-neutral-950 p-2.5 text-[11px] text-neutral-300 font-serif leading-relaxed border border-neutral-800">
                      {scholarReport.actionableDraftSection}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !extractedCitation && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-center text-neutral-500">
                  <Layers className="h-8 w-8 text-neutral-600 mb-2" />
                  <p className="text-xs">
                    Discuss any research topic, author, or question with Dr. Fisher.
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Citations, synthesis drafts, and data scripts will appear here in real time.
                  </p>
                </div>
              )
            )}

            {/* 3. Generated Code Script (Python / R) */}
            {generatedCode && (
              <div className="rounded-xl border border-purple-500/30 bg-neutral-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-purple-300">
                      Synthesized Research Code Script (Python)
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                  >
                    {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Script'}</span>
                  </button>
                </div>

                <pre className="rounded-lg bg-neutral-950 p-3 text-[11px] font-mono text-purple-200 overflow-x-auto border border-neutral-800">
                  <code>{generatedCode}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
