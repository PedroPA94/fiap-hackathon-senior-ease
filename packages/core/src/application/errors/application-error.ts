export type ApplicationErrorCode =
  | "ACTIVITY_NOT_FOUND"
  | "USER_PROFILE_NOT_FOUND";

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message = code,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
