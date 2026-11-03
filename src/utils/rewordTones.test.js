import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storedRewordTone } from './rewordTones';

let stored;

beforeEach(() => {
  stored = {};
  vi.stubGlobal('localStorage', { getItem: key => stored[key] ?? null });
});

describe('storedRewordTone', () => {
  it('reads the tone saved with the user details', () => {
    stored.userDetails = JSON.stringify({ Theme: 'nord', RewordTone: 'formal' });
    expect(storedRewordTone()).toBe('formal');
  });

  it('is casual for a user who never picked one', () => {
    stored.userDetails = JSON.stringify({ Theme: 'nord' });
    expect(storedRewordTone()).toBe('casual');
  });

  it('is casual with no saved details, or details that are not JSON', () => {
    expect(storedRewordTone()).toBe('casual');
    stored.userDetails = 'undefined';
    expect(storedRewordTone()).toBe('casual');
  });

  it('is casual when storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('SecurityError'); } });
    expect(storedRewordTone()).toBe('casual');
  });
});
