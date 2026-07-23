export class StorageDataError extends Error {
  readonly key: string;
  override readonly cause: unknown;

  constructor(key: string, cause?: unknown) {
    super(`Stored data is invalid for key "${key}".`);
    this.name = "StorageDataError";
    this.key = key;
    this.cause = cause;
  }
}
