import { describe, expect, it } from "vitest";

import {
  completeActivity,
  completeActivityStep,
  createActivity,
  resolveActivityReminder,
  type Activity,
  type CreateActivityInput,
  type ReminderAdvance,
} from "../../../src/domain";

const createdAt = "2026-07-09T12:00:00.000Z";

function makeActivity(
  overrides: Partial<CreateActivityInput> = {},
): Activity {
  return createActivity({
    id: "activity-1",
    userId: "user-1",
    title: "Tomar remédio",
    date: "2026-07-25",
    time: "14:00",
    steps: [
      { id: "step-1", description: "Separar o remédio", order: 1 },
      { id: "step-2", description: "Beber água", order: 2 },
    ],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  });
}

function localDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute, second, millisecond);
}

function resolve(
  activity: Activity,
  now: Date,
  reminderAdvance: ReminderAdvance = "thirtyMinutes",
) {
  return resolveActivityReminder({
    activity,
    remindersEnabled: true,
    reminderAdvance,
    now,
  });
}

describe("resolveActivityReminder", () => {
  it("returns null when reminders are disabled", () => {
    const activity = makeActivity();

    expect(
      resolveActivityReminder({
        activity,
        remindersEnabled: false,
        reminderAdvance: "atTime",
        now: localDate(2026, 7, 25, 14),
      }),
    ).toBeNull();
  });

  it("returns null for a completed activity", () => {
    const activity = completeActivity(makeActivity(), createdAt);

    expect(resolve(activity, localDate(2026, 7, 25, 13, 45))).toBeNull();
  });

  it("returns a reminder for a pending activity", () => {
    expect(resolve(makeActivity(), localDate(2026, 7, 25, 13, 45))).not.toBeNull();
  });

  it("returns a reminder for an in-progress activity", () => {
    const activity = completeActivityStep(makeActivity(), "step-1", createdAt);

    expect(resolve(activity, localDate(2026, 7, 25, 13, 45))).not.toBeNull();
  });

  it.each([
    {
      advance: "atTime",
      before: localDate(2026, 7, 25, 13, 59),
      start: localDate(2026, 7, 25, 14),
      inside: localDate(2026, 7, 25, 14, 0, 45, 900),
      exact: localDate(2026, 7, 25, 14),
      after: localDate(2026, 7, 25, 14, 1),
    },
    {
      advance: "thirtyMinutes",
      before: localDate(2026, 7, 25, 13, 29),
      start: localDate(2026, 7, 25, 13, 30),
      inside: localDate(2026, 7, 25, 13, 45),
      exact: localDate(2026, 7, 25, 14),
      after: localDate(2026, 7, 25, 14, 1),
    },
    {
      advance: "oneHour",
      before: localDate(2026, 7, 25, 12, 59),
      start: localDate(2026, 7, 25, 13),
      inside: localDate(2026, 7, 25, 13, 30),
      exact: localDate(2026, 7, 25, 14),
      after: localDate(2026, 7, 25, 14, 1),
    },
    {
      advance: "oneDay",
      before: localDate(2026, 7, 24, 13, 59),
      start: localDate(2026, 7, 24, 14),
      inside: localDate(2026, 7, 25, 8),
      exact: localDate(2026, 7, 25, 14),
      after: localDate(2026, 7, 25, 14, 1),
    },
  ] as const)(
    "applies the complete $advance window",
    ({ advance, before, start, inside, exact, after }) => {
      const activity = makeActivity();

      expect(resolve(activity, before, advance)).toBeNull();
      expect(resolve(activity, start, advance)).not.toBeNull();
      expect(resolve(activity, inside, advance)).not.toBeNull();
      expect(resolve(activity, exact, advance)).not.toBeNull();
      expect(resolve(activity, after, advance)).toBeNull();
    },
  );

  it.each([
    {
      description: "day and month",
      date: "2026-08-01",
      time: "00:15",
      advance: "thirtyMinutes",
      expected: localDate(2026, 7, 31, 23, 45),
    },
    {
      description: "year",
      date: "2027-01-01",
      time: "00:30",
      advance: "oneHour",
      expected: localDate(2026, 12, 31, 23, 30),
    },
    {
      description: "month with a 24-hour advance",
      date: "2026-03-01",
      time: "10:00",
      advance: "oneDay",
      expected: localDate(2026, 2, 28, 10),
    },
  ] as const)(
    "calculates reminderAt across a change of $description",
    ({ date, time, advance, expected }) => {
      const activity = makeActivity({ date, time });

      expect(resolve(activity, expected, advance)?.reminderAt).toEqual(expected);
    },
  );

  it.each([
    ["the previous day", localDate(2026, 7, 24, 23, 59), false],
    ["the start of its day", localDate(2026, 7, 25), true],
    ["the middle of its day", localDate(2026, 7, 25, 12), true],
    ["the end of its day", localDate(2026, 7, 25, 23, 59, 59, 999), true],
    ["the following day", localDate(2026, 7, 26), false],
  ] as const)(
    "resolves an untimed activity on %s",
    (_description, now, expectedToResolve) => {
      const activity = makeActivity({ time: undefined });

      expect(resolve(activity, now) !== null).toBe(expectedToResolve);
    },
  );

  it.each(["atTime", "thirtyMinutes", "oneHour", "oneDay"] as const)(
    "ignores %s advance for an untimed activity",
    (advance) => {
      const activity = makeActivity({ time: undefined });

      expect(resolve(activity, localDate(2026, 7, 25, 12), advance)).not.toBeNull();
    },
  );

  it("normalizes now to minute precision", () => {
    const activity = makeActivity();

    expect(
      resolve(activity, localDate(2026, 7, 25, 14, 0, 59, 999), "atTime"),
    ).not.toBeNull();
    expect(
      resolve(activity, localDate(2026, 7, 25, 14, 1, 0, 1), "atTime"),
    ).toBeNull();
  });

  it("returns only the calculated data for a timed activity", () => {
    const activity = makeActivity();

    expect(resolve(activity, localDate(2026, 7, 25, 13, 30))).toEqual({
      activityId: "activity-1",
      title: "Tomar remédio",
      date: "2026-07-25",
      time: "14:00",
      scheduledAt: localDate(2026, 7, 25, 14),
      reminderAt: localDate(2026, 7, 25, 13, 30),
      hasTime: true,
    });
  });

  it("clearly represents an untimed activity", () => {
    const activity = makeActivity({ time: undefined });

    expect(resolve(activity, localDate(2026, 7, 25, 12))).toEqual({
      activityId: "activity-1",
      title: "Tomar remédio",
      date: "2026-07-25",
      time: null,
      scheduledAt: null,
      reminderAt: null,
      hasTime: false,
    });
  });

  it("does not modify the received activity", () => {
    const activity = makeActivity();
    const originalActivity = JSON.stringify(activity);

    resolve(activity, localDate(2026, 7, 25, 13, 45));

    expect(JSON.stringify(activity)).toBe(originalActivity);
  });
});
