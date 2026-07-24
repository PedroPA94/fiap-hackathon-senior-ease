import {
  ApplicationError,
  getActivityProgress,
  getActivityStepsView,
  getCurrentActivityStep,
  resolveActivityStatus,
  type Activity,
} from "@senior-ease/core";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  InlineFeedback,
} from "../../../../components";
import { StackScreenHeader } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationContainer,
  useApplicationSession,
} from "../../../../providers";
import { GuidedActivityStep } from "../../components/guided-activity-step/guided-activity-step";
import { formatActivityDate } from "../../utils/activity-presentation";

const loadErrorMessage =
  "Não foi possível carregar esta atividade. Tente novamente.";
const notFoundMessage = "Atividade não encontrada.";
const stepErrorMessage =
  "Não foi possível concluir a etapa. Tente novamente.";
const activityErrorMessage =
  "Não foi possível concluir a atividade. Tente novamente.";
const successMessage = "Seu progresso foi salvo.";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; activity: Activity }
  | { kind: "error" }
  | { kind: "notFound" };

type ProcessingAction = "step" | "activity" | null;

export type ActivityGuidedScreenProps = {
  activityId?: string;
};

export function ActivityGuidedScreen({
  activityId,
}: ActivityGuidedScreenProps) {
  const router = useRouter();
  const { useCases } = useApplicationContainer();
  const session = useApplicationSession();
  const { preferences, theme } = useAccessibilityTheme();
  const [loadState, setLoadState] = useState<LoadState>({
    kind: "loading",
  });
  const [processingAction, setProcessingAction] =
    useState<ProcessingAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const processingRef = useRef(false);
  const confirmationOpenRef = useRef(false);
  const currentUserId = session.currentUser?.id;
  const normalizedActivityId = activityId?.trim();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      processingRef.current = false;
      confirmationOpenRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!showSuccess || preferences.enhancedFeedback) {
      return;
    }

    const timeout = setTimeout(() => setShowSuccess(false), 3000);

    return () => clearTimeout(timeout);
  }, [preferences.enhancedFeedback, showSuccess]);

  const loadActivity = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadState({ kind: "loading" });
    setActionError(null);
    setShowSuccess(false);

    if (!normalizedActivityId || !currentUserId) {
      setLoadState({ kind: "notFound" });
      return;
    }

    try {
      const activity = await useCases.activities.getById.execute({
        activityId: normalizedActivityId,
        userId: currentUserId,
      });

      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoadState(
          activity.userId === currentUserId
            ? { kind: "ready", activity }
            : { kind: "notFound" },
        );
      }
    } catch (error) {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setLoadState(
          isActivityNotFound(error)
            ? { kind: "notFound" }
            : { kind: "error" },
        );
      }
    }
  }, [
    currentUserId,
    normalizedActivityId,
    useCases.activities.getById,
  ]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  const completeCurrentStep = async () => {
    if (
      !mountedRef.current ||
      processingRef.current ||
      loadState.kind !== "ready" ||
      !currentUserId
    ) {
      return;
    }

    const currentStep = getCurrentActivityStep(loadState.activity);

    if (!currentStep || currentStep.completedAt) {
      return;
    }

    beginProcessing("step");

    try {
      const activity =
        await useCases.activities.completeStep.execute({
          activityId: loadState.activity.id,
          stepId: currentStep.id,
          userId: currentUserId,
        });
      handleSuccessfulUpdate(activity);
    } catch {
      handleActionError(stepErrorMessage);
    } finally {
      finishProcessing();
    }
  };

  const completeEntireActivity = async () => {
    confirmationOpenRef.current = false;

    if (
      !mountedRef.current ||
      processingRef.current ||
      loadState.kind !== "ready" ||
      !currentUserId ||
      resolveActivityStatus(loadState.activity) === "completed"
    ) {
      return;
    }

    beginProcessing("activity");

    try {
      const activity = await useCases.activities.complete.execute({
        activityId: loadState.activity.id,
        userId: currentUserId,
      });
      handleSuccessfulUpdate(activity);
    } catch {
      handleActionError(activityErrorMessage);
    } finally {
      finishProcessing();
    }
  };

  const requestCompleteActivity = () => {
    if (
      !mountedRef.current ||
      processingRef.current ||
      confirmationOpenRef.current ||
      loadState.kind !== "ready" ||
      resolveActivityStatus(loadState.activity) === "completed"
    ) {
      return;
    }

    if (!preferences.confirmCriticalActions) {
      void completeEntireActivity();
      return;
    }

    confirmationOpenRef.current = true;
    Alert.alert(
      "Concluir atividade?",
      "Todas as etapas serão marcadas como concluídas.",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => {
            confirmationOpenRef.current = false;
          },
        },
        {
          text: "Concluir atividade",
          onPress: () => void completeEntireActivity(),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          confirmationOpenRef.current = false;
        },
      },
    );
  };

  const beginProcessing = (action: Exclude<ProcessingAction, null>) => {
    processingRef.current = true;
    setProcessingAction(action);
    setActionError(null);
    setShowSuccess(false);
  };

  const finishProcessing = () => {
    processingRef.current = false;

    if (mountedRef.current) {
      setProcessingAction(null);
    }
  };

  const handleSuccessfulUpdate = (activity: Activity) => {
    if (mountedRef.current) {
      setLoadState({ kind: "ready", activity });
      setShowSuccess(true);
    }
  };

  const handleActionError = (message: string) => {
    if (mountedRef.current) {
      setActionError(message);
    }
  };

  const goBackToActivities = () =>
    router.replace("/(tabs)/activities");

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <StackScreenHeader
        onBack={goBackToActivities}
        title="Atividade guiada"
      />

      {loadState.kind === "loading" ? (
        <LoadingState />
      ) : loadState.kind === "error" ? (
        <ScreenState>
          <ErrorState
            message={loadErrorMessage}
            onRetry={() => void loadActivity()}
          />
        </ScreenState>
      ) : loadState.kind === "notFound" ? (
        <ScreenState>
          <EmptyState
            actionLabel="Voltar para atividades"
            description="Ela pode ter sido removida ou não pertence ao usuário atual."
            onAction={goBackToActivities}
            title={notFoundMessage}
          />
        </ScreenState>
      ) : (
        <GuidedActivityContent
          actionError={actionError}
          activity={loadState.activity}
          isProcessing={processingAction !== null}
          onCompleteActivity={requestCompleteActivity}
          onCompleteStep={() => void completeCurrentStep()}
          processingAction={processingAction}
          showSuccess={showSuccess}
        />
      )}
    </View>
  );
}

