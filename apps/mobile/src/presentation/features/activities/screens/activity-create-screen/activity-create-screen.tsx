import type {
  CreateActivityUseCaseInput,
  DateOnlyString,
  TimeString,
} from "@senior-ease/core";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppText,
  Button,
  InlineFeedback,
  TextField,
} from "../../../../components";
import { StackScreenHeader } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationContainer,
  useApplicationSession,
} from "../../../../providers";
import { StepInput } from "../../components/step-input/step-input";

const saveErrorMessage =
  "Não foi possível salvar a atividade. Tente novamente.";

type FormErrors = {
  title?: string;
  date?: string;
  time?: string;
  steps: (string | undefined)[];
};

const initialErrors: FormErrors = { steps: [] };

export function ActivityCreateScreen() {
  const router = useRouter();
  const { useCases } = useApplicationContainer();
  const session = useApplicationSession();
  const { fontScale } = useWindowDimensions();
  const { preferences, theme } = useAccessibilityTheme();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const mountedRef = useRef(true);
  const stackSchedule =
    preferences.fontSize !== "normal" || fontScale > 1.1;

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const updateStep = (index: number, value: string) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? value : step,
      ),
    );
    setErrors((current) => ({
      ...current,
      steps: current.steps.map((error, stepIndex) =>
        stepIndex === index ? undefined : error,
      ),
    }));
    setPersistenceError(null);
  };

  const addStep = () => {
    setSteps((current) => [...current, ""]);
    setErrors((current) => ({
      ...current,
      steps: [...current.steps, undefined],
    }));
  };

  const removeStep = (index: number) => {
    setSteps((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, stepIndex) => stepIndex !== index);
    });
    setErrors((current) => ({
      ...current,
      steps: current.steps.filter(
        (_, stepIndex) => stepIndex !== index,
      ),
    }));
  };

  const moveStep = (index: number, targetIndex: number) => {
    setSteps((current) => moveItem(current, index, targetIndex));
    setErrors((current) => ({
      ...current,
      steps: moveItem(current.steps, index, targetIndex),
    }));
  };

  const submit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    setPersistenceError(null);

    const validation = validateForm({
      title,
      date,
      time,
      description,
      steps,
      userId: session.currentUser?.id,
    });

    setErrors(validation.errors);

    if (!validation.input) {
      if (!session.currentUser) {
        setPersistenceError(saveErrorMessage);
      }

      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await useCases.activities.create.execute(validation.input);
      router.replace("/(tabs)/activities");
    } catch {
      if (mountedRef.current) {
        setPersistenceError(saveErrorMessage);
      }
    } finally {
      isSubmittingRef.current = false;

      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const cancel = () => {
    if (!isSubmittingRef.current) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <StackScreenHeader onBack={cancel} title="Nova atividade" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.body}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.content,
            {
              gap: theme.spacing.large,
              paddingBottom: theme.spacing.large,
            },
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          testID="activity-create-scroll-view"
        >
          <AppText color="muted" variant="helper">
            Crie uma atividade com etapas guiadas.
          </AppText>

          <TextField
            autoCapitalize="sentences"
            disabled={isSubmitting}
            errorMessage={errors.title}
            label="Título"
            onChangeText={(value) => {
              setTitle(value);
              setErrors((current) => ({ ...current, title: undefined }));
              setPersistenceError(null);
            }}
            placeholder="Digite o título da atividade"
            required
            returnKeyType="next"
            value={title}
          />

          <View
            style={[
              styles.schedule,
              stackSchedule && styles.scheduleStacked,
              { gap: theme.spacing.regular },
            ]}
          >
            <View style={styles.scheduleField}>
              <TextField
                accessibilityHint="Use o formato dia, mês e ano"
                disabled={isSubmitting}
                errorMessage={errors.date}
                keyboardType="number-pad"
                label="Data"
                maxLength={10}
                onChangeText={(value) => {
                  setDate(maskDate(value));
                  setErrors((current) => ({ ...current, date: undefined }));
                  setPersistenceError(null);
                }}
                placeholder="DD/MM/AAAA"
                required
                value={date}
              />
            </View>

            <View style={styles.scheduleField}>
              <TextField
                accessibilityHint="Use o formato horas e minutos"
                disabled={isSubmitting}
                errorMessage={errors.time}
                keyboardType="number-pad"
                label="Hora (opcional)"
                maxLength={5}
                onChangeText={(value) => {
                  setTime(maskTime(value));
                  setErrors((current) => ({ ...current, time: undefined }));
                  setPersistenceError(null);
                }}
                placeholder="HH:MM"
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
                value={time}
              />
            </View>
          </View>

          <TextField
            autoCapitalize="sentences"
            disabled={isSubmitting}
            label="Descrição (opcional)"
            multiline
            onChangeText={(value) => {
              setDescription(value);
              setPersistenceError(null);
            }}
            placeholder="Descreva a atividade"
            value={description}
          />

          <StepInput
            disabled={isSubmitting}
            errors={errors.steps}
            onAdd={addStep}
            onChange={updateStep}
            onMove={moveStep}
            onRemove={removeStep}
            steps={steps}
          />

          {persistenceError ? (
            <InlineFeedback variant="error">
              {persistenceError}
            </InlineFeedback>
          ) : null}
        </ScrollView>

        <SafeAreaView
          edges={["bottom", "left", "right"]}
          style={[
            styles.actionSafeArea,
            {
              backgroundColor: theme.colors.background.surface,
              borderTopColor: theme.colors.border.default,
              borderTopWidth: theme.borderWidth.regular,
            },
          ]}
        >
          <View
            style={[
              styles.actions,
              {
                gap: theme.spacing.regular,
                paddingHorizontal: theme.spacing.large,
                paddingVertical: theme.spacing.regular,
              },
            ]}
          >
            <Button loading={isSubmitting} onPress={() => void submit()}>
              Salvar atividade
            </Button>
            <Button
              disabled={isSubmitting}
              onPress={cancel}
              variant="ghost"
            >
              Cancelar
            </Button>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function validateForm({
  title,
  date,
  time,
  description,
  steps,
  userId,
}: {
  title: string;
  date: string;
  time: string;
  description: string;
  steps: readonly string[];
  userId: string | undefined;
}): {
  errors: FormErrors;
  input?: CreateActivityUseCaseInput;
} {
  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();
  const normalizedSteps = steps.map((step) => step.trim());
  const normalizedDate = toDateOnly(date);
  const normalizedTime = toTime(time);
  const errors: FormErrors = {
    title: normalizedTitle ? undefined : "Digite um nome para a atividade.",
    date:
      date.length === 0
        ? "Escolha uma data para a atividade."
        : normalizedDate
          ? undefined
          : "Informe uma data válida.",
    time:
      time.length === 0 || normalizedTime
        ? undefined
        : "Informe uma hora válida.",
    steps: normalizedSteps.map((step) =>
      step ? undefined : "Descreva esta etapa.",
    ),
  };
  const invalid =
    !userId ||
    Boolean(errors.title || errors.date || errors.time) ||
    errors.steps.some(Boolean);

  if (invalid || !normalizedDate) {
    return { errors };
  }

  return {
    errors,
    input: {
      userId,
      title: normalizedTitle,
      description: normalizedDescription || undefined,
      date: normalizedDate,
      time: normalizedTime,
      steps: normalizedSteps,
    },
  };
}

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

function maskTime(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  return [digits.slice(0, 2), digits.slice(2, 4)]
    .filter(Boolean)
    .join(":");
}

function toDateOnly(value: string): DateOnlyString | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const daysInMonth = getDaysInMonth(month, year);

  if (year === 0 || day < 1 || day > daysInMonth) {
    return undefined;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function getDaysInMonth(month: number, year: number): number {
  if (month < 1 || month > 12) {
    return 0;
  }

  if (month === 2) {
    const leapYear =
      year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

    return leapYear ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function toTime(value: string): TimeString | undefined {
  if (value.length === 0) {
    return undefined;
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    return undefined;
  }

  return value;
}

function moveItem<T>(
  items: readonly T[],
  index: number,
  targetIndex: number,
): T[] {
  if (
    index < 0 ||
    index >= items.length ||
    targetIndex < 0 ||
    targetIndex >= items.length ||
    index === targetIndex
  ) {
    return [...items];
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, item);

  return nextItems;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  schedule: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  scheduleStacked: {
    flexDirection: "column",
  },
  scheduleField: {
    minWidth: 0,
    flex: 1,
    width: "100%",
  },
  actionSafeArea: {
    flexShrink: 0,
  },
  actions: {
    width: "100%",
  },
});
