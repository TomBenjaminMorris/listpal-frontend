import axios from 'axios';
axios.defaults.baseURL = 'https://api.vinsp.in';

const instance = axios.create({
    baseURL: 'https://api.vinsp.in'
});

export function getAllTasks(accessToken) {
    const headers = {
      'Authorization': 'Bearer ' + accessToken
    }

    axios.get('/all-tasks', { headers: headers }).then((response) => {
      const item = response.data.data[0].Description.S
      console.log(item);
      return item
    }).catch(function (error) {
      console.error(error);
    });
}