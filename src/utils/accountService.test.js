import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({ default: { post: vi.fn(), defaults: {} } }));
vi.mock('./apiGatewayClient', () => ({
  ensureToken: vi.fn(),
  deleteAccount: vi.fn(),
  syncOps: vi.fn(),
  syncOpsKeepalive: vi.fn()
}));
vi.mock('./authService', () => ({ refreshTokens: vi.fn() }));
vi.mock('./syncEngine', () => ({
  flushNow: vi.fn(),
  clearOutbox: vi.fn(),
  queueBoardUpdate: vi.fn(),
  LOAD_FLUSH_TIMEOUT: 3000
}));
vi.mock('../config.json', () => ({
  default: { region: 'eu-west-2', clientId: 'client', managedLogoutLocal: 'https://auth/local', managedLogoutRemote: 'https://auth/remote' }
}));

import axios from 'axios';
import { deleteAccount as deleteAccountAPI, ensureToken } from './apiGatewayClient';
import { refreshTokens } from './authService';
import { flushNow, clearOutbox } from './syncEngine';
import { SESSION_EXPIRED } from './apiErrors';
import {
  saveName, requestEmailChange, confirmEmailChange, getPendingEmail, clearPendingEmail,
  deleteAccount, revokeSessions, describeAccountError
} from './accountService';

const store = () => {
  const data = new Map();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    clear: () => data.clear(),
    get accessToken() { return 'access'; },
    get refreshToken() { return 'refresh'; }
  };
};

const calls = () => axios.post.mock.calls.map(([, body, { headers }]) => ({
  operation: headers['X-Amz-Target'].split('.').pop(),
  body: JSON.parse(body)
}));

beforeEach(() => {
  vi.clearAllMocks();
  axios.post.mockResolvedValue({ data: {} });
  globalThis.sessionStorage = store();
  globalThis.localStorage = store();
  globalThis.window = { location: { replace: vi.fn() } };
});

describe('saveName', () => {
  it('updates the filled fields, deletes the blank one and refreshes the ID token', async () => {
    await saveName({ givenName: ' Tom ', familyName: '  ' });

    expect(calls()).toEqual([
      { operation: 'UpdateUserAttributes', body: { UserAttributes: [{ Name: 'given_name', Value: 'Tom' }], AccessToken: 'access' } },
      { operation: 'DeleteUserAttributes', body: { UserAttributeNames: ['family_name'], AccessToken: 'access' } }
    ]);
    expect(refreshTokens).toHaveBeenCalledWith('refresh');
  });

  it('makes no delete call when both fields are filled', async () => {
    await saveName({ givenName: 'Tom', familyName: 'Morris' });
    expect(calls().map(c => c.operation)).toEqual(['UpdateUserAttributes']);
  });

  it('checks the token is fresh before calling Cognito', async () => {
    ensureToken.mockRejectedValueOnce(Object.assign(new Error('expired'), { code: SESSION_EXPIRED }));
    await expect(saveName({ givenName: 'Tom', familyName: '' })).rejects.toMatchObject({ code: SESSION_EXPIRED });
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe('email change', () => {
  it('remembers the pending address only once Cognito accepts it', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { __type: 'InvalidParameterException' } } });
    await expect(requestEmailChange('new@example.com')).rejects.toMatchObject({ name: 'InvalidParameterException' });
    expect(getPendingEmail()).toBe('');

    await requestEmailChange('new@example.com');
    expect(getPendingEmail()).toBe('new@example.com');
  });

  it('forgets the pending address and refreshes after the code is confirmed', async () => {
    await requestEmailChange('new@example.com');
    await confirmEmailChange('123456');

    expect(calls()[1]).toEqual({ operation: 'VerifyUserAttribute', body: { AttributeName: 'email', Code: '123456', AccessToken: 'access' } });
    expect(getPendingEmail()).toBe('');
    expect(refreshTokens).toHaveBeenCalled();
  });

  it('keeps the pending address after a wrong code', async () => {
    await requestEmailChange('new@example.com');
    axios.post.mockRejectedValueOnce({ response: { data: { __type: 'CodeMismatchException' } } });

    await expect(confirmEmailChange('000000')).rejects.toMatchObject({ name: 'CodeMismatchException' });

    expect(getPendingEmail()).toBe('new@example.com');
    clearPendingEmail();
    expect(getPendingEmail()).toBe('');
  });
});

