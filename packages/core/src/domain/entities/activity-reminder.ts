import type {
  DateOnlyString,
  EntityId,
  ReminderAdvance,
  TimeString,
} from "../types";
import { resolveActivityStatus, type Activity } from "./activity";

export type ActivityReminder =
  | {
      activityId: EntityId;
      title: string;
      date: DateOnlyString;
      time: TimeString;
      scheduledAt: Date;
      reminderAt: Date;
      hasTime: true;
    }
  | {
      activityId: EntityId;
      title: string;
      date: DateOnlyString;
      time: null;
      scheduledAt: null;
      reminderAt: null;
      hasTime: false;
    };

export type ResolveActivityReminderInput = {
  activity: Activity;
  remindersEnabled: boolean;
  reminderAdvance: ReminderAdvance;
  now: Date;
};

const reminderAdvanceMinutes: Readonly<Record<ReminderAdvance, number>> = {
  atTime: 0,
  thirtyMinutes: 30,
  oneHour: 60,
  oneDay: 24 * 60,
};

export function resolveActivityReminder({
  activity,
  remindersEnabled,
  reminderAdvance,
  now,
}: ResolveActivityReminderInput): ActivityReminder | null {
  if (!remindersEnabled || resolveActivityStatus(activity) === "completed") {
    return null;
  }

  const [year, month, day] = activity.date.split("-").map(Number);

  if (!activity.time) {
    const isActivityDay =
      now.getFullYear() === year &&
      now.getMonth() === month - 1 &&
      now.getDate() === day;

    return isActivityDay
      ? {
          activityId: activity.id,
          title: activity.title,
          date: activity.date,
          time: null,
          scheduledAt: null,
          reminderAt: null,
          hasTime: false,
        }
      : null;
  }

  const [hour, minute] = activity.time.split(":").map(Number);
  const scheduledAt = new Date(year, month - 1, day, hour, minute);
  const reminderAt = new Date(
    scheduledAt.getTime() - reminderAdvanceMinutes[reminderAdvance] * 60_000,
  );
  const currentMinute = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  );

  if (currentMinute < reminderAt || currentMinute > scheduledAt) {
    return null;
  }

  return {
    activityId: activity.id,
    title: activity.title,
    date: activity.date,
    time: activity.time,
    scheduledAt,
    reminderAt,
    hasTime: true,
  };
}
