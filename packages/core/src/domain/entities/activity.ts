import { DomainError } from "../errors";

import {
  assertNonEmpty,
  assertPositiveInteger,
  assertUniqueValues,
  normalizeOptionalText,
  normalizeRequiredText,
} from "../validation";

import type {
  EntityId,
  ISODateString,
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
  date: ISODateString;
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
  date: ISODateString;
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

  const title = normalizeRequiredText(input.title, "ACTIVITY_TITLE_REQUIRED");

  if (input.steps.length === 0) {
    throw new DomainError("ACTIVITY_STEPS_REQUIRED");
  }

  const steps = normalizeActivitySteps(input.steps);

  return {
    id: input.id,
    userId: input.userId,
    title,
    description: normalizeOptionalText(input.description),
    date: input.date,
    time: normalizeOptionalText(input.time),
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
