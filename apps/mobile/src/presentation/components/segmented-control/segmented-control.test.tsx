import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../providers";
import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
  { value: "extra", label: "Extra" },
] as const;

function renderControl({
  value = "large",
  disabled = false,
  onChange = jest.fn(),
}: {
  value?: (typeof options)[number]["value"];
  disabled?: boolean;
  onChange?: jest.Mock<void, [(typeof options)[number]["value"]]>;
} = {}) {
  render(
    <AccessibilityThemeProvider>
      <SegmentedControl
        disabled={disabled}
        label="Tamanho da fonte"
        onChange={onChange}
        options={options}
        value={value}
      />
    </AccessibilityThemeProvider>,
  );

  return { onChange };
}

describe("SegmentedControl", () => {
  it("renders the group label and every option", () => {
    renderControl();

    expect(
      screen.getByLabelText("Tamanho da fonte").props.accessibilityRole,
    ).toBe("radiogroup");
    expect(screen.getByRole("radio", { name: "Normal" })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "Grande" })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "Extra" })).toBeOnTheScreen();
  });

  it("reflects the current selection in accessible state", () => {
    renderControl({ value: "extra" });

    expect(
      screen.getByRole("radio", { name: "Extra" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByRole("radio", { name: "Grande" }).props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("calls onChange with the pressed option", () => {
    const { onChange } = renderControl();

    fireEvent.press(screen.getByRole("radio", { name: "Extra" }));

    expect(onChange).toHaveBeenCalledWith("extra");
  });

  it("blocks interaction and announces disabled state", () => {
    const { onChange } = renderControl({ disabled: true });

    const option = screen.getByRole("radio", { name: "Normal" });
    fireEvent.press(option);

    expect(onChange).not.toHaveBeenCalled();
    expect(option.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("wraps whole pills while keeping each label on one line", () => {
    renderControl();
    const extraLabel = screen.getByText("Extra");
    const normalOption = screen.getByRole("radio", { name: "Normal" });

    expect(extraLabel.props.numberOfLines).toBe(1);
    expect(screen.getByTestId("segmented-control-options").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flexWrap: "wrap" }),
      ]),
    );
    expect(normalOption.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flexGrow: 1,
          flexShrink: 0,
        }),
      ]),
    );
  });
});
