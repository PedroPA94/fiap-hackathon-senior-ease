export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1200,
} as const;

export type BreakpointToken = keyof typeof breakpoints;
