import axios from 'axios';
import config from '../config.json';
import { ensureToken, deleteAccount as deleteAccountAPI } from './apiGatewayClient';
import { refreshTokens } from './authService';
import { flushNow, clearOutbox, LOAD_FLUSH_TIMEOUT } from './syncEngine';
import { parseJwt } from './utils';
import { SESSION_EXPIRED } from './apiErrors';

const PENDING_EMAIL = 'pendingEmail';
const isDev = process.env.NODE_ENV === 'development';

class CognitoError extends Error {
  constructor(name, message) {
    super(message);
    this.name = name;
  }
}

// These bodies hold passwords, and an axios error carries its request, so only the Cognito error may leave here
const callCognito = async (operation, body) => {
  try {
    const { data } = await axios.post(`https://cognito-idp.${config.region}.amazonaws.com/`, JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${operation}`
      }
    });
    return data;
  } catch (err) {
    if (!err.response) throw new CognitoError('NetworkError', 'No response from Cognito');
    const { __type = 'UnknownError', message } = err.response.data ?? {};
    throw new CognitoError(__type.split('#').pop(), message);
  }
};

const callAsUser = async (operation, body = {}) => {
  await ensureToken();
  return callCognito(operation, { ...body, AccessToken: sessionStorage.accessToken });
};

// A new ID token is the only place the app reads these attributes from
const refreshDetails = () => refreshTokens(sessionStorage.refreshToken);

export const getAccountDetails = () => {
  const token = parseJwt(sessionStorage.idToken?.toString());
  return {
    givenName: token?.given_name ?? '',
    familyName: token?.family_name ?? '',
    email: token?.email ?? ''
  };
};

export const saveName = async ({ givenName, familyName }) => {
  const attributes = [['given_name', givenName.trim()], ['family_name', familyName.trim()]];
  const kept = attributes.filter(([, value]) => value);
  const cleared = attributes.filter(([, value]) => !value);
  if (kept.length) {
    await callAsUser('UpdateUserAttributes', { UserAttributes: kept.map(([Name, Value]) => ({ Name, Value })) });
  }
  if (cleared.length) {
    await callAsUser('DeleteUserAttributes', { UserAttributeNames: cleared.map(([name]) => name) });
  }
  await refreshDetails();
};

export const getPendingEmail = () => sessionStorage.getItem(PENDING_EMAIL) || '';

export const clearPendingEmail = () => sessionStorage.removeItem(PENDING_EMAIL);

// The pool keeps the current email active until the code is confirmed. Sending again also sends a new code.
// Cognito can't report a pending email, so it's kept here to survive leaving the page.
export const requestEmailChange = async (email) => {
  await callAsUser('UpdateUserAttributes', { UserAttributes: [{ Name: 'email', Value: email }] });
  sessionStorage.setItem(PENDING_EMAIL, email);
};

export const confirmEmailChange = async (code) => {
  await callAsUser('VerifyUserAttribute', { AttributeName: 'email', Code: code });
  clearPendingEmail();
  await refreshDetails();
};

export const changePassword = (currentPassword, newPassword) =>
  callAsUser('ChangePassword', { PreviousPassword: currentPassword, ProposedPassword: newPassword });

export const sendPasswordResetCode = (email) =>
  callCognito('ForgotPassword', { ClientId: config.clientId, Username: email });

export const resetPassword = (email, code, newPassword) =>
  callCognito('ConfirmForgotPassword', { ClientId: config.clientId, Username: email, ConfirmationCode: code, Password: newPassword });

// Failing to revoke the other sessions mustn't look like the password change itself failed
export const revokeSessions = async () => {
  try {
    await callAsUser('GlobalSignOut');
  } catch (err) {
    console.error('Global sign out failed:', err.name);
  }
};

// Goes through Cognito's logout page so its own login session ends too, and the next sign-in really asks for the password
export const endSession = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace(isDev ? config.managedLogoutLocal : config.managedLogoutRemote);
};

export const deleteAccount = async (email, password) => {
  await callCognito('InitiateAuth', {
    ClientId: config.clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password }
  });
  // Edits still queued could otherwise land after the delete and leave items behind
  await flushNow({ timeout: LOAD_FLUSH_TIMEOUT });
  try {
    await deleteAccountAPI();
  } catch (err) {
    if (err?.code === SESSION_EXPIRED) throw err;
    throw new CognitoError('DeleteFailed', 'POST /delete-account failed');
  }
  await clearOutbox();
  endSession();
};

const COGNITO_MESSAGES = {
  CodeMismatchException: "That code isn't right. Check it and try again.",
  ExpiredCodeException: 'That code has expired. Ask for a new one.',
  InvalidPasswordException: "That password doesn't meet the rules above.",
  AliasExistsException: 'Another account already uses that email.',
  UsernameExistsException: 'Another account already uses that email.',
  LimitExceededException: 'Too many attempts. Wait a few minutes and try again.',
  TooManyRequestsException: 'Too many attempts. Wait a few minutes and try again.',
  TooManyFailedAttemptsException: 'Too many attempts. Wait a few minutes and try again.',
  InvalidParameterException: "That doesn't look right. Check it and try again.",
  // The server deletes in stages, so a failure can come after some of the data has gone
  DeleteFailed: "We couldn't finish deleting your account, and some of its data may already be gone. Give it another go.",
};

const SIGN_IN_AGAIN = 'Your session has expired. Sign out and back in to make this change.';

export const describeAccountError = (err) => {
  if (err?.code === SESSION_EXPIRED) return SIGN_IN_AGAIN;
  if (err?.name === 'NetworkError' || (err?.isAxiosError && !err.response)) {
    return "We couldn't reach ListPal. Check your connection and try again.";
  }
  if (err?.name === 'NotAuthorizedException') {
    // Cognito uses one exception for all of these. A session from before the scope was added can't make changes.
    return /scopes|revoked|token/i.test(err.message ?? '') ? SIGN_IN_AGAIN : "That password isn't right.";
  }
  return COGNITO_MESSAGES[err?.name] ?? 'Something went wrong. Give it another go.';
};
