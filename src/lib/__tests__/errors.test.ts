import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/lib/errors';

describe('getErrorMessage', () => {
  it('extracts message from Error', () => {
    expect(getErrorMessage(new Error('test'))).toBe('test');
  });
  it('handles null', () => {
    expect(getErrorMessage(null)).toBe('שגיאה לא ידועה');
  });
  it('handles undefined', () => {
    expect(getErrorMessage(undefined)).toBe('שגיאה לא ידועה');
  });
});
