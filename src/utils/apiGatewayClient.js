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

export const updateBoardScoresAPI = (boardID, scores) =>
  apiPost('/board-scores', { boardID, scores });

export const updateBoardTargetsAPI = (boardID, targets) =>
  apiPost('/board-targets', { boardID, targets });

// User API method

export const newUser = (userID, email, name) =>
  apiPost('/new-user', { userID, email, name });










// import axios from 'axios';
// import { isTokenExpired } from './utils';
// import { refreshTokens } from './authService';
// axios.defaults.baseURL = 'https://api.vinsp.in';

// const tokenCheck = async () => {
//   try {
//     if (isTokenExpired()) {
//       // console.log("TTTT attempting tokens refresh");
//       const token = await refreshTokens(sessionStorage.refreshToken)
//       if (token) {
//         // console.log("TTTT tokens refreshed successfully");
//         return true;
//       } else {
//         console.log("TTTT tokens not refreshed");
//         return false;
//       }
//     } else {
//       // console.log("TTTT token not expired");
//       return true;
//     }
//   } catch (e) {
//     console.error(e)
//     return false;
//   }
// };

// const getHeaders = () => {
//   const headers = {
//     'Authorization': 'Bearer ' + sessionStorage.accessToken
//   }
//   return headers;
// }

// /////// GET ///////

// export const getAllTasks = async () => {
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.get('/all-tasks', { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const getActiveTasks = async (boardID) => {
//   const params = { boardID }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.get('/active-tasks', { headers: getHeaders(), params: params });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to get tasks, please refresh the page.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const getBoards = async () => {
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.get('/boards', { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to get boards, please refresh the page.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const getUser = async () => {
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.get('/user', { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to get user details, please refresh the page.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const getReports = async () => {
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.get('/weekly-reports', { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to get weekly reports, please refresh the page.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// /////// POST ///////

// export const updateTaskDescription = async (taskID, description) => {
//   const body = { taskID, description }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/task-description', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the description, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateTaskDetails = async (taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link) => {
//   const body = { taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/task-details', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the task details, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateTaskChecked = async (taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link, checked, description, category, emoji) => {
//   const body = { taskID, completedDate, expiryDate, GSI1SK, expiryDateTTL, link, checked, description, category, emoji }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/task-checked', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the task details, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateTaskEmojiAPI = async (taskIDs, emoji) => {
//   const body = { taskIDs, emoji }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/card-emoji', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to set the card emoji, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const newTask = async (taskID, createdDate, completedDate, expiryDate, boardID, description, category, link, emoji) => {
//   const body = { taskID, createdDate, completedDate, expiryDate, boardID, description, category, link, emoji }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/new-task', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to create a new task, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const deleteTask = async (taskID) => {
//   const body = { taskID }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/delete-task', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to delete the task, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const deleteTasks = async (tasks) => {
//   tasks && tasks.forEach(t => {
//     deleteTask(t.SK);
//   });
// };

// export const renameCatagoryAPI = async (taskIDs, category) => {
//   const body = { taskIDs, category }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/rename-category', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to rename the category, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// // export const updateScoresAPI = async (scores) => {
// //   const body = { scores }
// //   try {
// //     const ok = await tokenCheck();
// //     if (ok) {
// //       const response = await axios.post('/user-scores', body, { headers: getHeaders() });
// //       if (response) {
// //         return response.data.data;
// //       }
// //     }
// //     else {
// //       console.log("TTTT request was not attempted as token refresh was not successful");
// //     }
// //   } catch (err) {
// //     console.error("Error getting data: ", err);
// //     throw err;
// //   }
// // };

// // export const updateTargetsAPI = async (targets) => {
// //   const body = { targets }
// //   try {
// //     const ok = await tokenCheck();
// //     if (ok) {
// //       const response = await axios.post('/user-targets', body, { headers: getHeaders() });
// //       if (response) {
// //         return response.data.data;
// //       }
// //     }
// //     else {
// //       console.log("TTTT request was not attempted as token refresh was not successful");
// //     }
// //   } catch (err) {
// //     console.error("Error getting data: ", err);
// //     throw err;
// //   }
// // };

// export const updateThemeAPI = async (theme) => {
//   const body = { theme }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/user-theme', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the theme, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const newBoardAPI = async (boardID, boardName) => {
//   const body = { boardID, boardName }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/new-board', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to create a new board, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const renameBoardAPI = async (boardID, name) => {
//   const body = { boardID, name }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/rename-board', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to rename the board, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateBoardEmojiAPI = async (boardID, emoji) => {
//   const body = { boardID, emoji }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/board-emoji', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to set the board emoji, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateBoardCategoryOrder = async (boardID, categoryOrder) => {
//   const body = { boardID, categoryOrder }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/board-category-order', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to set the board category order, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const deleteBoard = async (boardID) => {
//   const body = { boardID }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/delete-board', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to delete the board, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateTaskImportance = async (taskID, isImportant) => {
//   const body = { taskID, isImportant }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/task-important', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the task, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateBoardScoresAPI = async (boardID, scores) => {
//   const body = { boardID, scores }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/board-scores', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the score, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const updateBoardTargetsAPI = async (boardID, targets) => {
//   const body = { boardID, targets }
//   try {
//     const ok = await tokenCheck();
//     if (ok) {
//       const response = await axios.post('/board-targets', body, { headers: getHeaders() });
//       if (response) {
//         return response.data.data;
//       }
//     }
//     else {
//       console.log("TTTT request was not attempted as token refresh was not successful");
//     }
//   } catch (err) {
//     alert("Failed to update the targets, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };

// export const newUser = async (userID, email, name) => {
//   const body = { userID, email, name }
//   try {
//     const response = await axios.post('/new-user', body);
//     if (response) {
//       return response.data.data;
//     }
//   } catch (err) {
//     alert("Failed to create a new user, please try again.")
//     console.error("Error getting data: ", err);
//     throw err;
//   }
// };
