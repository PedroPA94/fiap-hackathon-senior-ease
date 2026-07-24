import {
  getActivityProgress,
  resolveActivityStatus,
  type Activity,
  type ActivityStatus,
} from "@senior-ease/core";
import type { AccessibilityTheme } from "@senior-ease/tokens";
import { StyleSheet, View, type ViewStyle } from "react-native";

import {
  AppText,
  Button,
  Card,
  type AppTextColor,
} from "../../../../components";
import { useAccessibilityTheme } from "../../../../providers";
import {
  formatActivityDate,
  getActivityStatusLabel,
} from "../../utils/activity-presentation";

export type ActivityListItemProps = {
  activity: Activity;
  compact?: boolean;
  onViewSteps(activityId: Activity["id"]): void;
};

export function ActivityListItem({
  activity,
  compact = false,
  onViewSteps,
}: ActivityListItemProps) {
  const { theme } = useAccessibilityTheme();
  const status = resolveActivityStatus(activity);
  const progress = getActivityProgress(activity);
  const schedule = activity.time
    ? `${formatActivityDate(activity.date)} • ${activity.time}`
    : formatActivityDate(activity.date);

  return (
    <Card style={{ gap: theme.spacing.large }}>
      <View style={{ gap: compact ? theme.spacing.small : theme.spacing.medium }}>
        <View
          style={[
            styles.heading,
            { gap: theme.spacing.medium },
          ]}
        >
          <AppText
            accessibilityRole="header"
            style={styles.title}
            variant="titleBold"
          >
            {activity.title}
          </AppText>
          <ActivityStatusBadge status={status} />
        </View>

        {!compact && activity.description ? (
          <AppText color="muted">{activity.description}</AppText>
        ) : null}

        <View style={{ gap: theme.spacing.xsmall }}>
          <AppText variant="helperBold">
            {activity.time ? "Data e horário" : "Data"}
          </AppText>
          <AppText color="muted">{schedule}</AppText>
        </View>

        {!compact ? (
          <View style={{ gap: theme.spacing.small }}>
            <AppText variant="helperBold">
              {progress.completedSteps} de {progress.totalSteps} etapas
            </AppText>
            <ActivityProgress
              completedSteps={progress.completedSteps}
              totalSteps={progress.totalSteps}
            />
          </View>
        ) : null}
      </View>

      <Button
        accessibilityLabel={`Ver etapas de ${activity.title}`}
        onPress={() => onViewSteps(activity.id)}
        variant="ghost"
      >
        Ver etapas
      </Button>
    </Card>
  );
}

function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  const { theme } = useAccessibilityTheme();
  const presentation = getStatusPresentation(theme, status);

  return (
    <View
      accessibilityLabel={`Status: ${getActivityStatusLabel(status)}`}
      accessible
      style={[
        styles.badge,
        {
          backgroundColor: presentation.backgroundColor,
          borderColor: presentation.borderColor,
          borderRadius: theme.radius.large,
          borderWidth: theme.borderWidth.regular,
          paddingHorizontal: theme.spacing.medium,
          paddingVertical: theme.spacing.xsmall,
        },
      ]}
    >
      <AppText color={presentation.textColor} variant="helperBold">
        {getActivityStatusLabel(status)}
      </AppText>
    </View>
  );
}

function ActivityProgress({
  completedSteps,
  totalSteps,
}: {
  completedSteps: number;
  totalSteps: number;
}) {
  const { theme } = useAccessibilityTheme();
  const remainingSteps = Math.max(totalSteps - completedSteps, 0);

  return (
    <View
      accessibilityLabel={`${completedSteps} de ${totalSteps} etapas concluídas`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: totalSteps,
        now: completedSteps,
      }}
      accessible
      style={[
        styles.progressTrack,
        {
          backgroundColor: theme.colors.background.surfaceSoft,
          borderRadius: theme.radius.large,
        },
      ]}
      testID={`activity-progress-${completedSteps}-${totalSteps}`}
    >
      <View
        style={[
          styles.progressSection,
          {
            backgroundColor: theme.colors.primary.default,
            flexGrow: completedSteps,
          },
        ]}
      />
      <View
        style={[
          styles.progressSection,
          { flexGrow: remainingSteps },
        ]}
      />
    </View>
  );
}

function getStatusPresentation(
  theme: AccessibilityTheme,
  status: ActivityStatus,
): {
  backgroundColor: string;
  borderColor: string;
  textColor: AppTextColor;
} {
  if (status === "completed") {
    return {
      backgroundColor: theme.colors.success.soft,
      borderColor: theme.colors.success.default,
      textColor: "success",
    };
  }

  if (status === "inProgress") {
    return {
      backgroundColor: theme.colors.warning.soft,
      borderColor: theme.colors.warning.default,
      textColor: "warning",
    };
  }

  return {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.strong,
    textColor: "default",
  };
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  title: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  badge: {
    alignSelf: "flex-start",
  },
  progressTrack: {
    width: "100%",
    height: 10,
    flexDirection: "row",
    overflow: "hidden",
  },
  progressSection: {
    flexBasis: 0,
  } satisfies ViewStyle,
});
