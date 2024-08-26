import axios from 'axios';
axios.defaults.baseURL = 'https://api.vinsp.in';

const instance = axios.create({
  baseURL: 'https://api.vinsp.in'
});

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
      // console.log(response);
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
