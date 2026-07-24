import { render } from "@testing-library/react-native";

import type { ApplicationContainer } from "../../composition";
import { createApplicationContainer } from "../../composition";
import { InMemoryStorage } from "../../infrastructure/storage";
import {
  ApplicationContainerProvider,
  useApplicationContainer,
} from "./application-container-provider";

type ContainerCaptureProps = {
  onContainer: (container: ApplicationContainer) => void;
};

function ContainerCapture({ onContainer }: ContainerCaptureProps) {
  onContainer(useApplicationContainer());

  return null;
}

function MissingProviderConsumer() {
  useApplicationContainer();

  return null;
}

describe("ApplicationContainerProvider", () => {
  it("exposes a default application container", () => {
    let capturedContainer: ApplicationContainer | undefined;

    render(
      <ApplicationContainerProvider>
        <ContainerCapture
          onContainer={(container) => {
            capturedContainer = container;
          }}
        />
      </ApplicationContainerProvider>,
    );

    expect(capturedContainer?.repositories.activities).toBeDefined();
    expect(capturedContainer?.repositories.userProfiles).toBeDefined();
    expect(
      capturedContainer?.repositories.accessibilityPreferences,
    ).toBeDefined();
    expect(capturedContainer?.useCases.userProfiles.create).toBeDefined();
  });

  it("uses exactly the provided container", () => {
    const providedContainer = createApplicationContainer({
      storage: new InMemoryStorage(),
    });
    let capturedContainer: ApplicationContainer | undefined;

    render(
      <ApplicationContainerProvider container={providedContainer}>
        <ContainerCapture
          onContainer={(container) => {
            capturedContainer = container;
          }}
        />
      </ApplicationContainerProvider>,
    );

    expect(capturedContainer).toBe(providedContainer);
  });

  it("preserves the container identity across rerenders", () => {
    const capturedContainers: ApplicationContainer[] = [];
    const onContainer = (container: ApplicationContainer) => {
      capturedContainers.push(container);
    };
    const rendered = render(
      <ApplicationContainerProvider>
        <ContainerCapture onContainer={onContainer} />
      </ApplicationContainerProvider>,
    );
    const firstContainer = capturedContainers.at(-1);

    rendered.rerender(
      <ApplicationContainerProvider>
        <ContainerCapture onContainer={onContainer} />
      </ApplicationContainerProvider>,
    );

    expect(capturedContainers.at(-1)).toBe(firstContainer);
  });

  it("creates a new container after remounting without an override", () => {
    let firstContainer: ApplicationContainer | undefined;
    const firstRender = render(
      <ApplicationContainerProvider>
        <ContainerCapture
          onContainer={(container) => {
            firstContainer = container;
          }}
        />
      </ApplicationContainerProvider>,
    );
    firstRender.unmount();

    let secondContainer: ApplicationContainer | undefined;
    render(
      <ApplicationContainerProvider>
        <ContainerCapture
          onContainer={(container) => {
            secondContainer = container;
          }}
        />
      </ApplicationContainerProvider>,
    );

    expect(secondContainer).not.toBe(firstContainer);
  });

  it("throws a clear error when the hook is used outside the provider", () => {
    expect(() => render(<MissingProviderConsumer />)).toThrow(
      "useApplicationContainer must be used within an ApplicationContainerProvider.",
    );
  });
});
