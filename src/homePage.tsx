// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useNavigate } from 'react-router-dom';
import { getAllTasks } from './apiGatewayClient';

/*eslint-disable*/
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
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
  // console.log ("Amazon Cognito example application. Not for use in production applications.");
  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }
  
/*eslint-enable*/

  return (
    <div>
      <h1>Hello {`${idToken.given_name} ${idToken.family_name}`}</h1>
      <h2>email: {idToken.email}</h2>
      <h2>id: {idToken.sub}</h2>
      {/* <p>{tasks}</p> */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default HomePage;
