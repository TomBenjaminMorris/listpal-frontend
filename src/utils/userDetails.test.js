import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readStoredUserDetails, saveUserSetting } from './userDetails';

let stored;

beforeEach(() => {
  stored = {};
  vi.stubGlobal('localStorage', { getItem: key => stored[key] ?? null, setItem: (key, value) => { stored[key] = value; } });
});

describe('readStoredUserDetails', () => {
  it('reads the details saved by the last load', () => {
    stored.userDetails = JSON.stringify({ Theme: 'monokai' });
    expect(readStoredUserDetails()).toEqual({ Theme: 'monokai' });
  });

  it.each([['nothing saved', undefined], ['the string "undefined"', 'undefined'], ['broken JSON', '{"Theme"']])('is null with %s', (_, value) => {
    if (value !== undefined) stored.userDetails = value;
    expect(readStoredUserDetails()).toBeNull();
  });

  it('is null when storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('SecurityError'); } });
    expect(readStoredUserDetails()).toBeNull();
  });
});

describe('saveUserSetting', () => {
  it('applies and stores the setting at once, and saves it to the server', () => {
    let details = { Theme: 'monokai', RewordTone: 'casual' };
    const save = vi.fn().mockResolvedValue();
    saveUserSetting(update => { details = update(details); }, 'Theme', 'tokyo-night', save);
    expect(details).toEqual({ Theme: 'tokyo-night', RewordTone: 'casual' });
    expect(JSON.parse(stored.userDetails)).toEqual(details);
    expect(save).toHaveBeenCalledWith('tokyo-night');
  });

  it('keeps the setting when the server save fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => { });
    let details = {};
    saveUserSetting(update => { details = update(details); }, 'RewordTone', 'formal', () => Promise.reject(new Error('offline')));
    await new Promise(resolve => setTimeout(resolve));
    expect(details).toEqual({ RewordTone: 'formal' });
    expect(log).toHaveBeenCalled();
  });
});
