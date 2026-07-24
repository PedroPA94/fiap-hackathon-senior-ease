import { View } from "react-native";

import { useAccessibilityTheme } from "../../providers";
import { Button } from "../button/button";
import { InlineFeedback } from "../inline-feedback/inline-feedback";

export type ErrorStateProps = {
  message: string;
  onRetry(): void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { theme } = useAccessibilityTheme();

  return (
    <View style={{ width: "100%", gap: theme.spacing.medium }}>
      <InlineFeedback variant="error">{message}</InlineFeedback>
      <Button onPress={onRetry}>Tentar novamente</Button>
    </View>
  );
}
