import type {
  Activity,
  ActivityReminder,
  ISODateTimeString,
} from "@senior-ease/core";

export function formatActivitySchedule(activity: Activity): string {
  const [year, month, day] = activity.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  return activity.time
    ? `${formattedDate}, ${activity.time}`
    : formattedDate;
}

export function formatReminderSchedule(
  reminder: ActivityReminder,
): string {
  const [year, month, day] = reminder.date.split("-").map(Number);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));

  return reminder.time ? `${date} às ${reminder.time}` : date;
}

export function formatCompletionDate(
  dateTime: ISODateTimeString,
  now = new Date(),
): string {
  const target = new Date(dateTime);

  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const targetDay = startOfLocalDay(target);
  const currentDay = startOfLocalDay(now);
  const differenceInDays = Math.round(
    (currentDay.getTime() - targetDay.getTime()) / 86_400_000,
  );
  const time = `${twoDigits(target.getHours())}:${twoDigits(target.getMinutes())}`;

  if (differenceInDays === 0) {
    return `hoje às ${time}`;
  }

  if (differenceInDays === 1) {
    return `ontem às ${time}`;
  }

  const day = twoDigits(target.getDate());
  const month = twoDigits(target.getMonth() + 1);
  const date =
    target.getFullYear() === now.getFullYear()
      ? `${day}/${month}`
      : `${day}/${month}/${target.getFullYear()}`;

  return `no dia ${date} às ${time}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}
