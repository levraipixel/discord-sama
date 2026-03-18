import { describe, expect, it } from 'vitest';
import { getTimezoneOffsetMinutes } from './timezone';

describe('getTimezoneOffsetMinutes', () => {
  it('returns 0 for UTC', () => {
    const date = new Date('2026-06-01T12:00:00.000Z');
    expect(getTimezoneOffsetMinutes('UTC', date)).toBe(0);
  });

  it('returns +60 for Europe/Paris in winter (CET)', () => {
    const date = new Date('2026-01-15T12:00:00.000Z');
    expect(getTimezoneOffsetMinutes('Europe/Paris', date)).toBe(60);
  });

  it('returns +120 for Europe/Paris in summer (CEST)', () => {
    const date = new Date('2026-07-15T12:00:00.000Z');
    expect(getTimezoneOffsetMinutes('Europe/Paris', date)).toBe(120);
  });

  it('returns -300 for America/New_York in winter (EST)', () => {
    const date = new Date('2026-01-15T12:00:00.000Z');
    expect(getTimezoneOffsetMinutes('America/New_York', date)).toBe(-300);
  });

  it('returns -240 for America/New_York in summer (EDT)', () => {
    const date = new Date('2026-07-15T12:00:00.000Z');
    expect(getTimezoneOffsetMinutes('America/New_York', date)).toBe(-240);
  });
});
