import type {
  ActivityReminder,
  HomeActivityOverview,
  TodayActivitySummary,
} from "@senior-ease/core";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Button, Card, ErrorState } from "../../../../components";
import { MobileHeader } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationContainer,
  useApplicationSession,
} from "../../../../providers";
import { LoadingScreen } from "../../../../screens/loading/loading-screen";
import {
  formatActivitySchedule,
  formatCompletionDate,
  formatReminderSchedule,
} from "../../utils/home-date-format";

const homeErrorMessage = "Não foi possível carregar o início. Tente novamente.";

export function HomeScreen() {
  const router = useRouter();
  const { useCases } = useApplicationContainer();
  const session = useApplicationSession();
  const { theme } = useAccessibilityTheme();
  const [overview, setOverview] = useState<HomeActivityOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const currentUserId = session.currentUser?.id ?? null;
  const isAdvanced = theme.mode === "advanced";

  const loadOverview = useCallback(
    async (refresh = false) => {
      if (loadingRef.current) {
        return;
      }

      if (!currentUserId) {
        setIsLoading(false);
        setErrorMessage(homeErrorMessage);
        return;
      }

      loadingRef.current = true;
      const requestId = ++requestIdRef.current;
      setErrorMessage(null);

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const nextOverview = await useCases.activities.getHomeOverview.execute({
          userId: currentUserId,
        });

        if (mountedRef.current && requestId === requestIdRef.current) {
          setOverview(nextOverview);
        }
      } catch {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setErrorMessage(homeErrorMessage);
        }
      } finally {
        loadingRef.current = false;

        if (mountedRef.current && requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [currentUserId, useCases.activities.getHomeOverview],
  );

  useEffect(() => {
    mountedRef.current = true;
    void loadOverview();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadOverview]);

  if (isLoading && !overview) {
    return <LoadingScreen />;
  }

  if (!overview) {
    return (
      <View
        style={[
          styles.screen,
          { backgroundColor: theme.colors.background.page },
        ]}
      >
        <MobileHeader />
        <View style={styles.stateContent}>
          <ErrorState
            message={errorMessage ?? homeErrorMessage}
            onRetry={() => void loadOverview()}
          />
        </View>
      </View>
    );
  }

  const navigateToActivities = () => router.push("/(tabs)/activities");
  const navigateToPersonalization = () =>
    router.push("/(tabs)/personalization");

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background.page }]}
    >
      <MobileHeader />
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.large }]}
        refreshControl={
          <RefreshControl
            colors={[theme.colors.primary.default]}
            onRefresh={() => void loadOverview(true)}
            refreshing={isRefreshing}
            tintColor={theme.colors.primary.default}
          />
        }
        testID="home-scroll-view"
      >
        <View style={{ gap: theme.spacing.xsmall }}>
          <AppText accessibilityRole="header" variant="titleBold">
            Olá, {session.currentUser?.name}!
          </AppText>
          <AppText color="muted">O que vamos fazer hoje?</AppText>
        </View>

        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => void loadOverview(true)}
          />
        ) : null}

        <NextActivityCard
          onViewActivities={navigateToActivities}
          overview={overview}
        />
        <TodaySummaryCard
          isAdvanced={isAdvanced}
          summary={overview.todaySummary}
        />
        <RemindersCard
          isAdvanced={isAdvanced}
          onViewActivities={navigateToActivities}
          reminders={overview.reminders}
        />

        <View
          accessibilityLabel="Ações rápidas"
          accessibilityRole="toolbar"
          style={[styles.quickActions, { gap: theme.spacing.regular }]}
        >
          <Button
            fullWidth={false}
            onPress={navigateToActivities}
            style={styles.quickAction}
          >
            Nova atividade
          </Button>
          {isAdvanced ? (
            <Button
              fullWidth={false}
              onPress={navigateToPersonalization}
              style={styles.quickAction}
              variant="secondary"
            >
              Ajustar visual
            </Button>
          ) : null}
        </View>

        {isAdvanced ? (
          <RecentHistoryCard activities={overview.recentCompletedActivities} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function NextActivityCard({
  overview,
  onViewActivities,
}: {
  overview: HomeActivityOverview;
  onViewActivities(): void;
}) {
  const { theme } = useAccessibilityTheme();
  const activity = overview.nextActivity;

  return (
    <Card style={{ gap: theme.spacing.regular }}>
      <AppText color="muted" variant="helper">
        Próxima atividade
      </AppText>
      {activity ? (
        <>
          <AppText variant="bodyLargeBold">{activity.title}</AppText>
          <AppText color="muted" variant="helper">
            {formatActivitySchedule(activity)}
          </AppText>
          <Button
            accessibilityLabel={`Ver atividades relacionadas a ${activity.title}`}
            onPress={onViewActivities}
          >
            Ver atividades
          </Button>
        </>
      ) : (
        <AppText>Você não possui atividades pendentes.</AppText>
      )}
    </Card>
  );
}

function TodaySummaryCard({
  summary,
  isAdvanced,
}: {
  summary: TodayActivitySummary;
  isAdvanced: boolean;
}) {
  const { theme } = useAccessibilityTheme();
  const openActivities = summary.pending + summary.inProgress;

  return (
    <Card style={{ gap: theme.spacing.regular }}>
      <AppText color="muted" variant="helper">
        Resumo do dia
      </AppText>
      {isAdvanced ? (
        <View style={[styles.summary, { gap: theme.spacing.small }]}>
          <SummaryItem label="Pendentes" value={summary.pending} />
          <SummaryItem
            color="warning"
            label="Em andamento"
            value={summary.inProgress}
          />
          <SummaryItem
            color="success"
            label="Concluídas"
            value={summary.completed}
          />
        </View>
      ) : (
        <AppText>{basicTodaySummaryLabel(openActivities)}</AppText>
      )}
    </Card>
  );
}

function SummaryItem({
  color = "default",
  label,
  value,
}: {
  color?: "default" | "warning" | "success";
  label: string;
  value: number;
}) {
  return (
    <View style={styles.summaryItem}>
      <AppText color={color} variant="titleBold">
        {value}
      </AppText>
      <AppText color="muted" variant="caption" style={styles.centeredText}>
        {label}
      </AppText>
    </View>
  );
}

function RemindersCard({
  reminders,
  isAdvanced,
  onViewActivities,
}: {
  reminders: readonly ActivityReminder[];
  isAdvanced: boolean;
  onViewActivities(): void;
}) {
  const { theme } = useAccessibilityTheme();

  if (reminders.length === 0) {
    return null;
  }

  const visibleReminders = isAdvanced
    ? reminders.slice(0, 3)
    : reminders.slice(0, 1);

  return (
    <Card style={{ gap: theme.spacing.medium }}>
      <AppText variant="bodyBold">Lembretes</AppText>
      {visibleReminders.map((reminder, index) => (
        <View
          key={reminder.activityId}
          style={[
            { gap: theme.spacing.small },
            index > 0 && {
              borderTopColor: theme.colors.border.default,
              borderTopWidth: theme.borderWidth.regular,
              paddingTop: theme.spacing.medium,
            },
          ]}
        >
          <AppText variant="bodyBold">{reminder.title}</AppText>
          <AppText color="muted" variant="helper">
            {formatReminderSchedule(reminder)}
          </AppText>
          <Button
            accessibilityLabel={`Ver atividades relacionadas a ${reminder.title}`}
            onPress={onViewActivities}
            variant="secondary"
          >
            Ver atividades
          </Button>
        </View>
      ))}
      {!isAdvanced && reminders.length > 1 ? (
        <AppText color="muted" variant="helper">
          {additionalRemindersLabel(reminders.length - 1)}
        </AppText>
      ) : null}
    </Card>
  );
}

function RecentHistoryCard({
  activities,
}: {
  activities: HomeActivityOverview["recentCompletedActivities"];
}) {
  const { theme } = useAccessibilityTheme();

  return (
    <Card style={{ gap: theme.spacing.regular }}>
      <AppText variant="bodyBold">Histórico recente</AppText>
      {activities.length === 0 ? (
        <AppText color="muted">
          Você ainda não concluiu nenhuma atividade.
        </AppText>
      ) : (
        activities.map((activity, index) => (
          <View
            key={activity.id}
            style={[
              index > 0 && {
                borderTopColor: theme.colors.border.default,
                borderTopWidth: theme.borderWidth.regular,
                paddingTop: theme.spacing.regular,
              },
            ]}
          >
            <AppText color="muted" variant="helper">
              Você concluiu “{activity.title}”{" "}
              {formatCompletionDate(activity.updatedAt)}.
            </AppText>
          </View>
        ))
      )}
    </Card>
  );
}

function basicTodaySummaryLabel(count: number): string {
  if (count === 0) {
    return "Você não possui atividades para fazer hoje.";
  }

  if (count === 1) {
    return "Você tem 1 atividade para fazer hoje.";
  }

  return `Você tem ${count} atividades para fazer hoje.`;
}

function additionalRemindersLabel(count: number): string {
  return `Você tem mais ${count} ${count === 1 ? "lembrete" : "lembretes"}.`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  stateContent: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    padding: 24,
    paddingTop: 20,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickAction: {
    flexGrow: 1,
    flexBasis: 140,
  },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    minWidth: 88,
    flex: 1,
    alignItems: "center",
  },
  centeredText: {
    textAlign: "center",
  },
});
