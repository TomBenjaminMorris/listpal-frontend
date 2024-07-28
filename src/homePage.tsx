import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from './apiGatewayClient';
import { refreshTokens } from './authService';
import './HomePage.css'

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

// const BOARDS = [{ Board: "my lists", SK: 1234 }, { Board: "work lists", SK: 1235 }, { Board: "other lists", SK: 1236 }]
const BOARDS = []

// HomePage
const HomePage = () => {
  console.log("rendering: HomePage")
  const [boards, setBoards] = useState(BOARDS);
  const navigate = useNavigate();
  var idToken = parseJwt(sessionStorage.idToken.toString());
  var accessToken = parseJwt(sessionStorage.accessToken.toString());

  const handleGetBoards = async () => {
    console.log("TTT triggered: handleGetBoards")
    if (boards.length === 0) {
      const data = await getBoards();
      setBoards(data);
    }
  }

  const handleLogout = () => {
    console.log("TTT triggered: handleLogout")
    sessionStorage.clear();
    navigate('/login');
  };

  const handleRefreshTokens = () => {
    console.log("TTTT triggered: handleRefreshTokens")
    refreshTokens(sessionStorage.refreshToken).then((tokens) => {
      console.log("TTTT tokens refreshed successfully")
    });
  };

  const handleBoardSelection = (id: string) => {
    alert(id);
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

  useEffect(() => {
    handleGetBoards();
  }, [])

  /*eslint-enable*/
  return (
    <div className="wrapper">
      <div className="header">
        <div className="header-right">
          <a onClick={handleLogout}>Logout</a>
        </div>
      </div>
      <h2>Hello {`${idToken.given_name} ${idToken.family_name}`}</h2>
      <div className="flex-container">
        {boards.map((b) => {
          return (
            <div key={b.SK} onClick={() => handleBoardSelection(b.SK)}>{b.Board}</div>
          )
        })}
      </div>
      {/* <h2>email: {idToken.email}</h2>
      <h2>id: {idToken.sub}</h2> */}
      {/* {tasks}
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleRefreshTokens}>Refresh Tokens</button>
      <button onClick={handleGetAllData}>Get All Tasks</button>
      <button onClick={handleGetActiveData}>Get Active Tasks</button> */}
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