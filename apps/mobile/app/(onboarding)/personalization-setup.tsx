import { Redirect } from "expo-router";

import { PersonalizationSetupScreen } from "../../src/presentation/features/personalization";
import { useApplicationSession } from "../../src/presentation/providers";
import { LoadingScreen } from "../../src/presentation/screens/loading/loading-screen";

export default function PersonalizationSetupRoute() {
  const session = useApplicationSession();

  switch (session.status) {
    case "loading":
      return <LoadingScreen />;
    case "noProfiles":
      return <Redirect href="/(onboarding)/create-profile" />;
    case "profileSelectionRequired":
      return <Redirect href="/(onboarding)/select-profile" />;
    case "onboardingRequired":
      return <PersonalizationSetupScreen />;
    default:
      return <Redirect href="/" />;
  }
}
