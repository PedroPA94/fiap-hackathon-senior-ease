import { formatDateOnlyLongPtBr } from './format-date-only';

describe('formatDateOnlyLongPtBr', () => {
  it('formats a date-only value in local time without a UTC shift', () => {
    expect(formatDateOnlyLongPtBr('2026-07-20')).toBe('20 de julho de 2026');
  });
});
