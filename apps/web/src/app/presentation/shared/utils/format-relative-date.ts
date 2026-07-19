import type { ISODateTimeString } from '@senior-ease/core';

const TWO_DIGITS = 2;

export function formatRelativeDate(dateTime: ISODateTimeString, now: Date): string {
  const target = new Date(dateTime);

  if (Number.isNaN(target.getTime())) {
    return '';
  }

  const targetDay = startOfLocalDay(target);
  const currentDay = startOfLocalDay(now);

  const differenceInDays = Math.round(
    (currentDay.getTime() - targetDay.getTime()) / (24 * 60 * 60 * 1000),
  );

  const time = formatTime(target);

  if (differenceInDays === 0) {
    return `hoje às ${time}`;
  }

  if (differenceInDays === 1) {
    return `ontem às ${time}`;
  }

  const date = formatDate(target, now);

  return `no dia ${date} às ${time}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(TWO_DIGITS, '0');

  const minutes = String(date.getMinutes()).padStart(TWO_DIGITS, '0');

  return `${hours}:${minutes}`;
}

function formatDate(date: Date, now: Date): string {
  const day = String(date.getDate()).padStart(TWO_DIGITS, '0');

  const month = String(date.getMonth() + 1).padStart(TWO_DIGITS, '0');

  if (date.getFullYear() === now.getFullYear()) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${date.getFullYear()}`;
}
