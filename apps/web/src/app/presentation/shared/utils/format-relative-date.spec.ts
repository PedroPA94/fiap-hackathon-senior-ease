import { describe, expect, it } from 'vitest';

import { formatRelativeDate } from './format-relative-date';

describe('formatRelativeDate', () => {
  it('formats a date from today', () => {
    const now = new Date(2026, 6, 19, 20, 0);
    const dateTime = new Date(2026, 6, 19, 18, 5).toISOString();

    expect(formatRelativeDate(dateTime, now)).toBe('hoje às 18:05');
  });

  it('formats a date from yesterday', () => {
    const now = new Date(2026, 6, 19, 10, 0);
    const dateTime = new Date(2026, 6, 18, 18, 0).toISOString();

    expect(formatRelativeDate(dateTime, now)).toBe('ontem às 18:00');
  });

  it('formats an older date from the same year', () => {
    const now = new Date(2026, 6, 19, 10, 0);
    const dateTime = new Date(2026, 4, 18, 15, 34).toISOString();

    expect(formatRelativeDate(dateTime, now)).toBe('no dia 18/05 às 15:34');
  });

  it('includes the year when it is different', () => {
    const now = new Date(2026, 0, 2, 10, 0);
    const dateTime = new Date(2025, 11, 30, 9, 7).toISOString();

    expect(formatRelativeDate(dateTime, now)).toBe('no dia 30/12/2025 às 09:07');
  });

  it('handles the previous day across months', () => {
    const now = new Date(2026, 7, 1, 10, 0);
    const dateTime = new Date(2026, 6, 31, 23, 30).toISOString();

    expect(formatRelativeDate(dateTime, now)).toBe('ontem às 23:30');
  });

  it('handles the previous day across years', () => {
    const now = new Date(2026, 0, 1, 10, 0);
    const dateTime = new Date(2025, 11, 31, 19, 0).toISOString();

    expect(formatRelativeDate(dateTime, now)).toBe('ontem às 19:00');
  });

  it('returns an empty string for an invalid date', () => {
    const now = new Date(2026, 6, 19, 10, 0);

    expect(formatRelativeDate('invalid-date', now)).toBe('');
  });
});