function GuidedActivityContent({
  actionError,
  activity,
  isProcessing,
  onCompleteActivity,
  onCompleteStep,
  processingAction,
  showSuccess,
}: {
  actionError: string | null;
  activity: Activity;
  isProcessing: boolean;
  onCompleteActivity(): void;
  onCompleteStep(): void;
  processingAction: ProcessingAction;
  showSuccess: boolean;
}) {
  const { theme } = useAccessibilityTheme();
  const progress = getActivityProgress(activity);
  const steps = getActivityStepsView(activity);
  const currentStep = getCurrentActivityStep(activity);
  const completed = resolveActivityStatus(activity) === "completed";
  const progressLabel = `${progress.completedSteps} de ${progress.totalSteps} etapas concluídas`;
  const progressPercentage =
    progress.totalSteps === 0
      ? 0
      : (progress.completedSteps / progress.totalSteps) * 100;
  const schedule = activity.time
    ? `${formatActivityDate(activity.date)} • ${activity.time}`
    : formatActivityDate(activity.date);

  return (
    <SafeAreaView
      edges={
        completed
          ? ["bottom", "left", "right"]
          : ["left", "right"]
      }
      style={styles.contentArea}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.medium,
            paddingBottom: theme.spacing.large,
          },
        ]}
        showsVerticalScrollIndicator
        testID="guided-activity-scroll-view"
      >
        {showSuccess ? (
          <InlineFeedback variant="success">
            {successMessage}
          </InlineFeedback>
        ) : null}

        {actionError ? (
          <InlineFeedback variant="error">{actionError}</InlineFeedback>
        ) : null}

        <View style={{ gap: theme.spacing.small }}>
          <AppText accessibilityRole="header" variant="titleBold">
            {activity.title}
          </AppText>
          <AppText color="muted" variant="helper">
            {schedule}
          </AppText>
          {activity.description ? (
            <AppText color="muted" variant="helper">
              {activity.description}
            </AppText>
          ) : null}

          <View style={{ gap: theme.spacing.small }}>
            <AppText color="muted" variant="helper">
              {progressLabel}
            </AppText>
            <View
              accessibilityLabel="Progresso da atividade"
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: progress.totalSteps,
                now: progress.completedSteps,
                text: progressLabel,
              }}
              style={[
                styles.progressTrack,
                { backgroundColor: theme.colors.border.default },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: theme.colors.primary.default,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={{ gap: theme.spacing.regular }}>
          <AppText accessibilityRole="header" variant="bodyLargeBold">
            Etapas
          </AppText>
          {steps.map((step, index) => (
            <GuidedActivityStep
              key={step.id}
              position={index + 1}
              step={step}
              theme={theme}
            />
          ))}
        </View>

        {completed ? (
          <InlineFeedback variant="success">
            Todas as etapas foram concluídas.
          </InlineFeedback>
        ) : null}
      </ScrollView>

      {!completed ? (
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
                gap: theme.spacing.small,
                paddingHorizontal: theme.spacing.large,
                paddingVertical: theme.spacing.regular,
              },
            ]}
          >
            {currentStep ? (
              <Button
                disabled={isProcessing}
                loading={processingAction === "step"}
                onPress={onCompleteStep}
              >
                Concluir etapa
              </Button>
            ) : null}
            <Button
              disabled={isProcessing}
              loading={processingAction === "activity"}
              onPress={onCompleteActivity}
              variant="secondary"
            >
              Concluir atividade
            </Button>
          </View>
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

function LoadingState() {
  const { theme } = useAccessibilityTheme();

  return (
    <View
      accessibilityLabel="Carregando atividade..."
      accessibilityRole="progressbar"
      accessible
      style={[
        styles.centeredState,
        { gap: theme.spacing.medium },
      ]}
    >
      <ActivityIndicator
        color={theme.colors.primary.default}
        size="large"
      />
      <AppText color="muted">Carregando atividade...</AppText>
    </View>
  );
}

function ScreenState({ children }: { children: ReactNode }) {
  return <View style={styles.state}>{children}</View>;
}

function isActivityNotFound(error: unknown): boolean {
  return (
    error instanceof ApplicationError &&
    error.code === "ACTIVITY_NOT_FOUND"
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    overflow: "hidden",
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  actionSafeArea: {
    flexShrink: 0,
  },
  actions: {
    width: "100%",
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  state: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
});
