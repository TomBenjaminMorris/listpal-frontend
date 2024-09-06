import axios from 'axios';
axios.defaults.baseURL = 'https://api.vinsp.in';

const instance = axios.create({
  baseURL: 'https://api.vinsp.in'
});

/////// GET ///////

export const getAllTasks = async () => {
  const accessToken = sessionStorage.accessToken
  const headers = {
    'Authorization': 'Bearer ' + accessToken
  }

  try {
    const response = await axios.get('/all-tasks', { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const getActiveTasks = async (boardID) => {
  const accessToken = sessionStorage.accessToken
  const params = { boardID }
  const headers = {
    'Authorization': 'Bearer ' + accessToken
  }

  try {
    const response = await axios.get('/active-tasks', { headers: headers, params: params });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const getBoards = async () => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken
  }

  try {
    const response = await axios.get('/boards', { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const getUser = async () => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken
  }

  try {
    const response = await axios.get('/user', { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

/////// POST ///////

export const updateTaskDescription = async (taskID, description) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { taskID, description }

  try {
    const response = await axios.post('/task-description', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateTaskDetails = async (taskID, completedDate, expiryDate, GSI1SK) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { taskID, completedDate, expiryDate, GSI1SK }

  try {
    const response = await axios.post('/task-details', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const newTask = async (taskID, createdDate, completedDate, expiryDate, boardID, description, category) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { taskID, createdDate, completedDate, expiryDate, boardID, description, category }

  try {
    const response = await axios.post('/new-task', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const deleteTask = async (taskID) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { taskID }

  try {
    const response = await axios.post('/delete-task', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const renameCatagoryAPI = async (taskIDs, category) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { taskIDs, category }

  try {
    const response = await axios.post('/rename-category', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateScoresAPI = async (scores) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { scores }

  try {
    const response = await axios.post('/user-scores', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateTargetsAPI = async (targets) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { targets }

  try {
    const response = await axios.post('/user-targets', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateThemeAPI = async (theme) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { theme }

  try {
    const response = await axios.post('/user-theme', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const newBoardAPI = async (boardID, boardName) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { boardID, boardName }

  try {
    const response = await axios.post('/new-board', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const renameBoardAPI = async (boardID, name) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { boardID, name }

  try {
    const response = await axios.post('/rename-board', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const deleteBoard = async (boardID) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { boardID }

  try {
    const response = await axios.post('/delete-board', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};

export const updateTaskImportance = async (taskID, isImportant) => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken,
  }
  const body = { taskID, isImportant }

  try {
    const response = await axios.post('/task-important', body, { headers: headers });
    if (response) {
      return response.data.data;
    }
  } catch (err) {
    console.error("Error getting data: ", err);
    throw err;
  }
};
