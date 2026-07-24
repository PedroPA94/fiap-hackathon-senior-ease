import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  defaultAccessibilityPreferences,
  validateAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@senior-ease/core";
import {
  createAccessibilityTheme,
  type AccessibilityTheme,
} from "@senior-ease/tokens";

export type AccessibilityThemeContextValue = {
  preferences: AccessibilityPreferences;
  theme: AccessibilityTheme;
  setPreferences: (preferences: AccessibilityPreferences) => void;
  resetPreferences: () => void;
};

export type AccessibilityThemeProviderProps = {
  children: ReactNode;
};

const AccessibilityThemeContext = createContext<
  AccessibilityThemeContextValue | undefined
>(undefined);

export function AccessibilityThemeProvider({
  children,
}: AccessibilityThemeProviderProps) {
  const [preferences, setCurrentPreferences] =
    useState<AccessibilityPreferences>(defaultAccessibilityPreferences);

  const setPreferences = useCallback(
    (nextPreferences: AccessibilityPreferences) => {
      setCurrentPreferences(validateAccessibilityPreferences(nextPreferences));
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    setCurrentPreferences(defaultAccessibilityPreferences);
  }, []);

  const theme = useMemo(
    () => createAccessibilityTheme(preferences),
    [preferences],
  );

  const value = useMemo<AccessibilityThemeContextValue>(
    () => ({
      preferences,
      theme,
      setPreferences,
      resetPreferences,
    }),
    [preferences, resetPreferences, setPreferences, theme],
  );

  return (
    <AccessibilityThemeContext.Provider value={value}>
      {children}
    </AccessibilityThemeContext.Provider>
  );
}

export function useAccessibilityTheme(): AccessibilityThemeContextValue {
  const context = useContext(AccessibilityThemeContext);

  if (!context) {
    throw new Error(
      "useAccessibilityTheme must be used within an AccessibilityThemeProvider.",
    );
  }

  return context;
}
