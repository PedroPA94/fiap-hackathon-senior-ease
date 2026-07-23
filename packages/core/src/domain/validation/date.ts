import { DomainError, type DomainErrorCode } from "../errors/index.js";
import type { DateOnlyString, TimeString } from "../types/index.js";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

export function normalizeDateOnly(
  value: string,
  code: DomainErrorCode,
): DateOnlyString {
  const normalizedValue = value.trim();

  if (!dateOnlyPattern.test(normalizedValue)) {
    throw new DomainError(code);
  }

  return normalizedValue;
}

export function normalizeOptionalTime(
  value: string | undefined,
  code: DomainErrorCode,
): TimeString | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (!timePattern.test(normalizedValue)) {
    throw new DomainError(code);
  }

  return normalizedValue;
}
