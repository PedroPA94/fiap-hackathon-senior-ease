import type { DomainErrorCode } from "./domain-error";

export const domainErrorMessagesPtBr: Record<DomainErrorCode, string> = {
  ACTIVITY_ID_REQUIRED: "Não foi possível identificar a atividade.",
  ACTIVITY_USER_ID_REQUIRED: "Não foi possível identificar o usuário.",
  ACTIVITY_TITLE_REQUIRED: "Digite um nome para esta atividade.",
  ACTIVITY_DATE_REQUIRED: "Escolha uma data para a atividade.",
  ACTIVITY_CREATED_AT_REQUIRED:
    "Não foi possível identificar quando a atividade foi criada.",
  ACTIVITY_UPDATED_AT_REQUIRED:
    "Não foi possível identificar quando a atividade foi atualizada.",
  ACTIVITY_COMPLETED_AT_REQUIRED:
    "Não foi possível identificar quando a atividade foi concluída.",

  ACTIVITY_STEPS_REQUIRED: "Adicione pelo menos um passo para continuar.",
  ACTIVITY_STEP_ID_REQUIRED:
    "Não foi possível identificar o passo da atividade.",
  ACTIVITY_STEP_COMPLETED_AT_REQUIRED:
    "Não foi possível identificar quando o passo foi concluído.",
  ACTIVITY_STEP_DESCRIPTION_REQUIRED:
    "Descreva o que deve ser feito neste passo.",
  ACTIVITY_STEP_ORDER_INVALID: "A ordem dos passos está inválida.",
  ACTIVITY_STEP_IDS_DUPLICATED: "Existem passos duplicados nesta atividade.",
  ACTIVITY_STEP_ORDERS_DUPLICATED: "Existem passos com a mesma posição.",
  ACTIVITY_STEP_NOT_FOUND: "Não encontramos este passo da atividade.",
};

export function getDomainErrorMessagePtBr(code: DomainErrorCode): string {
  return domainErrorMessagesPtBr[code];
}
