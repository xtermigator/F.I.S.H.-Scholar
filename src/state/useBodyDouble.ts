import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createRepository } from "../data/repository";
import type { EntityBase } from "../types";
import {
  bodyDoubleReducer,
  newBodyDouble,
  readBodyDouble,
  focusSecondsLeft,
  type BodyDoubleSession,
} from "./bodyDouble";

interface SessionSetting extends EntityBase {
  value: BodyDoubleSession;
}
const SESSION_ID = "personal-body-double-v1";

export function useBodyDouble(minutes: number, assignmentId: string) {
  const repository = useMemo(() => createRepository(), []);
  const [session, dispatch] = useReducer(bodyDoubleReducer, undefined, () =>
    newBodyDouble(minutes, assignmentId),
  );
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now);
  const writes = useRef(Promise.resolve());
  const revision = useRef(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    repository
      .get<SessionSetting>("settings", SESSION_ID)
      .then((record) => {
        if (cancelled) return;
        const restored = readBodyDouble(record?.value);
        if (restored) dispatch({ type: "restore", session: restored });
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Saved session could not be loaded. Retry before starting a new block.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repository, retry]);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const writeRevision = ++revision.current;
    setSaving(true);
    writes.current = writes.current
      .catch(() => {})
      .then(async () => {
        await repository.put("settings", { id: SESSION_ID, value: session });
      });
    writes.current
      .then(() => {
        if (!cancelled && revision.current === writeRevision) {
          setSaving(false);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled && revision.current === writeRevision) {
          setSaving(false);
          setError(
            "This session could not be saved. Keep the page open and try saving again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session, repository, loaded]);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 500);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (
      loaded &&
      session.status === "running" &&
      focusSecondsLeft(session, now) === 0
    )
      dispatch({ type: "finish", now });
  }, [session, now, loaded]);

  return {
    session,
    dispatch,
    now,
    loaded,
    saving,
    error,
    retrySave: () =>
      loaded
        ? dispatch({ type: "restore", session: { ...session } })
        : setRetry((value) => value + 1),
  };
}
