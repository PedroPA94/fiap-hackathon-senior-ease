import { fireEvent, render, screen } from "@testing-library/react-native";

import { AccessibilityThemeProvider } from "../../providers";
import { TextField, type TextFieldProps } from "./text-field";

const defaultProps: TextFieldProps = {
  label: "Nome",
  value: "",
  onChangeText: jest.fn(),
};

function renderField(props: Partial<TextFieldProps> = {}) {
  const onChangeText = jest.fn();
  const rendered = render(
    <AccessibilityThemeProvider>
      <TextField {...defaultProps} {...props} onChangeText={onChangeText} />
    </AccessibilityThemeProvider>,
  );

  return { ...rendered, onChangeText };
}

describe("TextField", () => {
  it("renders a visible required label and changes text", () => {
    const { onChangeText } = renderField({ required: true });
    const input = screen.getByLabelText("Nome, campo obrigatório");

    fireEvent.changeText(input, "Maria");

    expect(screen.getByText("Nome *")).toBeOnTheScreen();
    expect(onChangeText).toHaveBeenCalledWith("Maria");
    expect(input.props.allowFontScaling).toBe(true);
  });

  it("shows hint only when there is no error", () => {
    const rendered = renderField({ hint: "Digite seu nome completo." });

    expect(screen.getByText("Digite seu nome completo.")).toBeOnTheScreen();

    rendered.rerender(
      <AccessibilityThemeProvider>
        <TextField
          {...defaultProps}
          errorMessage="Digite seu nome para continuar."
          hint="Digite seu nome completo."
        />
      </AccessibilityThemeProvider>,
    );

    expect(
      screen.queryByText("Digite seu nome completo."),
    ).not.toBeOnTheScreen();
    expect(
      screen.getByRole("alert", {
        name: "Digite seu nome para continuar.",
      }),
    ).toHaveProp("accessibilityLiveRegion", "assertive");
  });

  it("reflects invalid and disabled accessibility states", () => {
    renderField({
      disabled: true,
      errorMessage: "Campo inválido.",
    });

    const input = screen.getByLabelText("Nome");

    expect(input.props.editable).toBe(false);
    expect(input.props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(input.props["aria-invalid"]).toBe(true);
  });

  it("forwards multiline, maxLength and keyboard submission", () => {
    const onSubmitEditing = jest.fn();

    renderField({
      maxLength: 80,
      multiline: true,
      onSubmitEditing,
    });

    const input = screen.getByLabelText("Nome");

    fireEvent(input, "submitEditing");

    expect(input.props.multiline).toBe(true);
    expect(input.props.maxLength).toBe(80);
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });

  it("changes border emphasis on focus without relying only on color", () => {
    renderField();
    const input = screen.getByLabelText("Nome");

    fireEvent(input, "focus");

    expect(input).toHaveStyle({
      borderColor: "#2563EB",
      borderWidth: 2,
    });
  });
});
