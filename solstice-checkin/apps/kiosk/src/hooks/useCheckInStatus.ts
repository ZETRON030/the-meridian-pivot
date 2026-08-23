import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCheckInStatus
} from "../api/checkInApi";
import type {
  CheckInStatus
} from "../types/checkIn";

interface UseCheckInStatusResult {
  status: CheckInStatus | null;
  error: string | null;
  isPolling: boolean;
  resetPolling: () => void;
}

const POLLING_INTERVAL_MS = Number(
  import.meta.env.VITE_CHECKIN_STATUS_POLL_INTERVAL_MS || 2000
);

const MAX_PENDING_TIME_MS = Number(
  import.meta.env.VITE_CHECKIN_PENDING_TIMEOUT_MS || 120000
);

export function useCheckInStatus(
  requestId: string | null,
  enabled: boolean
): UseCheckInStatusResult {
  const [status, setStatus] =
    useState<CheckInStatus | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isPolling, setIsPolling] =
    useState(false);

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const stoppedRef =
    useRef(false);

  /*
   * Stop all polling activity.
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsPolling(false);
  }, []);

  /*
   * Reset the hook when the kiosk starts another
   * attendee check-in.
   */
  const resetPolling = useCallback(() => {
    stoppedRef.current = true;

    stopPolling();

    setStatus(null);
    setError(null);

    /*
     * Allow the next requestId/enabled cycle to start
     * a new polling session.
     */
    window.setTimeout(() => {
      stoppedRef.current = false;
    }, 0);
  }, [stopPolling]);

  useEffect(() => {
    if (!enabled || !requestId) {
      stopPolling();
      return;
    }

    stoppedRef.current = false;
    setStatus("PENDING");
    setError(null);
    setIsPolling(true);

    const poll = async () => {
      if (stoppedRef.current) {
        return;
      }

      try {
        const response =
          await getCheckInStatus(requestId);

        if (stoppedRef.current) {
          return;
        }

        setStatus(response.status);

        /*
         * The backend has received and processed the
         * vendor webhook.
         *
         * Stop polling once the request reaches a
         * terminal state.
         */
        if (
          response.status === "CONFIRMED" ||
          response.status === "FAILED"
        ) {
          stopPolling();
        }
      } catch (pollError) {
        console.error(
          "Unable to retrieve check-in status:",
          pollError
        );

        if (!stoppedRef.current) {
          setError(
            pollError instanceof Error
              ? pollError.message
              : "Unable to retrieve check-in status."
          );
        }
      }
    };

    /*
     * Check immediately rather than waiting for the
     * first polling interval.
     */
    void poll();

    intervalRef.current = setInterval(
      () => {
        void poll();
      },
      POLLING_INTERVAL_MS
    );

    /*
     * Prevent a kiosk from remaining in PENDING forever
     * if the vendor never sends a webhook.
     */
    timeoutRef.current = setTimeout(() => {
      if (stoppedRef.current) {
        return;
      }

      setError(
        "The check-in confirmation is taking longer than expected."
      );

      stopPolling();
    }, MAX_PENDING_TIME_MS);

    return () => {
      stoppedRef.current = true;
      stopPolling();
    };
  }, [
    requestId,
    enabled,
    stopPolling
  ]);

  return {
    status,
    error,
    isPolling,
    resetPolling
  };
}