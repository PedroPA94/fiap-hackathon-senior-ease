import { Redirect, Stack } from "expo-router";

import { useApplicationSession } from "../../src/presentation/providers";
import { LoadingScreen } from "../../src/presentation/screens/loading/loading-screen";

export default function ActivitiesLayout() {
  const session = useApplicationSession();

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (session.status !== "ready") {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
