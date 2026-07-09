import { DomainError, DomainErrorCode } from "../errors/domain-error";

export function assertNonEmpty(value: string, message: DomainErrorCode): void {
  if (!value.trim()) {
    throw new DomainError(message);
  }
}

export function assertPositiveInteger(
  value: number,
  message: DomainErrorCode,
): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new DomainError(message);
  }
}

export function assertUniqueValues<T>(
  values: T[],
  message: DomainErrorCode,
): void {
  const uniqueValues = new Set(values);

  if (uniqueValues.size !== values.length) {
    throw new DomainError(message);
  }
}
