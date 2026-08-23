import type { CheckInStatus } from "../types/checkIn";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

export interface CreateCheckInResponse {
  requestId: string;
  attendeeId: string;
  status: CheckInStatus | "DUPLICATE";
  message?: string;
}

export interface CheckInStatusResponse {
  requestId: string;
  attendeeId: string;
  status: CheckInStatus | "DUPLICATE";
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/**
 * Creates an asynchronous check-in request.
 *
 * IMPORTANT:
 * This endpoint does NOT wait for the vendor to complete
 * the check-in. The backend creates a PENDING record and
 * publishes the request to RabbitMQ.
 *
 * Expected backend endpoint:
 * POST /api/check-ins
 */
export async function createCheckIn(
  attendeeId: string
): Promise<CreateCheckInResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/check-ins`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        attendeeId
      })
    }
  );

  if (!response.ok) {
    const error = await readApiError(response);

    throw new Error(
      error || `Check-in request failed with status ${response.status}`
    );
  }

  const data =
    (await response.json()) as CreateCheckInResponse;

  return data;
}

/**
 * Retrieves the current state of an asynchronous
 * check-in request.
 *
 * The kiosk calls this endpoint while the request
 * remains in the PENDING state.
 *
 * Expected backend endpoint:
 * GET /api/check-ins/:requestId
 */
export async function getCheckInStatus(
  requestId: string
): Promise<CheckInStatusResponse> {
  if (!requestId) {
    throw new Error("A requestId is required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/check-ins/${encodeURIComponent(
      requestId
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    const error = await readApiError(response);

    throw new Error(
      error ||
        `Unable to retrieve check-in status. HTTP ${response.status}`
    );
  }

  const data =
    (await response.json()) as CheckInStatusResponse;

  return data;
}

/**
 * Converts backend error responses into a useful
 * frontend error message.
 */
async function readApiError(
  response: Response
): Promise<string | null> {
  try {
    const data =
      (await response.json()) as ApiErrorResponse;

    return data.message || data.error || null;
  } catch {
    return null;
  }
}