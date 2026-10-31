import axios from 'axios';
import { isTokenExpired } from './utils';
import { refreshTokens } from './authService';
import { showAlert } from './alertBus';
import { apiErrorAlert, SESSION_EXPIRED } from './apiErrors';

axios.defaults.baseURL = 'https://api.vinsp.in';

const getHeaders = () => ({
  'Authorization': 'Bearer ' + sessionStorage.accessToken
});

const tokenCheck = async () => {
  try {
    if (isTokenExpired()) {
      const token = await refreshTokens(sessionStorage.refreshToken);
      return token != null;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Callers must see a failure here, otherwise an expired session looks like an empty response
export const ensureToken = async () => {
  const ok = await tokenCheck();
  if (!ok) throw Object.assign(new Error("Session expired, please sign in again"), { code: SESSION_EXPIRED });
};

// Generic API request function for GET requests. Silent callers report failures themselves.
// `action` finishes the sentence "we couldn't ..." in the alert, so the user knows what failed.
const apiGet = async (url, params = {}, { silent = false, action } = {}) => {
  try {
    await ensureToken();
    const response = await axios.get(url, { headers: getHeaders(), params });
    return response.data?.data;
  } catch (err) {
    console.error(`Error getting ${url}:`, err);
    if (!silent) showAlert(apiErrorAlert(err, action));
    throw err;
  }
};

// Generic API request function for POST requests. Silent callers report failures themselves.
const apiPost = async (url, body, { silent = false, action } = {}) => {
  try {
    await ensureToken();
    const response = await axios.post(url, body, { headers: getHeaders() });
    return response.data?.data;
  } catch (err) {
    console.error(`Error posting to ${url}:`, err);
    if (!silent) showAlert(apiErrorAlert(err, action));
    throw err;
  }
};

export const getActiveTasks = (boardID, { silent = false } = {}) =>
  apiGet('/active-tasks', { boardID }, { silent, action: "load this board's tasks" });
export const getBoards = ({ silent = false } = {}) => apiGet('/boards', {}, { silent, action: 'load your boards' });
export const getUser = () => apiGet('/user', {}, { action: 'load your account details' });

export const syncOps = (ops) =>
  apiPost('/sync', { ops }, { silent: true });

// Used while the page unloads: axios cannot set keepalive, and the token cannot be refreshed in time
export const syncOpsKeepalive = (ops) => {
  if (!sessionStorage.accessToken || isTokenExpired()) return;
  fetch(`${axios.defaults.baseURL}/sync`, {
    method: 'POST',
    keepalive: true,
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ops })
  }).catch(() => { });
};

export const updateThemeAPI = (theme) =>
  apiPost('/user-theme', { theme }, { action: 'save your theme' });

export const deleteBoard = (boardID) =>
  apiPost('/delete-board', { boardID }, { action: 'delete the board' });

export const updateBoardScoresAPI = (boardID, scores) =>
  apiPost('/board-scores', { boardID, scores }, { action: 'save the score' });

// Silent: the delete dialog stays open and shows the failure itself, so the user can retry
export const deleteAccount = () =>
  apiPost('/delete-account', {}, { silent: true });
