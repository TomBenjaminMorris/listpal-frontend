import axios from 'axios';
import { isTokenExpired } from './utils';
import { refreshTokens } from './authService';

axios.defaults.baseURL = 'https://api.vinsp.in';

// Helper function to get headers
const getHeaders = () => ({
  'Authorization': 'Bearer ' + sessionStorage.accessToken
});

// Helper function to check token expiration and refresh
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

// Generic API request function for GET requests
const apiGet = async (url, params = {}) => {
  try {
    const ok = await tokenCheck();
    if (!ok) return console.log("Request not attempted as token refresh failed");

    const response = await axios.get(url, { headers: getHeaders(), params });
    return response.data?.data;
  } catch (err) {
    console.error(`Error getting ${url}:`, err);
    alert(`Failed to fetch data from ${url}, please try again.`);
    throw err;
  }
};

// Generic API request function for POST requests
const apiPost = async (url, body) => {
  try {
    const ok = await tokenCheck();
    if (!ok) return console.log("Request not attempted as token refresh failed");

    const response = await axios.post(url, body, { headers: getHeaders() });
    return response.data?.data;
  } catch (err) {
    console.error(`Error posting to ${url}:`, err);
    alert(`Failed to post to ${url}, please try again.`);
    throw err;
  }
};

// GET API methods
export const getAllTasks = () => apiGet('/all-tasks');
export const getActiveTasks = (boardID) => apiGet('/active-tasks', { boardID });
export const getBoards = () => apiGet('/boards');
export const getUser = () => apiGet('/user');
export const getReports = () => apiGet('/weekly-reports');
export const getStats = () => apiGet('/stats');

// POST API methods
export const syncTasks = (task_actions) =>
  apiPost('/task-sync', { task_actions });

export const updateTaskDescription = (taskID, description) =>
  apiPost('/task-description', { taskID, description });

export const updateTaskDetails = (taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link) =>
  apiPost('/task-details', { taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link });

export const updateTaskChecked = (taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link, checked, description, category, emoji) =>
  apiPost('/task-checked', { taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link, checked, description, category, emoji });

export const updateTaskEmojiAPI = (taskIDs, emoji) =>
  apiPost('/card-emoji', { taskIDs, emoji });

export const newTask = (taskID, createdDate, completedDate, expiryDate, boardID, description, category, link, emoji) =>
  apiPost('/new-task', { taskID, createdDate, completedDate, expiryDate, boardID, description, category, link, emoji });

export const deleteTask = (taskID) =>
  apiPost('/delete-task', { taskID });

export const deleteTasks = (tasks) => {
  tasks?.forEach(t => deleteTask(t.SK));
};

export const renameCategoryAPI = (taskIDs, category) =>
  apiPost('/rename-category', { taskIDs, category });

// Board API methods
export const updateThemeAPI = (theme) =>
  apiPost('/user-theme', { theme });

export const newBoardAPI = (boardID, boardName) =>
  apiPost('/new-board', { boardID, boardName });

export const renameBoardAPI = (boardID, name) =>
  apiPost('/rename-board', { boardID, name });

export const updateBoardEmojiAPI = (boardID, emoji) =>
  apiPost('/board-emoji', { boardID, emoji });

export const updateBoardCategoryOrder = (boardID, categoryOrder) =>
  apiPost('/board-category-order', { boardID, categoryOrder });

export const deleteBoard = (boardID) =>
  apiPost('/delete-board', { boardID });

export const renameCatagoryAPI = (taskIDs, category) =>
  apiPost('/rename-category', { taskIDs, category });

// Task-related methods
export const updateTaskImportance = (taskID, isImportant) =>
  apiPost('/task-important', { taskID, isImportant });

export const updateBoardScoresAPI = (boardID, scores, task) =>
  apiPost('/board-scores', { boardID, scores, task });

export const updateBoardTargetsAPI = (boardID, targets) =>
  apiPost('/board-targets', { boardID, targets });

// User API method
export const newUser = (userID, email, name) =>
  apiPost('/new-user', { userID, email, name });
