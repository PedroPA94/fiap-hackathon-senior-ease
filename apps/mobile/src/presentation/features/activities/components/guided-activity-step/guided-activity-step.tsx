import type { ActivityStepView } from "@senior-ease/core";
import type { AccessibilityTheme } from "@senior-ease/tokens";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../../../components";

export type GuidedActivityStepProps = {
  position: number;
  step: ActivityStepView;
  theme: AccessibilityTheme;
};

const statusLabels: Readonly<
  Record<ActivityStepView["viewStatus"], string>
> = {
  completed: "Concluída",
  current: "Etapa atual",
  pending: "Pendente",
};

export function GuidedActivityStep({
  position,
  step,
  theme,
}: GuidedActivityStepProps) {
  const completed = step.viewStatus === "completed";
  const current = step.viewStatus === "current";
  const statusLabel = statusLabels[step.viewStatus];

  return (
    <View
      accessibilityLabel={`Etapa ${position}: ${step.description}. ${statusLabel}.`}
      accessibilityRole={current ? "summary" : undefined}
      aria-current={current ? "step" : undefined}
      style={[
        styles.container,
        {
          gap: theme.spacing.regular,
          minHeight: 68,
          paddingHorizontal: theme.spacing.medium,
          paddingVertical: theme.spacing.regular,
          backgroundColor: current
            ? theme.colors.background.surface
            : completed
              ? theme.colors.background.surface
              : theme.colors.background.page,
          borderColor: current
            ? theme.colors.primary.default
            : theme.colors.border.default,
          borderRadius: theme.radius.medium,
          borderWidth: current
            ? theme.borderWidth.strong
            : theme.borderWidth.regular,
        },
      ]}
      accessible
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.indicator,
          {
            backgroundColor: completed
              ? theme.colors.success.default
              : current
                ? theme.colors.primary.default
                : theme.colors.border.default,
          },
        ]}
      >
        <AppText color="inverse" variant="bodyBold">
          {completed ? "✓" : position}
        </AppText>
      </View>

      <View style={[styles.content, { gap: theme.spacing.xsmall }]}>
        <AppText>{step.description}</AppText>
        <AppText
          color={
            completed ? "success" : current ? "primary" : "muted"
          }
          variant="helper"
        >
          {statusLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  content: {
    minWidth: 0,
    flex: 1,
  },
});
