import { Redirect, useRouter } from "expo-router";

import { SelectProfileScreen } from "../../src/presentation/features/profile";
import { useApplicationSession } from "../../src/presentation/providers";

export default function SelectProfileRoute() {
  const router = useRouter();
  const session = useApplicationSession();

  if (session.status === "noProfiles" || session.users.length === 0) {
    return <Redirect href="/(onboarding)/create-profile" />;
  }

  if (session.status !== "profileSelectionRequired") {
    return <Redirect href="/" />;
  }

  return (
    <SelectProfileScreen
      onCreateProfile={() =>
        router.push("/(onboarding)/create-profile")
      }
    />
  );
}
