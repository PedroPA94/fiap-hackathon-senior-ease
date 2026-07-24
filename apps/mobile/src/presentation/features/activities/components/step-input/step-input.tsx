import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Button, TextField } from "../../../../components";
import { useAccessibilityTheme } from "../../../../providers";

export type StepInputProps = {
  steps: readonly string[];
  errors?: readonly (string | undefined)[];
  disabled?: boolean;
  onChange(index: number, value: string): void;
  onAdd(): void;
  onRemove(index: number): void;
  onMove(index: number, targetIndex: number): void;
};

export function StepInput({
  steps,
  errors = [],
  disabled = false,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: StepInputProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      accessibilityLabel="Etapas da atividade"
      style={[
        styles.section,
        {
          gap: theme.spacing.medium,
          paddingTop: theme.spacing.small,
        },
      ]}
    >
      <AppText accessibilityRole="header" variant="bodyLargeBold">
        Etapas da atividade
      </AppText>

      {steps.map((step, index) => {
        const canRemove = !disabled && steps.length > 1;
        const canMoveUp = !disabled && index > 0;
        const canMoveDown = !disabled && index < steps.length - 1;

        return (
          <View
            key={index}
            style={[
              styles.item,
              {
                gap: theme.spacing.regular,
                padding: theme.spacing.medium,
                backgroundColor: theme.colors.background.surface,
                borderColor: theme.colors.border.default,
                borderRadius: theme.radius.medium,
                borderWidth: theme.borderWidth.regular,
              },
            ]}
          >
            <View
              style={[
                styles.header,
                { gap: theme.spacing.regular },
              ]}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[
                  styles.number,
                  { backgroundColor: theme.colors.primary.default },
                ]}
              >
                <AppText color="inverse" variant="bodyBold">
                  {index + 1}
                </AppText>
              </View>

              <AppText style={styles.title} variant="bodyBold">
                Etapa {index + 1}
              </AppText>

              <Pressable
                accessibilityLabel={`Remover etapa ${index + 1}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canRemove }}
                disabled={!canRemove}
                onPress={() => onRemove(index)}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor:
                      pressed && canRemove
                        ? theme.colors.danger.soft
                        : "transparent",
                    borderRadius: theme.radius.small,
                  },
                ]}
              >
                <AppText
                  color={canRemove ? "danger" : "disabled"}
                  variant="bodyLargeBold"
                >
                  ×
                </AppText>
              </Pressable>
            </View>

            <TextField
              accessibilityLabel={`Descrição da etapa ${index + 1}`}
              autoCapitalize="sentences"
              disabled={disabled}
              errorMessage={errors[index]}
              label={`Descrição da etapa ${index + 1}`}
              multiline
              onChangeText={(value) => onChange(index, value)}
              placeholder="Descreva esta etapa"
              required
              showLabel={false}
              style={styles.stepField}
              value={step}
            />

            <View
              accessibilityLabel={`Ações da etapa ${index + 1}`}
              accessibilityRole="none"
              style={[styles.actions, { gap: theme.spacing.small }]}
            >
              <ReorderButton
                disabled={!canMoveUp}
                label="Subir"
                symbol="↑"
                onPress={() => onMove(index, index - 1)}
              />
              <ReorderButton
                disabled={!canMoveDown}
                label="Descer"
                symbol="↓"
                onPress={() => onMove(index, index + 1)}
              />
            </View>
          </View>
        );
      })}

      <Button
        accessibilityLabel="Adicionar etapa"
        disabled={disabled}
        onPress={onAdd}
        variant="ghost"
      >
        + Adicionar etapa
      </Button>
    </View>
  );
}

function ReorderButton({
  disabled,
  label,
  symbol,
  onPress,
}: {
  disabled: boolean;
  label: string;
  symbol: string;
  onPress(): void;
}) {
  const { theme } = useAccessibilityTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reorderButton,
        {
          gap: theme.spacing.small,
          backgroundColor:
            pressed && !disabled
              ? theme.colors.primary.soft
              : "transparent",
          borderColor: disabled
            ? theme.colors.disabled.background
            : theme.colors.border.default,
          borderRadius: theme.radius.small,
          borderWidth: theme.borderWidth.regular,
        },
      ]}
    >
      <AppText
        color={disabled ? "disabled" : "muted"}
        variant="bodyLargeBold"
      >
        {symbol}
      </AppText>
      <AppText color={disabled ? "disabled" : "muted"} variant="helper">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
  },
  item: {
    width: "100%",
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  number: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  title: {
    minWidth: 0,
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stepField: {
    minHeight: 64,
  },
  actions: {
    flexDirection: "row",
  },
  reorderButton: {
    minWidth: 0,
    minHeight: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
});
