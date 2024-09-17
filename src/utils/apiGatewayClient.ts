import axios from 'axios';
import { isTokenExpired } from './utils';
import { refreshTokens } from './authService';
axios.defaults.baseURL = 'https://api.vinsp.in';

const tokenCheck = async () => {
  try {
    if (isTokenExpired()) {
      // console.log("TTTT attempting tokens refresh");
      const token = await refreshTokens(sessionStorage.refreshToken)
      if (token) {
        // console.log("TTTT tokens refreshed successfully");
        return true;
      } else {
        console.log("TTTT tokens not refreshed");
        return false;
      }
    } else {
      // console.log("TTTT token not expired");
      return true;
    }
  } catch (e) {
    console.error(e)
    return false;
  }
};

const getHeaders = () => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken
  }
  return headers;
}

/////// GET ///////

export const getAllTasks = async () => {
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.get('/all-tasks', { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const getActiveTasks = async (boardID) => {
  const params = { boardID }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.get('/active-tasks', { headers: getHeaders(), params: params });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const getBoards = async () => {
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.get('/boards', { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const getUser = async () => {
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.get('/user', { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

/////// POST ///////

export const updateTaskDescription = async (taskID, description) => {
  const body = { taskID, description }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/task-description', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateTaskDetails = async (taskID, completedDate, expiryDate, GSI1SK) => {
  const body = { taskID, completedDate, expiryDate, GSI1SK }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/task-details', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const newTask = async (taskID, createdDate, completedDate, expiryDate, boardID, description, category) => {
  const body = { taskID, createdDate, completedDate, expiryDate, boardID, description, category }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/new-task', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const deleteTask = async (taskID) => {
  const body = { taskID }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/delete-task', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const renameCatagoryAPI = async (taskIDs, category) => {
  const body = { taskIDs, category }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/rename-category', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateScoresAPI = async (scores) => {
  const body = { scores }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/user-scores', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateTargetsAPI = async (targets) => {
  const body = { targets }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/user-targets', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateThemeAPI = async (theme) => {
  const body = { theme }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/user-theme', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const newBoardAPI = async (boardID, boardName) => {
  const body = { boardID, boardName }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/new-board', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const renameBoardAPI = async (boardID, name) => {
  const body = { boardID, name }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/rename-board', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const deleteBoard = async (boardID) => {
  const body = { boardID }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/delete-board', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateTaskImportance = async (taskID, isImportant) => {
  const body = { taskID, isImportant }
  try {
    const ok = await tokenCheck();
    if (ok) {
      const response = await axios.post('/task-important', body, { headers: getHeaders() });
      if (response) {
        return response.data.data;
      }
    }
    else {
      console.log("TTTT request was not attempted as token refresh was not successful");
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};
