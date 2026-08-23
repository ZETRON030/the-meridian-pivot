export type CheckInStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED";

export type KioskCheckInStatus =
  | CheckInStatus
  | "DUPLICATE";

export interface CreateCheckInRequest {
  attendeeId: string;
}

export interface CreateCheckInResponse {
  requestId: string;
  attendeeId: string;
  status: KioskCheckInStatus;
  message?: string;
}

export interface CheckInStatusResponse {
  requestId: string;
  attendeeId: string;
  status: KioskCheckInStatus;
  message?: string;
}