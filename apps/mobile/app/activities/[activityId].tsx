import { useLocalSearchParams } from "expo-router";

import { ActivityGuidedScreen } from "../../src/presentation/features/activities";

export default function ActivityDetailsRoute() {
  const params = useLocalSearchParams<{
    activityId?: string | string[];
  }>();
  const activityId = Array.isArray(params.activityId)
    ? params.activityId[0]
    : params.activityId;

  return <ActivityGuidedScreen activityId={activityId} />;
}
