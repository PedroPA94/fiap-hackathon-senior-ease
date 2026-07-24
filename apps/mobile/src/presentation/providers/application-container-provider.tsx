import { createContext, useContext, useState, type ReactNode } from "react";

import {
  createApplicationContainer,
  type ApplicationContainer,
} from "../../composition";

export type ApplicationContainerProviderProps = {
  children: ReactNode;
  container?: ApplicationContainer;
};

const ApplicationContainerContext = createContext<
  ApplicationContainer | undefined
>(undefined);

export function ApplicationContainerProvider({
  children,
  container,
}: ApplicationContainerProviderProps) {
  const [resolvedContainer] = useState(
    () => container ?? createApplicationContainer(),
  );

  return (
    <ApplicationContainerContext.Provider value={resolvedContainer}>
      {children}
    </ApplicationContainerContext.Provider>
  );
}

export function useApplicationContainer(): ApplicationContainer {
  const container = useContext(ApplicationContainerContext);

  if (!container) {
    throw new Error(
      "useApplicationContainer must be used within an ApplicationContainerProvider.",
    );
  }

  return container;
}
