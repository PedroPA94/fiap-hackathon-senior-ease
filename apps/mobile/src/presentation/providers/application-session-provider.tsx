import type { EntityId, UserProfile } from "@senior-ease/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  ApplicationSessionSnapshot,
  LocalUserSummary,
} from "../../application/session";
import { useApplicationContainer } from "./application-container-provider";

export type ApplicationSessionStatus =
  | "loading"
  | ApplicationSessionSnapshot["status"]
  | "error";

export type ApplicationSessionContextValue = {
  status: ApplicationSessionStatus;
  users: readonly LocalUserSummary[];
  currentUser: UserProfile | null;
  error: Error | null;
  retry(): Promise<void>;
  selectProfile(userId: EntityId): Promise<void>;
  clearCurrentProfile(): Promise<void>;
  registerProfile(profile: UserProfile): Promise<void>;
  completeOnboarding(): Promise<void>;
};

export type ApplicationSessionProviderProps = {
  children: ReactNode;
};

type ProviderState = {
  status: ApplicationSessionStatus;
  users: readonly LocalUserSummary[];
  currentUser: UserProfile | null;
  error: Error | null;
};

const initialState: ProviderState = {
  status: "loading",
  users: [],
  currentUser: null,
  error: null,
};

const ApplicationSessionContext = createContext<
  ApplicationSessionContextValue | undefined
>(undefined);

export function ApplicationSessionProvider({
  children,
}: ApplicationSessionProviderProps) {
  const { services } = useApplicationContainer();
  const [state, setState] = useState<ProviderState>(initialState);
  const mountedRef = useRef(true);
  const operationIdRef = useRef(0);

  const execute = useCallback(
    async (
      operation: () => Promise<ApplicationSessionSnapshot>,
    ): Promise<void> => {
      const operationId = ++operationIdRef.current;

      setState({
        status: "loading",
        users: [],
        currentUser: null,
        error: null,
      });

      try {
        const snapshot = await operation();

        if (mountedRef.current && operationId === operationIdRef.current) {
          setState({
            ...snapshot,
            error: null,
          });
        }
      } catch (error) {
        if (mountedRef.current && operationId === operationIdRef.current) {
          setState({
            status: "error",
            users: [],
            currentUser: null,
            error: toError(error),
          });
        }
      }
    },
    [],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    void execute(() => services.session.bootstrap());
  }, [execute, services.session]);

  const retry = useCallback(
    () => execute(() => services.session.bootstrap()),
    [execute, services.session],
  );

  const selectProfile = useCallback(
    (userId: EntityId) =>
      execute(() => services.session.selectProfile(userId)),
    [execute, services.session],
  );

  const clearCurrentProfile = useCallback(
    () => execute(() => services.session.clearCurrentProfile()),
    [execute, services.session],
  );

  const registerProfile = useCallback(
    (profile: UserProfile) =>
      execute(() => services.session.registerProfile(profile)),
    [execute, services.session],
  );

  const completeOnboarding = useCallback(
    () => execute(() => services.session.completeOnboarding()),
    [execute, services.session],
  );

  const value = useMemo<ApplicationSessionContextValue>(
    () => ({
      ...state,
      retry,
      selectProfile,
      clearCurrentProfile,
      registerProfile,
      completeOnboarding,
    }),
    [
      clearCurrentProfile,
      completeOnboarding,
      registerProfile,
      retry,
      selectProfile,
      state,
    ],
  );

  return (
    <ApplicationSessionContext.Provider value={value}>
      {children}
    </ApplicationSessionContext.Provider>
  );
}

export function useApplicationSession(): ApplicationSessionContextValue {
  const context = useContext(ApplicationSessionContext);

  if (!context) {
    throw new Error(
      "useApplicationSession must be used within an ApplicationSessionProvider.",
    );
  }

  return context;
}

function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("Unknown application session error.");
}
