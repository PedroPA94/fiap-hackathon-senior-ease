import type { ApplicationErrorCode } from "./application-error";

export const applicationErrorMessagesPtBr: Record<
  ApplicationErrorCode,
  string
> = {
  ACTIVITY_NOT_FOUND: "Não encontramos esta atividade.",
  USER_PROFILE_NOT_FOUND: "Não encontramos este perfil de usuário.",
};

export function getApplicationErrorMessagePtBr(
  code: ApplicationErrorCode,
): string {
  return applicationErrorMessagesPtBr[code];
}
