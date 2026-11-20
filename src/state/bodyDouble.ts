export interface FocusStep {
  id: string;
  text: string;
  completed: boolean;
}
export type CompanionTone = "quiet" | "gentle" | "encouraging";
export interface BodyDoubleSession {
  version: 1;
  status: "ready" | "running" | "paused" | "complete";
  assignmentId: string;
  goal: string;
  durationSeconds: number;
  remainingSeconds: number;
  deadline: number | null;
  checkInSeconds: number;
  nextCheckIn: number;
  tone: CompanionTone;
  steps: FocusStep[];
  parked: { id: string; text: string }[];
  message: string;
  reflection: string;
  completedBlocks: number;
}

export function newBodyDouble(
  minutes = 20,
  assignmentId = "",
): BodyDoubleSession {
  const durationSeconds = Math.max(1, Math.min(90, Math.round(minutes))) * 60;
  return {
    version: 1,
    status: "ready",
    assignmentId,
    goal: "",
    durationSeconds,
    remainingSeconds: durationSeconds,
    deadline: null,
    checkInSeconds: 300,
    nextCheckIn: 300,
    tone: "gentle",
    steps: [],
    parked: [],
    message: "Choose one small thing to work on. We can begin there.",
    reflection: "",
    completedBlocks: 0,
  };
}

/** A deadline survives inactive tabs and refreshes without slowing the clock. */
export function focusSecondsLeft(
  session: BodyDoubleSession,
  now: number,
): number {
  return session.status === "running" && session.deadline !== null
    ? Math.max(
        0,
        Math.min(
          session.durationSeconds,
          Math.ceil((session.deadline - now) / 1000),
        ),
      )
    : session.remainingSeconds;
}

export function checkInIsDue(session: BodyDoubleSession, now: number): boolean {
  return (
    session.status === "running" &&
    session.checkInSeconds > 0 &&
    focusSecondsLeft(session, now) > 0 &&
    session.durationSeconds - focusSecondsLeft(session, now) >=
      session.nextCheckIn
  );
}

export type BodyDoubleAction =
  | { type: "restore"; session: BodyDoubleSession }
  | {
      type: "configure";
      now: number;
      patch: Partial<
        Pick<
          BodyDoubleSession,
          "assignmentId" | "goal" | "tone" | "checkInSeconds"
        >
      >;
    }
  | { type: "duration"; minutes: number }
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "reset" }
  | { type: "finish"; now: number }
  | { type: "check-in"; response: "on-track" | "stuck" | "later"; now: number }
  | { type: "add-step"; id: string; text: string }
  | { type: "toggle-step"; id: string }
  | { type: "remove-step"; id: string }
  | { type: "park"; id: string; text: string }
  | { type: "remove-parked"; id: string }
  | { type: "reflection"; text: string };

