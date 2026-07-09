import type { ApplicationErrorCode } from "./application-error";

export const applicationErrorMessagesPtBr: Record<
  ApplicationErrorCode,
  string
> = {
  ACTIVITY_NOT_FOUND: "Não encontramos esta atividade.",
};

export function getApplicationErrorMessagePtBr(
  code: ApplicationErrorCode,
): string {
  return applicationErrorMessagesPtBr[code];
}
