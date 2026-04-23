"use client";

import { useEffect, useState } from "react";

const PREFIX = "order-processing";

function getStorageKeys(sessionKey: string) {
  return {
    start: `${PREFIX}-start-${sessionKey}`,
    id: `${PREFIX}-id-${sessionKey}`,
  };
}

/**
 * Returns a persistent session start timestamp for the processing countdown.
 * @param sessionKey - transferId for buy/withdraw flows, or "swap" for swap flow.
 *   Use undefined to disable (no session).
 * Survives tab close/reopen (sessionStorage) and navigation.
 */
export function useProcessingSession(
  sessionKey: string | undefined
): number | null {
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionKey) {
      setSessionStart(null);
      return;
    }

    try {
      const { start, id } = getStorageKeys(sessionKey);
      const stored = sessionStorage.getItem(start);
      const storedId = sessionStorage.getItem(id);

      const now = Date.now();

      // New session or different transfer – start fresh
      if (!stored || storedId !== sessionKey) {
        sessionStorage.setItem(start, String(now));
        sessionStorage.setItem(id, sessionKey);
        setSessionStart(now);
        return;
      }

      setSessionStart(parseInt(stored, 10));
    } catch {
      setSessionStart(null);
    }
  }, [sessionKey]);

  return sessionStart;
}

/**
 * Clears the processing session (e.g. when user completes or cancels).
 * @param sessionKey - Same key used for useProcessingSession (transferId or "swap").
 *   If omitted, clears legacy keys for backward compatibility.
 */
export function clearProcessingSession(sessionKey?: string) {
  try {
    if (sessionKey) {
      const { start, id } = getStorageKeys(sessionKey);
      sessionStorage.removeItem(start);
      sessionStorage.removeItem(id);
    } else {
      sessionStorage.removeItem(`${PREFIX}-session`);
      sessionStorage.removeItem(`${PREFIX}-transfer-id`);
    }
  } catch {
    // ignore
  }
}
