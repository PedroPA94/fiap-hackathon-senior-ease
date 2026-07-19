import type { ApplicationErrorCode } from "./application-error";

export const applicationErrorMessagesPtBr: Record<
  ApplicationErrorCode,
  string
> = {
  ACTIVITY_NOT_FOUND: "Não encontramos esta atividade.",
  ACTIVITY_RECENT_LIMIT_INVALID:
    "O limite de atividades recentes deve ser um número inteiro maior que zero.",
  ACTIVITY_ALREADY_EXISTS: "A atividade já existe.",
  USER_PROFILE_NOT_FOUND: "Não encontramos este perfil de usuário.",
};

export function getApplicationErrorMessagePtBr(
  code: ApplicationErrorCode,
): string {
  return applicationErrorMessagesPtBr[code];
}
