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
      return response.data.data;;
    }
  } catch (err) {
    console.error("Error getting data: ", error);
    throw error;
  }
};

export const getActiveTasks = async () => {
  const accessToken = sessionStorage.accessToken
  const headers = {
    'Authorization': 'Bearer ' + accessToken
  }

  try {
    const response = await axios.get('/active-tasks?boardID=b%2312345', { headers: headers });
    if (response) {
      return response.data.data;;
    }
  } catch (err) {
    console.error("Error getting data: ", error);
    throw error;
  }
};

export const getBoards = async () => {
  const headers = {
    'Authorization': 'Bearer ' + sessionStorage.accessToken
  }

  try {
    const response = await axios.get('/boards', { headers: headers });
    if (response) {
      // console.log(response);
      return response.data.data;;
    }
  } catch (err) {
    console.error("Error getting data: ", error);
    throw error;
  }
};