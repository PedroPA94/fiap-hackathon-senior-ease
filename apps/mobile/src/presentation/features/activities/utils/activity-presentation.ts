import type {
  ActivityStatus,
  DateOnlyString,
} from "@senior-ease/core";

const ACTIVITY_STATUS_LABELS: Readonly<Record<ActivityStatus, string>> = {
  pending: "Não iniciada",
  inProgress: "Em andamento",
  completed: "Concluída",
};

export function getActivityStatusLabel(
  status: ActivityStatus,
): string {
  return ACTIVITY_STATUS_LABELS[status];
}

export function formatActivityDate(date: DateOnlyString): string {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);
}
