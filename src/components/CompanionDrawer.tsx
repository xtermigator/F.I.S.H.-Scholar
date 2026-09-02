import React, { useState } from 'react';
import {
  X,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  Bot,
  User,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';
import { CoachMessage, Assignment, Course, Citation } from '../types';

interface CompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssignment?: Assignment | null;
  currentCourse?: Course | null;
  citations: Citation[];
  onStartFocus: (assignmentId?: string, minutes?: number) => void;
  onOpenWritingStudio: (assignmentId: string) => void;
}

type CoachRole = 'study_coach' | 'research_librarian' | 'apa_coach' | 'assignment_coach' | 'access_coach' | 'body_double';

export const CompanionDrawer: React.FC<CompanionDrawerProps> = ({
  isOpen,
  onClose,
  currentAssignment,
  currentCourse,
  citations,
  onStartFocus,
  onOpenWritingStudio
}) => {
  const [selectedRole, setSelectedRole] = useState<CoachRole>('study_coach');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'm1',
      sender: 'coach',
      role: 'study_coach',
      text: "Good afternoon, Eric. You have 3 items on deck across Mississippi State, CUNY SPS, and UF today. Your highest leverage next step is the ED 9413 peer response (approx 20 mins). Let's get it off your plate!",
      timestamp: 'Just now',
      suggestedAction: {
        label: 'Start 20m Focus Block on ED 9413',
        actionType: 'start_focus',
        payload: { assignmentId: 'asg-msu-peer', minutes: 20 }
      }
    }
  ]);

  const roleConfigs: Record<CoachRole, { name: string; icon: any; color: string; promptPlaceholder: string }> = {
    study_coach: {
      name: 'Study Coach',
      icon: Sparkles,
      color: 'text-amber-900 bg-amber-50 border-amber-300',
      promptPlaceholder: 'Ask how to tackle today’s tasks or overcome overwhelm...'
    },
    research_librarian: {
      name: 'Research Librarian',
      icon: BookOpen,
      color: 'text-blue-900 bg-blue-50 border-blue-300',
      promptPlaceholder: 'Ask to retrieve citations, DOIs, or connect past school papers...'
    },
    apa_coach: {
      name: 'APA 7 Coach',
      icon: CheckCircle2,
      color: 'text-emerald-900 bg-emerald-50 border-emerald-300',
      promptPlaceholder: 'Ask how to format a citation, DOI, blockquote, or reference...'
    },
    assignment_coach: {
      name: 'Assignment Coach',
      icon: Zap,
      color: 'text-purple-900 bg-purple-50 border-purple-300',
      promptPlaceholder: 'Ask to unpack rubrics, decipher prompts, or plan sections...'
    },
    access_coach: {
      name: 'Access Coach',
      icon: ShieldCheck,
      color: 'text-rose-900 bg-rose-50 border-rose-300',
      promptPlaceholder: 'Draft accommodation emails to professors or plan self-advocacy...'
    },
    body_double: {
      name: 'Body Double',
      icon: HeartHandshake,
      color: 'text-cyan-900 bg-cyan-50 border-cyan-300',
      promptPlaceholder: 'Check in, share your next 10-minute micro-goal, or stay grounded...'
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg: CoachMessage = {
      id: `usr-${Date.now()}`,
      sender: 'student',
      role: selectedRole,
      text: inputText.trim(),
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptToSend = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/companion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          message: promptToSend,
          currentContext: {
            assignment: currentAssignment ? { title: currentAssignment.title, prompt: currentAssignment.prompt, dueDate: currentAssignment.dueDate } : null,
            course: currentCourse ? { code: currentCourse.code, title: currentCourse.title, professor: currentCourse.professor.name } : null,
            citationsCount: citations.length
          }
        })
      });

      const data = await res.json();
      const coachMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        role: selectedRole,
        text: data.reply || "I've analyzed your academic context and provided the recommendations above.",
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error('Error contacting companion:', err);
      const fallbackMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        role: selectedRole,
        text: "I'm keeping your academic momentum going. Let's focus on one clear micro-step.",
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 bg-neutral-50">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-amber-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 font-serif">Academic AI Companion</h2>
            <p className="text-[11px] text-neutral-500 font-sans">Context-grounded scholarly coaching</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
          id="companion-close-button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-neutral-50/50 border-b border-neutral-200 text-[11px]">
        {(Object.keys(roleConfigs) as CoachRole[]).map((rKey) => {
          const cfg = roleConfigs[rKey];
          const Icon = cfg.icon;
          const isSelected = selectedRole === rKey;
          return (
            <button
              key={rKey}
              onClick={() => setSelectedRole(rKey)}
              id={`companion-role-${rKey}`}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all text-left cursor-pointer border ${
                isSelected
                  ? `${cfg.color} font-semibold shadow-xs`
                  : 'border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {/* Active Context Banner */}
        {currentAssignment && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-neutral-700 flex items-start gap-2 shadow-xs">
            <Zap className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Active Grounding: </span>
              {currentAssignment.title} ({currentAssignment.dueTime})
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {m.sender === 'student' ? (
                <>
                  <span className="text-[10px] text-neutral-500">You</span>
                  <User className="h-3 w-3 text-neutral-400" />
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 text-amber-700" />
                  <span className="text-[10px] font-semibold text-neutral-800">
                    {roleConfigs[m.role]?.name || 'Coach'}
                  </span>
                </>
              )}
              <span className="text-[9px] text-neutral-400">{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.sender === 'student'
                  ? 'bg-neutral-900 text-white font-medium rounded-tr-xs shadow-xs'
                  : 'bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-tl-xs shadow-xs'
              }`}
            >
              {m.text}

              {m.suggestedAction && (
                <div className="mt-2.5 pt-2 border-t border-neutral-200">
                  <button
                    onClick={() => {
                      if (m.suggestedAction?.actionType === 'start_focus') {
                        onStartFocus(m.suggestedAction.payload?.assignmentId, m.suggestedAction.payload?.minutes);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200"
                  >
                    <span>{m.suggestedAction.label}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 w-fit shadow-xs">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-700" />
            <span>Consulting academic knowledge graph...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-neutral-200 p-3 bg-neutral-50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={roleConfigs[selectedRole].promptPlaceholder}
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none shadow-xs"
            id="companion-input-box"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            id="companion-send-button"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
