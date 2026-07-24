import type {
  Activity,
  ActivityListFilter,
} from "@senior-ease/core";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  SegmentedControl,
  type SegmentedControlOption,
} from "../../../../components";
import { MobileHeader } from "../../../../layout";
import {
  useAccessibilityTheme,
  useApplicationContainer,
  useApplicationSession,
} from "../../../../providers";
import { ActivityListItem } from "../../components/activity-list-item/activity-list-item";

const activityErrorMessage =
  "Não foi possível carregar suas atividades. Tente novamente.";

const FILTER_OPTIONS: readonly SegmentedControlOption<ActivityListFilter>[] = [
  { value: "all", label: "Todas" },
  { value: "today", label: "Hoje" },
  { value: "pending", label: "Não iniciadas" },
  { value: "inProgress", label: "Em andamento" },
  { value: "completed", label: "Concluídas" },
];

const EMPTY_MESSAGES: Readonly<Record<ActivityListFilter, string>> = {
  all: "Você ainda não criou nenhuma atividade.",
  today: "Você não possui atividades para hoje.",
  pending: "Você não possui atividades não iniciadas.",
  inProgress: "Você não possui atividades em andamento.",
  completed: "Você ainda não concluiu nenhuma atividade.",
};

export function ActivitiesScreen() {
  const router = useRouter();
  const { useCases } = useApplicationContainer();
  const session = useApplicationSession();
  const { theme } = useAccessibilityTheme();
  const [filter, setFilter] = useState<ActivityListFilter>("all");
  const [activities, setActivities] = useState<readonly Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const currentUserId = session.currentUser?.id ?? null;
  const isCompact = theme.mode === "basic";

  const loadActivities = useCallback(
    async (
      selectedFilter: ActivityListFilter,
      refresh = false,
    ) => {
      const requestId = ++requestIdRef.current;
      setErrorMessage(null);

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setActivities([]);
      }

      if (!currentUserId) {
        setErrorMessage(activityErrorMessage);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        const nextActivities =
          await useCases.activities.listByUser.execute({
            userId: currentUserId,
            filter: selectedFilter,
          });

        if (mountedRef.current && requestId === requestIdRef.current) {
          setActivities(nextActivities);
        }
      } catch {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setActivities([]);
          setErrorMessage(activityErrorMessage);
        }
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [currentUserId, useCases.activities.listByUser],
  );

  useEffect(() => {
    mountedRef.current = true;
    const loadPromise = Promise.resolve().then(() =>
      loadActivities(filter),
    );
    void loadPromise;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [filter, loadActivities]);

  const navigateToNewActivity = () =>
    router.push("/activities/new");
  const navigateToActivity = (activityId: Activity["id"]) =>
    router.push({
      pathname: "/activities/[activityId]",
      params: { activityId },
    });

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background.page },
      ]}
    >
      <MobileHeader />
      <FlatList
        contentContainerStyle={styles.content}
        data={activities}
        ItemSeparatorComponent={() => (
          <View style={{ height: theme.spacing.large }} />
        )}
        keyExtractor={(activity) => activity.id}
        ListEmptyComponent={
          <ActivityListState
            emptyMessage={EMPTY_MESSAGES[filter]}
            errorMessage={errorMessage}
            isLoading={isLoading}
            onCreate={navigateToNewActivity}
            onRetry={() => void loadActivities(filter)}
            showCreateAction={filter === "all"}
          />
        }
        ListHeaderComponent={
          <View
            style={[
              styles.listHeader,
              { gap: theme.spacing.large },
            ]}
          >
            <View style={{ gap: theme.spacing.xsmall }}>
              <AppText accessibilityRole="header" variant="headingBold">
                Atividades
              </AppText>
              <AppText color="muted">
                Organize suas tarefas e acompanhe cada etapa.
              </AppText>
            </View>

            <Button onPress={navigateToNewActivity}>
              Nova atividade
            </Button>

            <SegmentedControl<ActivityListFilter>
              label="Filtrar atividades"
              onChange={setFilter}
              options={FILTER_OPTIONS}
              value={filter}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.colors.primary.default]}
            onRefresh={() => void loadActivities(filter, true)}
            refreshing={isRefreshing}
            tintColor={theme.colors.primary.default}
          />
        }
        renderItem={({ item }) => (
          <ActivityListItem
            activity={item}
            compact={isCompact}
            onViewSteps={navigateToActivity}
          />
        )}
        showsVerticalScrollIndicator
        testID="activities-list"
      />
    </View>
  );
}

function ActivityListState({
  emptyMessage,
  errorMessage,
  isLoading,
  onCreate,
  onRetry,
  showCreateAction,
}: {
  emptyMessage: string;
  errorMessage: string | null;
  isLoading: boolean;
  onCreate(): void;
  onRetry(): void;
  showCreateAction: boolean;
}) {
  const { theme } = useAccessibilityTheme();

  if (isLoading) {
    return (
      <View
        accessibilityLabel="Carregando atividades..."
        accessibilityRole="progressbar"
        accessible
        style={[
          styles.state,
          { gap: theme.spacing.medium },
        ]}
      >
        <ActivityIndicator
          color={theme.colors.primary.default}
          size="large"
        />
        <AppText color="muted">Carregando atividades...</AppText>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.state}>
        <ErrorState message={errorMessage} onRetry={onRetry} />
      </View>
    );
  }

  return (
    <View style={styles.state}>
      <EmptyState
        actionLabel={showCreateAction ? "Criar atividade" : undefined}
        onAction={showCreateAction ? onCreate : undefined}
        title={emptyMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  listHeader: {
    marginBottom: 24,
  },
  state: {
    width: "100%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
});
