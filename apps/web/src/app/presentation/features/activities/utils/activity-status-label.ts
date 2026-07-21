import type { ActivityStatus } from '@senior-ease/core';

const ACTIVITY_STATUS_LABELS: Readonly<Record<ActivityStatus, string>> = {
  pending: 'Não iniciada',
  inProgress: 'Em andamento',
  completed: 'Concluída',
};

export function getActivityStatusLabel(status: ActivityStatus): string {
  return ACTIVITY_STATUS_LABELS[status];
}
