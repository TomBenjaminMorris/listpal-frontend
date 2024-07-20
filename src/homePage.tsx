// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useNavigate } from 'react-router-dom';
import { getAllTasks } from './apiGatewayClient';
import { refreshTokens } from './authService';

/*eslint-disable*/
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function isTokenExpired(accessToken: string) {
  const now = Math.floor(Date.now() / 1000);
  const expiry = accessToken.exp;
  return now > expiry;
}

// const tasks = getAllTasks(sessionStorage.accessToken.toString())

const HomePage = () => {
  const navigate = useNavigate();
  var idToken = parseJwt(sessionStorage.idToken.toString());
  var accessToken = parseJwt(sessionStorage.accessToken.toString());
  // console.log ("Amazon Cognito ID token encoded: " + sessionStorage.idToken.toString());
  // console.log ("Amazon Cognito ID token decoded: ");
  // console.log ( idToken );
  // console.log ("Amazon Cognito access token encoded: " + sessionStorage.accessToken.toString());
  // console.log ("Amazon Cognito access token decoded: ");
  // console.log ( accessToken );
  // console.log ("Amazon Cognito refresh token: ");
  // console.log ( sessionStorage.refreshToken );
  
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
  
/*eslint-enable*/

  return (
    <div>
      <h1>Hello {`${idToken.given_name} ${idToken.family_name}`}</h1>
      <h2>email: {idToken.email}</h2>
      <h2>id: {idToken.sub}</h2>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleRefreshTokens}>Refresh Tokens</button>
    </div>
  );
};

export default HomePage;
