import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiFeaturesEnabled, storedAIFeaturesEnabled } from './aiFeatures';

let stored;

beforeEach(() => {
  stored = {};
  vi.stubGlobal('localStorage', { getItem: key => stored[key] ?? null });
});

describe('aiFeaturesEnabled', () => {
  it('is off only when the user turned it off', () => {
    expect(aiFeaturesEnabled({ AIEnabled: false })).toBe(false);
    expect(aiFeaturesEnabled({ AIEnabled: true })).toBe(true);
  });

  it('is on for a user who never set it, or before the record loads', () => {
    expect(aiFeaturesEnabled({ Theme: 'monokai' })).toBe(true);
    expect(aiFeaturesEnabled(null)).toBe(true);
  });
});

describe('storedAIFeaturesEnabled', () => {
  it('reads the setting saved with the user details', () => {
    stored.userDetails = JSON.stringify({ Theme: 'monokai', AIEnabled: false });
    expect(storedAIFeaturesEnabled()).toBe(false);
  });

  it('is on with no saved details, or details that are not JSON', () => {
    expect(storedAIFeaturesEnabled()).toBe(true);
    stored.userDetails = 'undefined';
    expect(storedAIFeaturesEnabled()).toBe(true);
  });

  it('is on when storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('SecurityError'); } });
    expect(storedAIFeaturesEnabled()).toBe(true);
  });
});
