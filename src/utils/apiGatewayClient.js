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

const send = {
  get: (url, params, config) => axios.get(url, { ...config, params }),
  post: (url, body, config) => axios.post(url, body, config),
};

// Silent callers report failures themselves. `action` finishes the sentence "we couldn't ..." in the alert, so the
// user knows what failed.
const request = async (method, url, payload, { silent = false, action, timeout } = {}) => {
  try {
    await ensureToken();
    const response = await send[method](url, payload, { headers: getHeaders(), timeout });
    return response.data?.data;
  } catch (err) {
    console.error(`Error calling ${method.toUpperCase()} ${url}:`, err);
    if (!silent) showAlert(apiErrorAlert(err, action));
    throw err;
  }
};

const apiGet = (url, params = {}, options) => request('get', url, params, options);
const apiPost = (url, body, options) => request('post', url, body, options);

export const getActiveTasks = (boardID, { silent = false } = {}) =>
  apiGet('/active-tasks', { boardID }, { silent, action: "load this board's tasks" });
export const getBoards = ({ silent = false } = {}) => apiGet('/boards', {}, { silent, action: 'load your boards' });
export const getUser = () => apiGet('/user', {}, { action: 'load your account details' });
export const setUpAccount = () => apiPost('/new-user', {}, { action: 'set up your account' });

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

export const updateRewordToneAPI = (tone) =>
  apiPost('/user-reword-tone', { tone }, { action: 'save your reword tone' });

// The switch is locked and flips back on failure, so a request that hangs must give up rather than leave it stuck
export const updateAIEnabledAPI = (enabled) =>
  apiPost('/user-ai-enabled', { enabled }, { action: 'save your AI setting', timeout: 10000 });

export const deleteBoard = (boardID) =>
  apiPost('/delete-board', { boardID }, { action: 'delete the board' });

export const updateBoardScoresAPI = (boardID, scores) =>
  apiPost('/board-scores', { boardID, scores }, { action: 'save the score' });

// The server's limit on a task's text. Longer tasks can't be saved, and the reword route enforces it too
export const TASK_MAX_LENGTH = 500;

// The task stays locked until this settles, so it gives up a little after the reword Lambda's own 10 s timeout
export const rewordTask = async ({ text, category, board, tone }) =>
  (await apiPost('/reword-task', { text, category, board, tone }, { action: 'reword this task', timeout: 12000 }))?.text;

// Silent: the delete dialog stays open and shows the failure itself, so the user can retry
export const deleteAccount = () =>
  apiPost('/delete-account', {}, { silent: true });
