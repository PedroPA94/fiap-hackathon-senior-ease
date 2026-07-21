import type { DomainErrorCode } from "./domain-error";

export const domainErrorMessagesPtBr: Record<DomainErrorCode, string> = {
  ACTIVITY_INVALID: "Os dados da atividade estão inválidos.",
  ACTIVITY_ID_REQUIRED: "Não foi possível identificar a atividade.",
  ACTIVITY_USER_ID_REQUIRED: "Não foi possível identificar o usuário.",
  ACTIVITY_TITLE_REQUIRED: "Digite um nome para esta atividade.",
  ACTIVITY_DATE_REQUIRED: "Escolha uma data para a atividade.",
  ACTIVITY_DATE_INVALID: "Informe uma data válida para a atividade.",
  ACTIVITY_TIME_INVALID: "Informe um horário válido para a atividade.",
  ACTIVITY_CREATED_AT_REQUIRED:
    "Não foi possível identificar quando a atividade foi criada.",
  ACTIVITY_UPDATED_AT_REQUIRED:
    "Não foi possível identificar quando a atividade foi atualizada.",
  ACTIVITY_COMPLETED_AT_REQUIRED:
    "Não foi possível identificar quando a atividade foi concluída.",

  ACTIVITY_STEPS_REQUIRED: "Adicione pelo menos um passo para continuar.",
  ACTIVITY_STEPS_INVALID: "Os passos da atividade estão inválidos.",
  ACTIVITY_STEP_INVALID: "Os dados do passo da atividade estão inválidos.",
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

  USER_PROFILE_ID_REQUIRED: "Não foi possível identificar o perfil do usuário.",
  USER_PROFILE_NAME_REQUIRED: "Digite o nome do usuário.",
  USER_PROFILE_CREATED_AT_REQUIRED:
    "Não foi possível identificar quando o perfil foi criado.",
  USER_PROFILE_UPDATED_AT_REQUIRED:
    "Não foi possível identificar quando o perfil foi atualizado.",

  ACCESSIBILITY_FONT_SIZE_INVALID: "Escolha um tamanho de fonte válido.",
  ACCESSIBILITY_CONTRAST_INVALID: "Escolha uma opção de contraste válida.",
  ACCESSIBILITY_SPACING_INVALID: "Escolha uma opção de espaçamento válida.",
  ACCESSIBILITY_INTERFACE_MODE_INVALID: "Escolha um modo de interface válido.",
  ACCESSIBILITY_ENHANCED_FEEDBACK_INVALID:
    "Escolha se deseja receber feedback visual reforçado.",
  ACCESSIBILITY_CONFIRM_CRITICAL_ACTIONS_INVALID:
    "Escolha se deseja confirmação adicional em ações críticas.",
  ACCESSIBILITY_PREFERENCES_INVALID: "As preferências informadas são inválidas.",
  ACCESSIBILITY_REMINDERS_ENABLED_INVALID:
    "Escolha se deseja ativar os lembretes.",
  ACCESSIBILITY_REMINDER_ADVANCE_INVALID:
    "Escolha uma antecedência válida para os lembretes.",
  ACCESSIBILITY_USER_ID_REQUIRED: "Não foi possível identificar o usuário.",
};

export function getDomainErrorMessagePtBr(code: DomainErrorCode): string {
  return domainErrorMessagesPtBr[code];
}
