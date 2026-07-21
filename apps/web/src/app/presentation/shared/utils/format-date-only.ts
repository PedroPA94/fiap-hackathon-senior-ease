import type { DateOnlyString } from '@senior-ease/core';

export function formatDateOnlyLongPtBr(dateOnly: DateOnlyString): string {
  const [year, month, day] = dateOnly.split('-').map(Number);

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
