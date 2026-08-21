"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth-actions";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_WARNING_SECONDS,
} from "@/lib/sessionConfig";

const IDLE_LIMIT_MS = SESSION_MAX_AGE_SECONDS * 1000;
const WARNING_MS = SESSION_WARNING_SECONDS * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

export default function IdleTimeoutWarning() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(0);
  const warningShownRef = useRef(false);
  const signingOutRef = useRef(false);

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (warningShownRef.current) {
      warningShownRef.current = false;
      setSecondsLeft(null);
      // Touches the session so the server-side expiry rolls forward too.
      fetch("/api/auth/session").catch(() => {});
    }
  }, []);

  useEffect(() => {
    lastActivityRef.current = Date.now();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, recordActivity);
      }
    };
  }, [recordActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      const remaining = IDLE_LIMIT_MS - idleFor;

      if (remaining <= 0) {
        if (!signingOutRef.current) {
          signingOutRef.current = true;
          signOutAction();
        }
        return;
      }

      if (remaining <= WARNING_MS) {
        warningShownRef.current = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (secondsLeft === null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 border-t border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <span>
        You&apos;ll be signed out in {secondsLeft} second
        {secondsLeft === 1 ? "" : "s"} due to inactivity.
      </span>
      <button
        type="button"
        onClick={recordActivity}
        className="rounded bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
      >
        Stay signed in
      </button>
    </div>
  );
}
