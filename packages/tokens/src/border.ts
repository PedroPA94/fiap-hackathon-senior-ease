export const borderWidth = {
  none: 0,
  regular: 1,
  strong: 2,
} as const;

export const borderStyle = {
  solid: "solid",
} as const;

export type BorderWidthToken = keyof typeof borderWidth;
export type BorderStyleToken = keyof typeof borderStyle;
