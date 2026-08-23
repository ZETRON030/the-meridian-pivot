import type { CheckInStatus as CheckInStatusType } from "../types/checkIn";

interface CheckInStatusProps {
  status: CheckInStatusType | "DUPLICATE";
  attendeeId?: string;
  requestId?: string;
}

function CheckInStatus({
  status,
  attendeeId,
  requestId
}: CheckInStatusProps) {
  switch (status) {
    case "PENDING":
      return (
        <section
          className="check-in-status pending"
          aria-live="polite"
        >
          <div className="status-icon pending-icon">
            <span>...</span>
          </div>

          <h2>Check-in Pending</h2>

          <p>
            Your check-in request has been received.
          </p>

          <p>
            Please wait while we confirm your attendance.
          </p>

          {attendeeId && (
            <p className="attendee-reference">
              Attendee: {attendeeId}
            </p>
          )}
        </section>
      );

    case "CONFIRMED":
      return (
        <section
          className="check-in-status confirmed"
          aria-live="assertive"
        >
          <div className="status-icon success-icon">
            ✓
          </div>

          <h2>Checked In</h2>

          <p>
            Your conference check-in has been confirmed.
          </p>

          {attendeeId && (
            <p className="attendee-reference">
              Attendee: {attendeeId}
            </p>
          )}
        </section>
      );

    case "FAILED":
      return (
        <section
          className="check-in-status failed"
          role="alert"
        >
          <div className="status-icon error-icon">
            !
          </div>

          <h2>Check-in Failed</h2>

          <p>
            We could not confirm your check-in.
          </p>

          <p>
            Please try scanning your QR code again.
          </p>

          {attendeeId && (
            <p className="attendee-reference">
              Attendee: {attendeeId}
            </p>
          )}
        </section>
      );

    case "DUPLICATE":
      return (
        <section
          className="check-in-status duplicate"
          role="alert"
        >
          <div className="status-icon duplicate-icon">
            ✓
          </div>

          <h2>Already Checked In</h2>

          <p>
            This attendee has already been checked in.
          </p>

          {attendeeId && (
            <p className="attendee-reference">
              Attendee: {attendeeId}
            </p>
          )}
        </section>
      );

    default:
      return null;
  }
}

export default CheckInStatus;