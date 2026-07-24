import { fireEvent, render, screen } from "@testing-library/react-native";

import type { LocalUserSummary } from "../../../../../application/session";
import { AccessibilityThemeProvider } from "../../../../providers";
import { ProfileSelectorItem } from "./profile-selector-item";

const user: LocalUserSummary = {
  id: "user-1",
  name: "Maria Helena",
  lastAccessedAt: "2026-07-24T12:00:00.000Z",
};

function renderItem(
  props: Partial<React.ComponentProps<typeof ProfileSelectorItem>> = {},
) {
  const onPress = jest.fn();

  render(
    <AccessibilityThemeProvider>
      <ProfileSelectorItem
        onPress={onPress}
        selected={false}
        user={user}
        {...props}
      />
    </AccessibilityThemeProvider>,
  );

  return { onPress };
}

describe("ProfileSelectorItem", () => {
  it("presents the profile name and handles press", () => {
    const { onPress } = renderItem();

    fireEvent.press(screen.getByRole("radio", { name: user.name }));

    expect(screen.getByText(user.name)).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes the unselected state without a check indicator", () => {
    renderItem();

    expect(
      screen.getByRole("radio", { name: user.name }).props.accessibilityState,
    ).toMatchObject({ selected: false });
    expect(screen.queryByTestId("selection-indicator")).not.toBeOnTheScreen();
  });

  it("exposes selected semantics and a non-color indicator", () => {
    renderItem({ selected: true });

    expect(
      screen.getByRole("radio", { name: user.name }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByTestId("selection-indicator", {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("✓", { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it("maintains at least a 48dp touch target", () => {
    renderItem();

    expect(screen.getByRole("radio", { name: user.name })).toHaveStyle({
      minHeight: 72,
    });
  });

  it("allows a long name to wrap without truncation", () => {
    const longName =
      "Maria Helena da Silva Albuquerque de Souza e Oliveira";

    renderItem({
      user: {
        ...user,
        name: longName,
      },
    });

    const name = screen.getByText(longName);

    expect(name.props.numberOfLines).toBeUndefined();
    expect(name.props.ellipsizeMode).toBeUndefined();
  });

  it("does not invoke press while disabled", () => {
    const { onPress } = renderItem({ disabled: true });

    fireEvent.press(screen.getByRole("radio", { name: user.name }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
