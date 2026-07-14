import type { FontSizePreference } from "@senior-ease/core";

export const fontFamily = {
  primary: "Inter",
  webFallback: "Arial, sans-serif",
} as const;

export const baseFontSize = {
  caption: 12,
  helper: 14,
  body: 16,
  bodyLarge: 18,
  title: 24,
  heading: 32,
  display: 40,
  displayLarge: 44,
} as const;

export const fontWeight = {
  regular: 400,
  bold: 600,
} as const;

export const lineHeightMultiplier = 1.2;

export type TextStyleToken =
  | "caption"
  | "captionBold"
  | "helper"
  | "helperBold"
  | "body"
  | "bodyBold"
  | "bodyLarge"
  | "bodyLargeBold"
  | "title"
  | "titleBold"
  | "heading"
  | "headingBold"
  | "display"
  | "displayBold"
  | "displayLarge"
  | "displayLargeBold";

export type TypographyTextStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
};

export type TypographyScale = Record<TextStyleToken, TypographyTextStyle>;

const fontSizeOffset: Record<FontSizePreference, number> = {
  normal: 0,
  large: 4,
  extra: 8,
};

function createLineHeight(fontSize: number): number {
  return Math.round(fontSize * lineHeightMultiplier);
}

function createTextStyle(
  fontSize: number,
  fontWeightValue: number,
): TypographyTextStyle {
  return {
    fontFamily: fontFamily.primary,
    fontSize,
    lineHeight: createLineHeight(fontSize),
    fontWeight: fontWeightValue,
  };
}

export function createTypographyScale(
  preference: FontSizePreference,
): TypographyScale {
  const offset = fontSizeOffset[preference];

  const caption = baseFontSize.caption + offset;
  const helper = baseFontSize.helper + offset;
  const body = baseFontSize.body + offset;
  const bodyLarge = baseFontSize.bodyLarge + offset;
  const title = baseFontSize.title + offset;
  const heading = baseFontSize.heading + offset;
  const display = baseFontSize.display + offset;
  const displayLarge = baseFontSize.displayLarge + offset;

  return {
    caption: createTextStyle(caption, fontWeight.regular),
    captionBold: createTextStyle(caption, fontWeight.bold),

    helper: createTextStyle(helper, fontWeight.regular),
    helperBold: createTextStyle(helper, fontWeight.bold),

    body: createTextStyle(body, fontWeight.regular),
    bodyBold: createTextStyle(body, fontWeight.bold),

    bodyLarge: createTextStyle(bodyLarge, fontWeight.regular),
    bodyLargeBold: createTextStyle(bodyLarge, fontWeight.bold),

    title: createTextStyle(title, fontWeight.regular),
    titleBold: createTextStyle(title, fontWeight.bold),

    heading: createTextStyle(heading, fontWeight.regular),
    headingBold: createTextStyle(heading, fontWeight.bold),

    display: createTextStyle(display, fontWeight.regular),
    displayBold: createTextStyle(display, fontWeight.bold),

    displayLarge: createTextStyle(displayLarge, fontWeight.regular),
    displayLargeBold: createTextStyle(displayLarge, fontWeight.bold),
  };
}
