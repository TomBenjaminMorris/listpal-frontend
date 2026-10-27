import { describe, it, expect, afterEach, vi } from 'vitest';
import { describeApiError, apiErrorAlert, SESSION_EXPIRED } from './apiErrors';

const httpError = status => ({ isAxiosError: true, response: { status } });
const networkError = { isAxiosError: true, message: 'Network Error' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('describeApiError', () => {
  it('offers sign-in for an expired session', () => {
    const result = describeApiError({ code: SESSION_EXPIRED }, 'load your boards');
    expect(result.signIn).toBe(true);
    expect(result.textValue).toContain('load your boards');
  });

  it('treats a 401 as an expired session', () => {
    expect(describeApiError(httpError(401), 'x').signIn).toBe(true);
  });

  it('says so when the browser is offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(describeApiError(networkError, 'x').title).toMatch(/offline/);
  });

  it('reports a connection problem when there is no response while online', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(describeApiError(networkError, 'x').title).toMatch(/Connection/);
  });

  it('does not blame the network for an error that is not from axios', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(describeApiError(new Error('IDB closed'), 'x').title).toBe('Well, that was odd 🤔');
  });

  it.each([
    [403, /permission/],
    [404, /no longer exists/],
    [429, /Too many requests/],
    [500, /on our side/],
    [503, /on our side/],
    [400, /^We couldn't save the targets\. Give it another go\.$/],
  ])('describes a %i in plain language', (status, pattern) => {
    expect(describeApiError(httpError(status), 'save the targets').textValue).toMatch(pattern);
  });

  it('never shows the raw axios message', () => {
    const err = { ...httpError(500), message: 'Request failed with status code 500' };
    expect(describeApiError(err, 'x').textValue).not.toContain('status code');
  });
});

describe('apiErrorAlert', () => {
  it('adds a sign-in button for an expired session', () => {
    const conf = apiErrorAlert({ code: SESSION_EXPIRED }, 'x');
    expect(conf.actionLabel).toBe('Sign in');
    expect(typeof conf.onAction).toBe('function');
    expect(conf).not.toHaveProperty('signIn');
  });

  it('has no extra button for other errors', () => {
    expect(apiErrorAlert(httpError(500), 'x')).not.toHaveProperty('actionLabel');
  });
});
