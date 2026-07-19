import { DomainError, type DomainErrorCode } from "../errors";

import {
  assertNonEmpty,
  assertPositiveInteger,
  assertUniqueValues,
  normalizeDateOnly,
  normalizeOptionalText,
  normalizeOptionalTime,
  normalizeRequiredText,
} from "../validation";

import type {
  EntityId,
  DateOnlyString,
  ISODateTimeString,
  TimeString,
} from "../types";

export type ActivityStatus = "pending" | "inProgress" | "completed";

export type ActivityStepViewStatus = "pending" | "current" | "completed";

export type ActivityStep = {
  id: EntityId;
  description: string;
  order: number;
  completedAt?: ISODateTimeString;
};

export type Activity = {
  id: EntityId;
  userId: EntityId;
  title: string;
  description?: string;
  date: DateOnlyString;
  time?: TimeString;
  steps: ActivityStep[];
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ActivityStepView = ActivityStep & {
  viewStatus: ActivityStepViewStatus;
};

export type ActivityProgress = {
  completedSteps: number;
  totalSteps: number;
};

export type CreateActivityStepInput = {
  id: EntityId;
  description: string;
  order: number;
};

export type CreateActivityInput = {
  id: EntityId;
  userId: EntityId;
  title: string;
  description?: string;
  date: DateOnlyString;
  time?: TimeString;
  steps: CreateActivityStepInput[];
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export function createActivity(input: CreateActivityInput): Activity {
  assertNonEmpty(input.id, "ACTIVITY_ID_REQUIRED");
  assertNonEmpty(input.userId, "ACTIVITY_USER_ID_REQUIRED");
  assertNonEmpty(input.date, "ACTIVITY_DATE_REQUIRED");
  assertNonEmpty(input.createdAt, "ACTIVITY_CREATED_AT_REQUIRED");
  assertNonEmpty(input.updatedAt, "ACTIVITY_UPDATED_AT_REQUIRED");

  if (input.steps.length === 0) {
    throw new DomainError("ACTIVITY_STEPS_REQUIRED");
  }

  const steps = normalizeActivitySteps(input.steps);

  return {
    id: input.id,
    userId: input.userId,
    title: normalizeRequiredText(input.title, "ACTIVITY_TITLE_REQUIRED"),
    description: normalizeOptionalText(input.description),
    date: normalizeDateOnly(input.date, "ACTIVITY_DATE_INVALID"),
    time: normalizeOptionalTime(input.time, "ACTIVITY_TIME_INVALID"),
    steps,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function sortActivitySteps(steps: ActivityStep[]): ActivityStep[] {
  return [...steps].sort((a, b) => a.order - b.order);
}

export function countCompletedActivitySteps(activity: Activity): number {
  return activity.steps.filter((step) => step.completedAt).length;
}

export function resolveActivityStatus(activity: Activity): ActivityStatus {
  const totalSteps = activity.steps.length;

  if (totalSteps === 0) {
    return "pending";
  }

  const completedSteps = countCompletedActivitySteps(activity);

  if (completedSteps === 0) {
    return "pending";
  }

  if (completedSteps === totalSteps) {
    return "completed";
  }

  return "inProgress";
}

export function getActivityProgress(activity: Activity): ActivityProgress {
  return {
    completedSteps: countCompletedActivitySteps(activity),
    totalSteps: activity.steps.length,
  };
}

export function getCurrentActivityStep(
  activity: Activity,
): ActivityStep | null {
  const sortedSteps = sortActivitySteps(activity.steps);

  return sortedSteps.find((step) => !step.completedAt) ?? null;
}

export function getActivityStepsView(activity: Activity): ActivityStepView[] {
  const sortedSteps = sortActivitySteps(activity.steps);
  const currentStep = getCurrentActivityStep(activity);

  return sortedSteps.map((step) => {
    if (step.completedAt) {
      return {
        ...step,
        viewStatus: "completed",
      };
    }

    if (currentStep && step.id === currentStep.id) {
      return {
        ...step,
        viewStatus: "current",
      };
    }

    return {
      ...step,
      viewStatus: "pending",
    };
  });
}

export function completeActivityStep(
  activity: Activity,
  stepId: EntityId,
  completedAt: ISODateTimeString,
): Activity {
  assertNonEmpty(stepId, "ACTIVITY_STEP_ID_REQUIRED");
  assertNonEmpty(completedAt, "ACTIVITY_STEP_COMPLETED_AT_REQUIRED");

  const stepExists = activity.steps.some((step) => step.id === stepId);

  if (!stepExists) {
    throw new DomainError("ACTIVITY_STEP_NOT_FOUND");
  }

  return {
    ...activity,
    steps: activity.steps.map((step) => {
      if (step.id !== stepId) {
        return step;
      }

      return {
        ...step,
        completedAt,
      };
    }),
    updatedAt: completedAt,
  };
}

export function completeActivity(
  activity: Activity,
  completedAt: ISODateTimeString,
): Activity {
  assertNonEmpty(completedAt, "ACTIVITY_COMPLETED_AT_REQUIRED");

  return {
    ...activity,
    steps: activity.steps.map((step) => ({
      ...step,
      completedAt: step.completedAt ?? completedAt,
    })),
    updatedAt: completedAt,
  };
}

function normalizeActivitySteps(
  steps: CreateActivityStepInput[],
): ActivityStep[] {
  const normalizedSteps = steps.map((step) => {
    assertNonEmpty(step.id, "ACTIVITY_STEP_ID_REQUIRED");

    return {
      id: step.id,
      description: normalizeRequiredText(
        step.description,
        "ACTIVITY_STEP_DESCRIPTION_REQUIRED",
      ),
      order: step.order,
    };
  });

  normalizedSteps.forEach((step) => {
    assertPositiveInteger(step.order, "ACTIVITY_STEP_ORDER_INVALID");
  });

  assertUniqueValues(
    normalizedSteps.map((step) => step.id),
    "ACTIVITY_STEP_IDS_DUPLICATED",
  );

  assertUniqueValues(
    normalizedSteps.map((step) => step.order),
    "ACTIVITY_STEP_ORDERS_DUPLICATED",
  );

  return sortActivitySteps(normalizedSteps);
}

export function parseActivity(input: unknown): Activity {
  if (!isRecord(input)) {
    throw new DomainError("ACTIVITY_INVALID");
  }

  if (!Array.isArray(input.steps)) {
    throw new DomainError("ACTIVITY_STEPS_INVALID");
  }

  const steps = sortActivitySteps(input.steps.map(parseActivityStep));

  const activity = createActivity({
    id: parseRequiredText(input.id, "ACTIVITY_ID_REQUIRED"),
    userId: parseRequiredText(input.userId, "ACTIVITY_USER_ID_REQUIRED"),
    title: parseRequiredText(input.title, "ACTIVITY_TITLE_REQUIRED"),
    description: parseOptionalText(input.description, "ACTIVITY_INVALID"),
    date: parseRequiredText(input.date, "ACTIVITY_DATE_REQUIRED"),
    time: parseOptionalText(input.time, "ACTIVITY_TIME_INVALID"),
    steps: steps.map((step) => ({
      id: step.id,
      description: step.description,
      order: step.order,
    })),
    createdAt: parseRequiredText(
      input.createdAt,
      "ACTIVITY_CREATED_AT_REQUIRED",
    ),
    updatedAt: parseRequiredText(
      input.updatedAt,
      "ACTIVITY_UPDATED_AT_REQUIRED",
    ),
  });

  return {
    ...activity,
    steps,
  };
}

function parseActivityStep(input: unknown): ActivityStep {
  if (!isRecord(input)) {
    throw new DomainError("ACTIVITY_STEP_INVALID");
  }

  const completedAt = parseOptionalNonEmptyText(
    input.completedAt,
    "ACTIVITY_STEP_COMPLETED_AT_REQUIRED",
  );

  return {
    id: parseRequiredText(input.id, "ACTIVITY_STEP_ID_REQUIRED"),
    description: parseRequiredText(
      input.description,
      "ACTIVITY_STEP_DESCRIPTION_REQUIRED",
    ),
    order: parsePositiveInteger(input.order, "ACTIVITY_STEP_ORDER_INVALID"),
    ...(completedAt === undefined ? {} : { completedAt }),
  };
}

function parseRequiredText(value: unknown, code: DomainErrorCode): string {
  if (typeof value !== "string") {
    throw new DomainError(code);
  }

  return normalizeRequiredText(value, code);
}

function parseOptionalText(
  value: unknown,
  code: DomainErrorCode,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new DomainError(code);
  }

  return normalizeOptionalText(value);
}

function parseOptionalNonEmptyText(
  value: unknown,
  code: DomainErrorCode,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseRequiredText(value, code);
}

function parsePositiveInteger(value: unknown, code: DomainErrorCode): number {
  if (typeof value !== "number") {
    throw new DomainError(code);
  }

  assertPositiveInteger(value, code);

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
