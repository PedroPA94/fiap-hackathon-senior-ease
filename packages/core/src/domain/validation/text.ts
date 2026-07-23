import { DomainError, type DomainErrorCode } from "../errors/index.js";

export function normalizeRequiredText(
  value: string,
  code: DomainErrorCode,
): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(code);
  }

  return normalizedValue;
}

export function normalizeOptionalText(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}
