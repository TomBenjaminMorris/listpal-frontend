import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./apiGatewayClient', () => ({
  getBoards: vi.fn(),
  getUser: vi.fn(),
  setUpAccount: vi.fn()
}));

import { getBoards, getUser, setUpAccount } from './apiGatewayClient';
import { loadAccount } from './loadAccount';

const user = { Theme: 'ocean' };
const demoBoard = { SK: 'b#demo' };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('loadAccount', () => {
  it('uses the first read for an existing user', async () => {
    getUser.mockResolvedValue([user]);

    const result = await loadAccount(Promise.resolve([demoBoard]));

    expect(result).toEqual({ user, boardsData: [demoBoard] });
    expect(setUpAccount).not.toHaveBeenCalled();
    expect(getBoards).not.toHaveBeenCalled();
  });

  it('sets up a new user once, then reads the user and boards again', async () => {
    getUser.mockResolvedValueOnce([]).mockResolvedValueOnce([user]);
    getBoards.mockResolvedValue([demoBoard]);

    const result = await loadAccount(Promise.resolve([]));

    expect(result).toEqual({ user, boardsData: [demoBoard] });
    expect(setUpAccount).toHaveBeenCalledTimes(1);
  });

  it('passes on a failed setup without reading again', async () => {
    getUser.mockResolvedValue([]);
    setUpAccount.mockRejectedValue(new Error('setup failed'));

    await expect(loadAccount(Promise.resolve([]))).rejects.toThrow('setup failed');

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(getBoards).not.toHaveBeenCalled();
  });

  it('returns no user if the second read still finds none', async () => {
    getUser.mockResolvedValue([]);
    getBoards.mockResolvedValue([demoBoard]);

    const result = await loadAccount(Promise.resolve([]));

    expect(result).toEqual({ user: undefined, boardsData: [demoBoard] });
    expect(setUpAccount).toHaveBeenCalledTimes(1);
  });
});