describe('deleteAccount', () => {
  it('checks the password, flushes, deletes, clears the outbox and leaves, in that order', async () => {
    const order = [];
    axios.post.mockImplementationOnce(async () => { order.push('password'); return { data: {} }; });
    flushNow.mockImplementationOnce(async () => { order.push('flush'); });
    deleteAccountAPI.mockImplementationOnce(async () => { order.push('delete'); });
    clearOutbox.mockImplementationOnce(async () => { order.push('clear'); });

    await deleteAccount('me@example.com', 'secret');

    expect(order).toEqual(['password', 'flush', 'delete', 'clear']);
    expect(calls()[0].body).toEqual({
      ClientId: 'client',
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: 'me@example.com', PASSWORD: 'secret' }
    });
    expect(window.location.replace).toHaveBeenCalledTimes(1);
  });

  it('deletes nothing when the password is wrong', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { __type: 'NotAuthorizedException', message: 'Incorrect username or password.' } } });

    await expect(deleteAccount('me@example.com', 'wrong')).rejects.toMatchObject({ name: 'NotAuthorizedException' });

    expect(deleteAccountAPI).not.toHaveBeenCalled();
    expect(clearOutbox).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it('keeps the session and outbox when the backend delete fails, so the user can retry', async () => {
    deleteAccountAPI.mockRejectedValueOnce(new Error('500'));

    await expect(deleteAccount('me@example.com', 'secret')).rejects.toMatchObject({ name: 'DeleteFailed' });

    expect(clearOutbox).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});

describe('Cognito failures', () => {
  it('never carries the request, which holds the password, in a thrown error', async () => {
    axios.post.mockRejectedValueOnce({ config: { data: 'secret' }, response: { data: { __type: 'prefix#NotAuthorizedException', message: 'Incorrect username or password.' } } });

    const error = await deleteAccount('me@example.com', 'secret').catch(e => e);

    expect(error.name).toBe('NotAuthorizedException');
    expect(JSON.stringify(error)).not.toContain('secret');
    expect(error.config).toBeUndefined();
  });

  it('does not fail when revoking sessions fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => { });
    axios.post.mockRejectedValueOnce({});
    await expect(revokeSessions()).resolves.toBeUndefined();
    log.mockRestore();
  });
});

describe('describeAccountError', () => {
  const cognito = (name, message) => Object.assign(new Error(message), { name });

  it('separates a wrong password from a session that cannot make the change', () => {
    expect(describeAccountError(cognito('NotAuthorizedException', 'Incorrect username or password.'))).toMatch(/password isn't right/);
    expect(describeAccountError(cognito('NotAuthorizedException', 'Access Token does not have required scopes'))).toMatch(/Sign out and back in/);
    expect(describeAccountError(cognito('NotAuthorizedException', 'Access Token has been revoked'))).toMatch(/Sign out and back in/);
  });

  it('explains connection failures and expired sessions', () => {
    expect(describeAccountError(cognito('NetworkError'))).toMatch(/connection/);
    expect(describeAccountError({ isAxiosError: true })).toMatch(/connection/);
    expect(describeAccountError({ code: SESSION_EXPIRED })).toMatch(/Sign out and back in/);
  });

  it('maps known exceptions and falls back for the rest', () => {
    expect(describeAccountError(cognito('CodeMismatchException'))).toMatch(/code isn't right/);
    expect(describeAccountError(cognito('AliasExistsException'))).toMatch(/already uses/);
    expect(describeAccountError(cognito('DeleteFailed'))).toMatch(/may already be gone/);
    expect(describeAccountError(cognito('SomethingNew'))).toMatch(/Something went wrong/);
  });
});
