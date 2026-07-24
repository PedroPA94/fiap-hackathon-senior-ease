import { Redirect, useRouter } from "expo-router";

import { CreateProfileScreen } from "../../src/presentation/features/profile";
import { useApplicationSession } from "../../src/presentation/providers";

export default function CreateProfileRoute() {
  const router = useRouter();
  const session = useApplicationSession();

  if (
    session.status !== "noProfiles" &&
    session.status !== "profileSelectionRequired"
  ) {
    return <Redirect href="/" />;
  }

  return (
    <CreateProfileScreen
      onSelectProfile={() =>
        router.replace("/(onboarding)/select-profile")
      }
    />
  );
}
