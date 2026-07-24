export const appFontFamily = {
  regular: "Inter",
  semibold: "Inter-SemiBold",
} as const;

export function getAppFontFamily(fontWeight: number): string {
  return fontWeight >= 600 ? appFontFamily.semibold : appFontFamily.regular;
}
