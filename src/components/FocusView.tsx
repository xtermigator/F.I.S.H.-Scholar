import React, { useEffect, useState } from "react";
import {
  HeartHandshake,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Plus,
  X,
  Check,
  Coffee,
  Volume2,
  VolumeX,
  Video,
  MessageSquareQuote,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import type { Assignment, Course } from "../types";
import { useBodyDouble } from "../state/useBodyDouble";
import { useFocusSound } from "../state/useFocusSound";
import {
  checkInIsDue,
  focusSecondsLeft,
  type BodyDoubleSession,
} from "../state/bodyDouble";

interface FocusViewProps {
  assignments: Assignment[];
  courses: Course[];
  initialAssignmentId?: string | null;
  initialMinutes?: number;
  onOpenWritingStudio: (assignmentId: string) => void;
  onOpenCompanionWithRole: (role: string) => void;
  onOpenAvatar?: () => void;
  onSelectAssignment?: (id: string) => void;
}

const SMALL_STARTS = [
  "Open the material I need",
  "Read one paragraph",
  "Write one rough sentence",
];
const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export const FocusView: React.FC<FocusViewProps> = ({
  assignments,
  courses,
  initialAssignmentId,
  initialMinutes = 20,
  onOpenWritingStudio,
  onOpenCompanionWithRole,
  onOpenAvatar,
  onSelectAssignment,
}) => {
  const { session, dispatch, now, loaded, saving, error, retrySave } =
    useBodyDouble(initialMinutes, initialAssignmentId ?? "");
  const [step, setStep] = useState("");
  const [distraction, setDistraction] = useState("");
  const [voice, setVoice] = useState(false);
  const [quietView, setQuietView] = useState(false);
  const audio = useFocusSound();
  const left = focusSecondsLeft(session, now);
  const checkInDue = checkInIsDue(session, now);
  const locked = session.status === "running" || session.status === "paused";
  const assignment = assignments.find(
    (item) => item.id === session.assignmentId,
  );
  const course = courses.find((item) => item.id === assignment?.courseId);
  const completed = session.steps.filter((item) => item.completed).length;
  const activeStep = session.steps.find((item) => !item.completed);
  const elapsed = session.durationSeconds - left;
  const progress = Math.round((elapsed / session.durationSeconds) * 100);
  const configure = (
    patch: Partial<
      Pick<
        BodyDoubleSession,
        "goal" | "assignmentId" | "tone" | "checkInSeconds"
      >
    >,
  ) => dispatch({ type: "configure", patch, now: Date.now() });

  useEffect(() => {
    if (loaded && assignment) onSelectAssignment?.(assignment.id);
  }, [loaded, assignment?.id, onSelectAssignment]);

  const prompt = checkInDue
    ? "A gentle check-in. How is this block going?"
    : session.tone === "quiet" && session.status === "running"
      ? "Working quietly. Your timer and next step are here."
      : session.tone === "encouraging" && session.status === "running"
        ? "Keep returning to the next small step. You can adjust your pace as you go."
        : session.message;
  useEffect(() => {
    if (!voice || !loaded || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [voice, prompt, loaded]);

  const addStep = (text: string) => {
    if (!text.trim()) return;
    dispatch({ type: "add-step", id: crypto.randomUUID(), text });
    setStep("");
  };
  const chooseAssignment = (id: string) => {
    const target = assignments.find((item) => item.id === id);
    configure({ assignmentId: id, goal: target?.title ?? session.goal });
    if (target) onSelectAssignment?.(target.id);
  };

  const goalSetup = (
    <div className="workspace-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-[#193e37]">One thing for now</h2>
        {locked && (
          <span className="text-[10px] text-neutral-500">
            Finish this block to change its goal
          </span>
        )}
      </div>
      <label
        htmlFor="focus-assignment"
        className="block text-xs font-semibold text-neutral-600"
      >
        Link a course task
        <select
          id="focus-assignment"
          disabled={locked || !loaded}
          value={session.assignmentId}
          onChange={(event) => chooseAssignment(event.target.value)}
          className="workspace-input mt-2"
        >
          <option value="">Open work · no linked assignment</option>
          {session.assignmentId && !assignment && (
            <option value={session.assignmentId}>
              Previously linked task · unavailable
            </option>
          )}
          {assignments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      {course && (
        <p className="text-xs text-neutral-500">
          {course.code}
          {course.title ? ` · ${course.title}` : ""}
        </p>
      )}
      <label
        htmlFor="focus-goal"
        className="block text-xs font-semibold text-neutral-600"
      >
        For this block, I want to…
        <input
          id="focus-goal"
          disabled={locked || !loaded}
          value={session.goal}
          onChange={(event) => configure({ goal: event.target.value })}
          className="workspace-input mt-2"
          placeholder="Read one article and capture its main finding"
        />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="Focus block duration">
        {[5, 10, 20, 45].map((minutes) => (
          <button
            key={minutes}
            disabled={session.status !== "ready" || !loaded}
            aria-pressed={session.durationSeconds === minutes * 60}
            onClick={() => dispatch({ type: "duration", minutes })}
            className={`workspace-button ${session.durationSeconds === minutes * 60 ? "workspace-button-primary" : ""}`}
          >
            {minutes} min
          </button>
        ))}
      </div>
      {session.status === "paused" && (
        <button
          className="workspace-button"
          onClick={() => dispatch({ type: "reset" })}
        >
          <RotateCcw className="h-4 w-4" />
          Reset this block
        </button>
      )}
      {assignment && (
        <button
          className="workspace-button"
          onClick={() => onOpenWritingStudio(assignment.id)}
        >
          Open writing for this task <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <section
      aria-labelledby="body-double-heading"
      className="mx-auto max-w-6xl space-y-6 pb-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="workspace-eyebrow">Focus & company</p>
          <h1 id="body-double-heading" className="workspace-title">
            A little company. One small step.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Settle into your work with a guided body double, at a pace you
            choose.
          </p>
        </div>
        <button
          onClick={() => setQuietView((value) => !value)}
          aria-pressed={quietView}
          className="workspace-button"
        >
          {quietView ? "Show session tools" : "Simplify view"}
        </button>
      </header>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="flex-1">{error}</p>
          <button className="workspace-button" onClick={retrySave}>
            Try saving again
          </button>
        </div>
      )}
      {!loaded && (
        <p role="status" className="text-sm text-neutral-600">
          {error
            ? "Your session is waiting for recovery."
            : "Loading your session…"}
        </p>
      )}

      <div
        className={`grid items-start gap-6 ${quietView ? "" : "xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"}`}
      >
        <div className="min-w-0 space-y-5">
          {quietView && session.status === "ready" && goalSetup}
          <div className="workspace-hero p-6 text-white sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs text-teal-50">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                FISH body double
              </span>
              <span className="text-[10px] text-teal-50/80">
                Guided prompts on this device
              </span>
            </div>
            <p
              className="mt-5 min-h-12 max-w-lg font-serif text-xl leading-relaxed sm:text-2xl"
              role="status"
              aria-live="polite"
            >
              {prompt}
            </p>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-50/80">
                {session.status === "complete"
                  ? "Block finished"
                  : session.status === "running"
                    ? "Time for this step"
                    : session.status === "paused"
                      ? "Your place is held"
                      : "Your focus block"}
              </p>
              <div
                role="timer"
                aria-label="Time remaining"
                aria-live="off"
                className="mt-3 font-mono text-6xl leading-none tracking-tight text-[#eff6df] sm:text-7xl"
              >
                {formatTime(left)}
              </div>
              <div
                role="progressbar"
                aria-label="Focus block progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="h-full rounded-full bg-[#d6e8b9]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {session.goal && (
                <p className="mt-5 break-words text-sm font-semibold leading-6">
                  {session.goal}
                </p>
              )}
              {activeStep && (
                <p className="mt-2 break-words text-xs leading-5 text-teal-50/85">
                  Next step — {activeStep.text}
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {session.status === "running" ? (
                <button
                  disabled={!loaded}
                  onClick={() => dispatch({ type: "pause", now: Date.now() })}
                  className="workspace-button"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              ) : session.status === "complete" ? (
                <button
                  disabled={!loaded}
                  onClick={() => dispatch({ type: "reset" })}
                  className="workspace-button"
                >
                  <RotateCcw className="h-4 w-4" />
                  Another block
                </button>
              ) : (
                <button
                  disabled={!loaded || !session.goal.trim()}
                  onClick={() => dispatch({ type: "start", now: Date.now() })}
                  className="workspace-button"
                >
                  <Play className="h-4 w-4" />
                  {session.status === "paused"
                    ? "Resume together"
                    : "Begin together"}
                </button>
              )}
              {locked && (
                <>
                  <button
                    onClick={() =>
                      dispatch({
                        type: "check-in",
                        response: "stuck",
                        now: Date.now(),
                      })
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 text-xs text-white hover:bg-white/10"
                  >
                    <HeartHandshake className="h-4 w-4" />
                    I’m stuck
                  </button>
                  <button
                    onClick={() =>
                      dispatch({ type: "finish", now: Date.now() })
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 text-xs text-white hover:bg-white/10"
                  >
                    <Check className="h-4 w-4" />
                    Finish & reflect
                  </button>
                </>
              )}
            </div>
            {!session.goal.trim() && (
              <p className="mt-3 text-xs text-teal-50/80">
                Add a small goal below to begin.
              </p>
            )}
            <p className="mt-4 text-[10px] text-teal-50/80">
              {saving
                ? "Saving your place…"
                : loaded && !error
                  ? "Session saved on this device · resumes after a refresh"
                  : "Session not yet saved"}
            </p>
          </div>

          {checkInDue && (
            <div
              className="workspace-card border-teal-300 bg-[#eff4e6]"
              aria-label="Session check-in"
            >
              <h2 className="font-serif text-xl text-[#193e37]">
                How is this block going?
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Keep your rhythm, ask for a smaller step, or come back to this
                in a minute.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    dispatch({
                      type: "check-in",
                      response: "on-track",
                      now: Date.now(),
                    })
                  }
                  className="workspace-button workspace-button-primary"
                >
                  On track
                </button>
                <button
                  onClick={() =>
                    dispatch({
                      type: "check-in",
                      response: "stuck",
                      now: Date.now(),
                    })
                  }
                  className="workspace-button"
                >
                  Make it smaller
                </button>
                <button
                  onClick={() =>
                    dispatch({
                      type: "check-in",
                      response: "later",
                      now: Date.now(),
                    })
                  }
                  className="workspace-button"
                >
                  In a minute
                </button>
              </div>
            </div>
          )}

          {session.status === "paused" && (
            <div className="workspace-card">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-teal-800" />
                <h2 className="font-serif text-xl text-[#193e37]">
                  A gentler way back
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Take a breath. Choose something small enough to do in two
                minutes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SMALL_STARTS.map((text) => (
                  <button
                    key={text}
                    onClick={() => addStep(text)}
                    className="workspace-button"
                  >
                    <Plus className="h-3 w-3" />
                    {text}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Your timer stays paused until you choose Resume together.
              </p>
            </div>
          )}

          {session.status === "complete" && (
            <div className="workspace-card">
              <h2 className="flex items-center gap-2 font-serif text-2xl text-[#193e37]">
                <CheckCircle2 className="h-5 w-5 text-teal-700" />
                Notice the progress
              </h2>
              <p className="mt-3 text-sm text-neutral-600">
                {Math.floor(elapsed / 60)} minutes focused · {completed} of{" "}
                {session.steps.length} session steps checked ·{" "}
                {session.completedBlocks} blocks finished
              </p>
              <label
                htmlFor="focus-reflection"
                className="mt-5 block text-xs font-semibold text-neutral-600"
              >
                What moved forward? What will help next time?
              </label>
              <textarea
                id="focus-reflection"
                rows={3}
                className="workspace-input mt-2"
                value={session.reflection}
                onChange={(event) =>
                  dispatch({ type: "reflection", text: event.target.value })
                }
                placeholder="A sentence, a source found, a question clarified…"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Your reflection saves with this block until you begin another.
              </p>
            </div>
          )}

          {quietView && session.status !== "ready" && goalSetup}
        </div>

        {!quietView && (
          <div className="min-w-0 space-y-5">
            {goalSetup}
            <div className="workspace-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl text-[#193e37]">
                  Your next small steps
                </h2>
                <span className="text-xs text-neutral-500">
                  {completed}/{session.steps.length}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                A checklist for this session. Assignment submission stays in
                your coursework.
              </p>
              {session.steps.length ? (
                <ul className="mt-4 space-y-2">
                  {session.steps.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-[#dfe6df] bg-[#f8faf5] p-3"
                    >
                      <input
                        type="checkbox"
                        disabled={!loaded}
                        checked={item.completed}
                        onChange={() =>
                          dispatch({ type: "toggle-step", id: item.id })
                        }
                        aria-label={item.text}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-teal-800"
                      />
                      <span
                        className={`min-w-0 flex-1 break-words text-sm leading-6 ${item.completed ? "text-neutral-500 line-through" : "text-neutral-800"}`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() =>
                          dispatch({ type: "remove-step", id: item.id })
                        }
                        aria-label={`Remove step ${item.text}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl bg-[#f4f7ed] p-4 text-sm leading-6 text-neutral-600">
                  What is the smallest visible action you can take?
                </p>
              )}
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  addStep(step);
                }}
              >
                <label htmlFor="new-focus-step" className="sr-only">
                  New session step
                </label>
                <input
                  id="new-focus-step"
                  disabled={!loaded}
                  value={step}
                  onChange={(event) => setStep(event.target.value)}
                  className="workspace-input"
                  placeholder="Add a small step"
                />
                <button
                  type="submit"
                  disabled={!loaded || !step.trim()}
                  className="workspace-button"
                  aria-label="Add session step"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              {assignment?.checklist.length ? (
                <button
                  className="workspace-button mt-3"
                  disabled={!loaded}
                  onClick={() =>
                    assignment.checklist
                      .filter(
                        (item) =>
                          !item.completed &&
                          !session.steps.some(
                            (existing) => existing.text === item.text,
                          ),
                      )
                      .forEach((item) => addStep(item.text))
                  }
                >
                  Bring in unfinished assignment steps
                </button>
              ) : null}
            </div>

            <div className="workspace-card space-y-4">
              <h2 className="font-serif text-xl text-[#193e37]">
                Company, your way
              </h2>
              <label
                className="block text-xs font-semibold text-neutral-600"
                htmlFor="checkin-cadence"
              >
                Gentle check-ins
                <select
                  id="checkin-cadence"
                  disabled={!loaded}
                  value={session.checkInSeconds}
                  onChange={(event) =>
                    configure({ checkInSeconds: Number(event.target.value) })
                  }
                  className="workspace-input mt-2"
                >
                  <option value={0}>Only when I ask</option>
                  <option value={120}>Every 2 minutes</option>
                  <option value={300}>Every 5 minutes</option>
                  <option value={600}>Every 10 minutes</option>
                </select>
              </label>
              <label
                className="block text-xs font-semibold text-neutral-600"
                htmlFor="companion-tone"
              >
                Companion style
                <select
                  id="companion-tone"
                  disabled={!loaded}
                  value={session.tone}
                  onChange={(event) =>
                    configure({
                      tone: event.target.value as BodyDoubleSession["tone"],
                    })
                  }
                  className="workspace-input mt-2"
                >
                  <option value="quiet">Quiet company</option>
                  <option value="gentle">Gentle guidance</option>
                  <option value="encouraging">Encouraging</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={voice}
                  disabled={
                    typeof window === "undefined" ||
                    !("speechSynthesis" in window)
                  }
                  onChange={(event) => setVoice(event.target.checked)}
                  className="h-5 w-5 accent-teal-800"
                />
                Read companion prompts aloud
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onOpenCompanionWithRole("body_double")}
                  className="workspace-button"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  Talk it through
                </button>
                {onOpenAvatar && (
                  <button onClick={onOpenAvatar} className="workspace-button">
                    <Video className="h-4 w-4" />
                    Open live avatar
                  </button>
                )}
              </div>
            </div>

            <div className="workspace-card">
              <h2 className="flex items-center gap-2 font-serif text-xl text-[#193e37]">
                <Bookmark className="h-5 w-5" />
                Park it for later
              </h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Capture the thought without following it away from your task.
              </p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (distraction.trim()) {
                    dispatch({
                      type: "park",
                      id: crypto.randomUUID(),
                      text: distraction,
                    });
                    setDistraction("");
                  }
                }}
              >
                <label htmlFor="parked-thought" className="sr-only">
                  Thought to park for later
                </label>
                <input
                  id="parked-thought"
                  disabled={!loaded}
                  value={distraction}
                  onChange={(event) => setDistraction(event.target.value)}
                  className="workspace-input"
                  placeholder="I’ll come back to…"
                />
                <button
                  type="submit"
                  disabled={!loaded || !distraction.trim()}
                  className="workspace-button"
                  aria-label="Park thought"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
              <ul className="mt-3 space-y-2">
                {session.parked.map((idea) => (
                  <li
                    key={idea.id}
                    className="flex items-center gap-2 rounded-lg bg-[#f4f7ed] px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 break-words">
                      {idea.text}
                    </span>
                    <button
                      onClick={() =>
                        dispatch({ type: "remove-parked", id: idea.id })
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-500"
                      aria-label={`Remove parked thought ${idea.text}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="workspace-card">
              <h2 className="flex items-center gap-2 font-serif text-xl text-[#193e37]">
                <Volume2 className="h-5 w-5" />A little background sound
              </h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Optional, at a low volume. Sound stops when you leave this view.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { id: "brown", label: "Brown noise" },
                    { id: "hum", label: "Gentle hum" },
                    { id: "pulse", label: "Slow pulse" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={audio.sound === item.id}
                    onClick={() => void audio.play(item.id)}
                    className={`workspace-button ${audio.sound === item.id ? "workspace-button-primary" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
                {audio.sound && (
                  <button onClick={audio.stop} className="workspace-button">
                    <VolumeX className="h-4 w-4" />
                    Silence
                  </button>
                )}
              </div>
              {audio.error && (
                <p role="alert" className="mt-3 text-xs text-red-700">
                  {audio.error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