export function bodyDoubleReducer(
  session: BodyDoubleSession,
  action: BodyDoubleAction,
): BodyDoubleSession {
  switch (action.type) {
    case "restore":
      return action.session;
    case "configure": {
      const patch = { ...action.patch };
      if (session.status === "running" || session.status === "paused") {
        delete patch.assignmentId;
        delete patch.goal;
      }
      return {
        ...session,
        ...patch,
        nextCheckIn:
          patch.checkInSeconds !== undefined
            ? session.durationSeconds -
              focusSecondsLeft(session, action.now) +
              patch.checkInSeconds
            : session.nextCheckIn,
      };
    }
    case "duration":
      if (session.status !== "ready") return session;
      return {
        ...session,
        durationSeconds:
          Math.max(1, Math.min(90, Math.round(action.minutes))) * 60,
        remainingSeconds:
          Math.max(1, Math.min(90, Math.round(action.minutes))) * 60,
      };
    case "start":
      if (!session.goal.trim() || !["ready", "paused"].includes(session.status))
        return session;
      return {
        ...session,
        status: "running",
        deadline: action.now + session.remainingSeconds * 1000,
        message:
          session.status === "paused"
            ? "Welcome back. Pick up with just the next small step."
            : "Your block has started. One step is enough for now.",
      };
    case "pause": {
      if (session.status !== "running") return session;
      const remainingSeconds = focusSecondsLeft(session, action.now);
      if (!remainingSeconds)
        return bodyDoubleReducer(session, { type: "finish", now: action.now });
      return {
        ...session,
        status: "paused",
        deadline: null,
        remainingSeconds,
        message: "Take the space you need. Your place is saved.",
      };
    }
    case "reset":
      return {
        ...session,
        status: "ready",
        remainingSeconds: session.durationSeconds,
        deadline: null,
        nextCheckIn: session.checkInSeconds,
        reflection: "",
        message: "A fresh block. Choose what feels manageable now.",
      };
    case "finish":
      if (!["running", "paused"].includes(session.status)) return session;
      return {
        ...session,
        status: "complete",
        remainingSeconds: focusSecondsLeft(session, action.now),
        deadline: null,
        completedBlocks: session.completedBlocks + 1,
        message:
          "You made time for your work. Notice what moved forward, then decide what comes next.",
      };
    case "check-in": {
      if (!["running", "paused"].includes(session.status)) return session;
      const remainingSeconds = focusSecondsLeft(session, action.now);
      const nextCheckIn =
        session.durationSeconds -
        remainingSeconds +
        (action.response === "later" ? 60 : session.checkInSeconds);
      return {
        ...session,
        remainingSeconds,
        nextCheckIn,
        ...(action.response === "stuck"
          ? { status: "paused" as const, deadline: null }
          : {}),
        message:
          action.response === "stuck"
            ? "Let’s make this smaller. Choose a two-minute step, or take a pause."
            : action.response === "on-track"
              ? "Keep going at your pace. Your next step is enough."
              : "Check-in moved one minute ahead. Keep your space.",
      };
    }
    case "add-step":
      return action.text.trim()
        ? {
            ...session,
            steps: [
              ...session.steps,
              { id: action.id, text: action.text.trim(), completed: false },
            ],
          }
        : session;
    case "toggle-step":
      return {
        ...session,
        steps: session.steps.map((step) =>
          step.id === action.id
            ? { ...step, completed: !step.completed }
            : step,
        ),
      };
    case "remove-step":
      return {
        ...session,
        steps: session.steps.filter((step) => step.id !== action.id),
      };
    case "park":
      return action.text.trim()
        ? {
            ...session,
            parked: [
              ...session.parked,
              { id: action.id, text: action.text.trim() },
            ],
          }
        : session;
    case "remove-parked":
      return {
        ...session,
        parked: session.parked.filter((idea) => idea.id !== action.id),
      };
    case "reflection":
      return { ...session, reflection: action.text };
  }
}

/** Reject malformed stored state without starting a timer or audio unexpectedly. */
export function readBodyDouble(value: unknown): BodyDoubleSession | null {
  if (!value || typeof value !== "object") return null;
  const item = value as BodyDoubleSession;
  if (
    item.version !== 1 ||
    !["ready", "running", "paused", "complete"].includes(item.status)
  )
    return null;
  if (
    !Number.isInteger(item.durationSeconds) ||
    item.durationSeconds < 60 ||
    item.durationSeconds > 5400
  )
    return null;
  if (
    !Number.isFinite(item.remainingSeconds) ||
    item.remainingSeconds < 0 ||
    item.remainingSeconds > item.durationSeconds
  )
    return null;
  if (
    item.status === "running" &&
    (!Number.isFinite(item.deadline) || item.deadline === null)
  )
    return null;
  if (
    typeof item.goal !== "string" ||
    typeof item.assignmentId !== "string" ||
    typeof item.reflection !== "string" ||
    typeof item.message !== "string"
  )
    return null;
  if (
    ![0, 120, 300, 600].includes(item.checkInSeconds) ||
    !Number.isFinite(item.nextCheckIn) ||
    item.nextCheckIn < 0
  )
    return null;
  if (
    !["quiet", "gentle", "encouraging"].includes(item.tone) ||
    !Number.isInteger(item.completedBlocks) ||
    item.completedBlocks < 0
  )
    return null;
  if (
    !Array.isArray(item.steps) ||
    !item.steps.every(
      (step) =>
        step &&
        typeof step.id === "string" &&
        typeof step.text === "string" &&
        typeof step.completed === "boolean",
    )
  )
    return null;
  if (
    !Array.isArray(item.parked) ||
    !item.parked.every(
      (idea) =>
        idea && typeof idea.id === "string" && typeof idea.text === "string",
    )
  )
    return null;
  return item;
}
