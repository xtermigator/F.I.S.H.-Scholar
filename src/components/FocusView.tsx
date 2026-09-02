import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  HeartHandshake,
  CheckCircle2,
  Circle,
  Plus,
  Coffee,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Assignment, Course } from '../types';

interface FocusViewProps {
  assignments: Assignment[];
  courses: Course[];
  initialAssignmentId?: string | null;
  initialMinutes?: number;
  onOpenWritingStudio: (assignmentId: string) => void;
  onOpenCompanionWithRole: (role: string) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  assignments,
  courses,
  initialAssignmentId,
  initialMinutes = 20,
  onOpenWritingStudio,
  onOpenCompanionWithRole
}) => {
  const [selectedAsgId, setSelectedAsgId] = useState<string>(
    initialAssignmentId || assignments[0]?.id || ''
  );
  const currentAssignment = assignments.find((a) => a.id === selectedAsgId) || assignments[0];
  const currentCourse = courses.find((c) => c.id === currentAssignment?.courseId);

  // Timer state
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusModeType, setFocusModeType] = useState<'study' | 'sprint' | 'break'>('study');

  // Micro tasks for this session
  const [microTasks, setMicroTasks] = useState([
    { id: 'mt-1', text: 'Read the discussion prompt thoroughly', completed: true },
    { id: 'mt-2', text: 'Pull Burgstahler UDL citation from library', completed: true },
    { id: 'mt-3', text: 'Draft 250-word synthesis in Writing Studio', completed: false },
    { id: 'mt-4', text: 'Run authentic voice & APA check', completed: false }
  ]);
  const [newMicroTask, setNewMicroTask] = useState('');

  // Ambient sound synth using Web Audio API
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Timer countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      // Play completion chime
      playChime();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  // Audio synthesis helper for ambient brown/binaural frequencies
  const startAudio = (type: string) => {
    try {
      stopAudio();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'binaural') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, ctx.currentTime); // Theta wave
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
      } else if (type === 'brown_noise') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, ctx.currentTime); // Deep warm hum
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
      } else if (type === 'lofi_pulse') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setActiveSound(type);
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
    oscillatorRef.current = null;
    audioContextRef.current = null;
    setActiveSound(null);
  };

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = (mins: number) => {
    setIsActive(false);
    setTotalSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  const handleAddMicroTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMicroTask.trim()) return;
    setMicroTasks((prev) => [
      ...prev,
      { id: `mt-${Date.now()}`, text: newMicroTask.trim(), completed: false }
    ]);
    setNewMicroTask('');
  };

  const handleToggleTask = (id: string) => {
    setMicroTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            ADHD Executive Focus Engine
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans">
            Low-friction micro-tasking, body doubling, and custom sensory soundscapes for sustained scholarly momentum
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCompanionWithRole('body_double')}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-50 text-cyan-900 border border-cyan-200 px-3.5 py-2 text-xs font-semibold hover:bg-cyan-100 transition-all cursor-pointer shadow-xs"
          >
            <HeartHandshake className="h-4 w-4 text-cyan-700" />
            <span>Launch Body Double</span>
          </button>
        </div>
      </div>

      {/* Main Focus Center Grid: Left Circular Focus Core (7 cols) + Right Task Breakdown (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deep Focus Core (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target Assignment Selector & Focus Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-4 font-sans">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                Single Active Focus Target
              </span>
              <select
                value={selectedAsgId}
                onChange={(e) => {
                  setSelectedAsgId(e.target.value);
                  const asg = assignments.find((a) => a.id === e.target.value);
                  if (asg) resetTimer(asg.estimatedMinutes);
                }}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-800 focus:border-neutral-900 focus:outline-none shadow-xs"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.estimatedMinutes}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Title */}
            <h2 className="text-xl font-serif font-bold text-neutral-900 max-w-md">
              {currentAssignment?.title}
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-1 max-w-sm">
              {currentCourse?.code} • Due {currentAssignment?.dueDate}
            </p>

            {/* Circular Timer Visual */}
            <div className="relative my-8 flex items-center justify-center">
              <svg className="w-64 h-64 transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  className="stroke-neutral-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  className="stroke-amber-500 transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={2 * Math.PI * 110 * (1 - progressPct / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center font-sans">
                <div className="text-5xl font-mono font-bold tracking-tighter text-neutral-900">
                  {formatTime(secondsRemaining)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mt-1">
                  {isActive ? 'In Deep Focus' : 'Paused'}
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTimer}
                id="focus-toggle-button"
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 fill-white" />
                    <span>Pause Session</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-neutral-950" />
                    <span>Start Focus</span>
                  </>
                )}
              </button>

              <button
                onClick={() => resetTimer(20)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer shadow-xs"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Preset Time Durations */}
            <div className="mt-6 flex items-center gap-2 pt-4 border-t border-neutral-200 text-xs font-sans">
              <span className="text-neutral-500 text-[11px]">Sprint Blocks:</span>
              {[
                { label: '10m Micro', mins: 10 },
                { label: '20m Standard', mins: 20 },
                { label: '45m Deep Work', mins: 45 },
                { label: '5m Break', mins: 5 }
              ].map((p) => (
                <button
                  key={p.mins}
                  onClick={() => resetTimer(p.mins)}
                  className="rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-neutral-700 font-medium transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Audio Soundscapes */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-amber-700" />
                <h3 className="font-serif font-bold text-neutral-900 text-sm">
                  ADHD Focus Soundscapes (Web Audio Synth)
                </h3>
              </div>
              {activeSound && (
                <button
                  onClick={stopAudio}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>Mute Audio</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'binaural', label: 'Theta Binaural Waves (140Hz)', desc: 'Cognitive flow & calm synthesis' },
                { id: 'brown_noise', label: 'Warm Brown Noise (60Hz)', desc: 'Blocks distracting sensory chatter' },
                { id: 'lofi_pulse', label: 'Harmonic Sine Pulse', desc: 'Rhythmic writing focus' }
              ].map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => (activeSound === snd.id ? stopAudio() : startAudio(snd.id))}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    activeSound === snd.id
                      ? 'border-amber-400 bg-amber-50 text-amber-900 font-semibold shadow-xs'
                      : 'border-neutral-200 bg-neutral-50/70 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <div className="font-semibold text-xs text-neutral-900">{snd.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{snd.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Micro-Tasks & Direct Writing Studio Jump (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Micro-Goal Checklist */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between font-sans">
              <h3 className="font-serif font-bold text-neutral-900 text-sm">
                Next 5-Minute Micro-Steps
              </h3>
              <span className="text-[10px] text-neutral-500 font-medium">
                {microTasks.filter((t) => t.completed).length}/{microTasks.length} done
              </span>
            </div>

            <div className="space-y-2">
              {microTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs transition-colors cursor-pointer ${
                    t.completed
                      ? 'border-emerald-200 bg-emerald-50/50 text-neutral-400 line-through'
                      : 'border-neutral-200 bg-neutral-50/70 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {t.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-neutral-400 shrink-0" />
                  )}
                  <span>{t.text}</span>
                </div>
              ))}
            </div>

            {/* Add Micro-Task Form */}
            <form onSubmit={handleAddMicroTask} className="flex gap-2 pt-1 font-sans">
              <input
                type="text"
                value={newMicroTask}
                onChange={(e) => setNewMicroTask(e.target.value)}
                placeholder="Add micro-step..."
                className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none shadow-xs"
              />
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-800 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Jump to Writing Studio */}
          {currentAssignment && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
              <h3 className="font-serif font-bold text-neutral-900 text-sm">
                Ready to Draft?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Take the momentum from this focus block directly into the TrueSelf Writing Studio.
              </p>
              <button
                onClick={() => onOpenWritingStudio(currentAssignment.id)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all cursor-pointer shadow-xs font-sans"
              >
                <span>Open Writing Studio for This Task</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
