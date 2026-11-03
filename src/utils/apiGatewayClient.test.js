import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({ default: { post: vi.fn(), get: vi.fn(), defaults: {} } }));
vi.mock('./utils', () => ({ isTokenExpired: () => false }));
vi.mock('./authService', () => ({ refreshTokens: vi.fn() }));
vi.mock('./alertBus', () => ({ showAlert: vi.fn() }));

import axios from 'axios';
import { showAlert } from './alertBus';
import { rewordTask } from './apiGatewayClient';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('sessionStorage', { accessToken: 'token' });
});

describe('rewordTask', () => {
  it('posts the text with its context and returns the new text', async () => {
    axios.post.mockResolvedValue({ data: { data: { text: 'Call the dentist' } } });

    const text = await rewordTask({ text: 'Call', category: 'Dentist', board: 'Life admin', tone: 'formal' });

    expect(text).toBe('Call the dentist');
    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toBe('/reword-task');
    expect(body).toEqual({ text: 'Call', category: 'Dentist', board: 'Life admin', tone: 'formal' });
    expect(config.headers.Authorization).toBe('Bearer token');
  });

  it('gives up after 12 s, past the server timeout, so the task never stays locked', async () => {
    axios.post.mockResolvedValue({ data: { data: {} } });
    await rewordTask({ text: 'Call' });
    expect(axios.post.mock.calls[0][2].timeout).toBe(12000);
  });

  it('explains a failure in an alert and rethrows', async () => {
    const err = { isAxiosError: true, response: { status: 429, data: { error: 'daily_limit' } } };
    axios.post.mockRejectedValue(err);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(rewordTask({ text: 'Call' })).rejects.toBe(err);
    expect(showAlert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Daily rewords used up ✨' }));
  });
});
