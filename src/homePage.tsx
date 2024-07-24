import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTasks, getActiveTasks } from './apiGatewayClient';
import { refreshTokens } from './authService';

/*eslint-disable*/
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

function isTokenExpired(accessToken: string) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = accessToken.exp;
  return now > expiry;
}

// HomePage
const HomePage = () => {
  const [responseData, setResponseData] = useState([]);
  const navigate = useNavigate();
  var idToken = parseJwt(sessionStorage.idToken.toString());
  var accessToken = parseJwt(sessionStorage.accessToken.toString());

  const handleGetAllData = async () => {
    const data = await getAllTasks();
    setResponseData(data);
  }

  const handleGetActiveData = async () => {
    const data = await getActiveTasks();
    setResponseData(data);
  }

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleRefreshTokens = () => {
    refreshTokens(sessionStorage.refreshToken).then((tokens) => {
      console.log("TTTT tokens refreshed successfully")
    });
  };

  if (isTokenExpired(accessToken)) {
    console.log("TTTT token expired, renewing...");
    try {
      handleRefreshTokens()
    }
    catch (err) {
      handleLogout()
    }
  }

  const tasks = (
    <ul>
      {responseData.map((Item) => (
        <p key={Item.SK}>{JSON.stringify(Item.Description)}</p>
      ))}
    </ul>
  )

  /*eslint-enable*/
  return (
    <div>
      <h1>Hello {`${idToken.given_name} ${idToken.family_name}`}</h1>
      <h2>email: {idToken.email}</h2>
      <h2>id: {idToken.sub}</h2>
      {tasks}
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleRefreshTokens}>Refresh Tokens</button>
      <button onClick={handleGetAllData}>Get All Tasks</button>
      <button onClick={handleGetActiveData}>Get Active Tasks</button>
    </div>
  );
};

export default HomePage;





// console.log ("Amazon Cognito ID token encoded: " + sessionStorage.idToken.toString());
// console.log ("Amazon Cognito ID token decoded: ");
// console.log ( idToken );
// console.log ("Amazon Cognito access token encoded: " + sessionStorage.accessToken.toString());
// console.log ("Amazon Cognito access token decoded: ");
// console.log ( accessToken );
// console.log ("Amazon Cognito refresh token: ");
// console.log ( sessionStorage.refreshToken );