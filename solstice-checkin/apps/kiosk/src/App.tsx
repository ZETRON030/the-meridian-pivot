import { useCallback, useEffect, useState } from "react";
import QRScanner from "./components/QRScanner";
import CheckInStatus from "./components/CheckInStatus";
import { createCheckIn } from "./api/checkInApi";
import { useCheckInStatus } from "./hooks/useCheckInStatus";
import type { CheckInStatus as CheckInStatusType } from "./types/checkIn";
import "./styles/kiosk.css";

type KioskState =
  | "READY"
  | "SCANNING"
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "DUPLICATE";

interface CheckInRequest {
  requestId: string;
  attendeeId: string;
  status: CheckInStatusType;
}

function App() {
  const [kioskState, setKioskState] = useState<KioskState>("READY");
  const [attendeeId, setAttendeeId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /*
   * The asynchronous status hook watches the backend after
   * the initial request has been accepted.
   *
   * It does NOT call the vendor directly.
   * The vendor communicates completion through our webhook.
   */
  const { status, resetPolling } = useCheckInStatus(
    requestId,
    
    useEffect(() => {
  if (kioskState !== "PENDING") {
    return;
  }

  if (status === "CONFIRMED") {
    setKioskState("CONFIRMED");
  } else if (status === "FAILED") {
    setKioskState("FAILED");
  }
}, [status, kioskState]);

  /*
   * Called when the QR scanner successfully reads a QR code.
   */
  const handleScan = useCallback(async (scannedAttendeeId: string) => {
    if (!scannedAttendeeId.trim()) {
      return;
    }

    /*
     * Prevent another scan from starting while the current
     * check-in is being processed.
     */
    if (
      kioskState === "PENDING" ||
      kioskState === "CONFIRMED" ||
      kioskState === "SCANNING"
    ) {
      return;
    }

    const normalizedAttendeeId = scannedAttendeeId.trim();

    setAttendeeId(normalizedAttendeeId);
    setErrorMessage(null);
    setKioskState("SCANNING");

    try {
      /*
       * IMPORTANT:
       *
       * The API returns PENDING after publishing the message
       * to RabbitMQ.
       *
       * It does NOT wait for the vendor.
       */
      const response: CheckInRequest = await createCheckIn(
        normalizedAttendeeId
      );

      setRequestId(response.requestId);

      /*
       * The UI enters PENDING immediately.
       *
       * "Checked In" is NOT displayed here.
       */
      if (response.status === "PENDING") {
        setKioskState("PENDING");
        return;
      }

      /*
       * If the backend identifies the attendee as already
       * processed, display the duplicate state.
       */
      if (response.status === "DUPLICATE") {
        setKioskState("DUPLICATE");
        return;
      }

      if (response.status === "CONFIRMED") {
        setKioskState("CONFIRMED");
        return;
      }

      setKioskState("FAILED");
      setErrorMessage("Unable to process this check-in.");
    } catch (error) {
      console.error("Check-in request failed:", error);

      setErrorMessage(
        "Unable to connect to the check-in service. Please try again."
      );

      setKioskState("FAILED");
    }
  }, [kioskState]);

  /*
   * Reset the kiosk to its initial READY state.
   */
  const handleReset = useCallback(() => {
    resetPolling();

    setKioskState("READY");
    setAttendeeId(null);
    setRequestId(null);
    setErrorMessage(null);
  }, [resetPolling]);

  return (
    <main className="kiosk-container">
      <section className="kiosk-card">
        <header className="kiosk-header">
          <h1>Solstice Events Co.</h1>
          <p>Tech Conference Check-In</p>
        </header>

        <section className="kiosk-content">
          {kioskState === "READY" && (
            <>
              <h2>Ready to Scan</h2>

              <p>
                Please scan your conference QR code to begin check-in.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => setKioskState("SCANNING")}
              >
                Start Scanner
              </button>
            </>
          )}

          {kioskState === "SCANNING" && (
            <>
              <h2>Scan Your QR Code</h2>

              <QRScanner onScan={handleScan} />
            </>
          )}

          {kioskState === "PENDING" && (
            <CheckInStatus
              status="PENDING"
              attendeeId={attendeeId ?? undefined}
              requestId={requestId ?? undefined}
            />
          )}

          {kioskState === "CONFIRMED" && (
            <>
              <CheckInStatus
                status="CONFIRMED"
                attendeeId={attendeeId ?? undefined}
                requestId={requestId ?? undefined}
              />

              <button
                type="button"
                className="primary-button"
                onClick={handleReset}
              >
                Check In Another Attendee
              </button>
            </>
          )}

          {kioskState === "DUPLICATE" && (
            <>
              <CheckInStatus
                status="DUPLICATE"
                attendeeId={attendeeId ?? undefined}
                requestId={requestId ?? undefined}
              />

              <button
                type="button"
                className="primary-button"
                onClick={handleReset}
              >
                Scan Another Attendee
              </button>
            </>
          )}

          {kioskState === "FAILED" && (
            <>
              <CheckInStatus
                status="FAILED"
                attendeeId={attendeeId ?? undefined}
                requestId={requestId ?? undefined}
              />

              {errorMessage && (
                <p className="error-message">{errorMessage}</p>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={handleReset}
              >
                Try Again
              </button>
            </>
          )}
        </section>

        <footer className="kiosk-footer">
          <small>Solstice Events Co. • Conference Check-In</small>
        </footer>
      </section>
    </main>
  );
}

export default App;