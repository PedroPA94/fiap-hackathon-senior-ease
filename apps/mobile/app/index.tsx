import { View } from "react-native";

import { AppText, Button, InlineFeedback } from "../src/presentation/components";
import { Screen } from "../src/presentation/layout";
import {
  useAccessibilityTheme,
  useApplicationSession,
} from "../src/presentation/providers";
import { LoadingScreen } from "../src/presentation/screens/loading/loading-screen";
import { TechnicalValidationScreen } from "../src/presentation/screens/technical-validation/technical-validation-screen";

export default function IndexRoute() {
  const session = useApplicationSession();

  switch (session.status) {
    case "loading":
      return <LoadingScreen />;
    case "error":
      return (
        <SessionStateScreen title="Não foi possível iniciar a sessão">
          <InlineFeedback variant="error">
            Não foi possível ler os dados locais. Tente novamente.
          </InlineFeedback>
          <Button onPress={() => void session.retry()}>
            Tentar novamente
          </Button>
        </SessionStateScreen>
      );
    case "noProfiles":
      return (
        <SessionStateScreen title="Nenhum perfil local">
          <AppText color="muted">
            O fluxo de criação de perfil será apresentado aqui.
          </AppText>
        </SessionStateScreen>
      );
    case "profileSelectionRequired":
      return (
        <SessionStateScreen title="Seleção de perfil necessária">
          <AppText color="muted">
            {formatProfileCount(session.users.length)}
          </AppText>
        </SessionStateScreen>
      );
    case "onboardingRequired":
      return (
        <SessionStateScreen title="Configuração inicial pendente">
          <AppText color="muted">
            Onboarding pendente para {session.currentUser?.name}.
          </AppText>
        </SessionStateScreen>
      );
    default:
      return <TechnicalValidationScreen />;
  }
}

type SessionStateScreenProps = {
  title: string;
  children: React.ReactNode;
};

function SessionStateScreen({
  title,
  children,
}: SessionStateScreenProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          gap: theme.spacing.large,
        }}
      >
        <AppText accessibilityRole="header" variant="titleBold">
          {title}
        </AppText>
        {children}
      </View>
    </Screen>
  );
}

function formatProfileCount(count: number): string {
  return count === 1
    ? "1 perfil local aguardando seleção."
    : `${count} perfis locais aguardando seleção.`;
}
