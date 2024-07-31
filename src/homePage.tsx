import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from './utils/apiGatewayClient';
import { parseJwt, isTokenExpired } from './utils/utils';
import { refreshTokens } from './utils/authService';
import './HomePage.css'
import BoardList from './components/BoardList';
import Header from './components/Header';

/*eslint-disable*/
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
    const data = await getBoards();
    setBoards(data);
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
      handleGetBoards();
    })
      .catch((err) => {
        handleLogout()
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

  useEffect(() => {
    handleGetBoards();
  }, [])

  /*eslint-enable*/
  return (
    <div className="wrapper">
      <Header handleLogout={handleLogout} />
      <h2>Hello {`${idToken.given_name} ${idToken.family_name}`}</h2>
      <BoardList boards={boards} />
    </div>
  );
};

export default HomePage;

/* <button onClick={handleLogout}>Logout</button>
<button onClick={handleRefreshTokens}>Refresh Tokens</button>
<button onClick={handleGetAllData}>Get All Tasks</button>
<button onClick={handleGetActiveData}>Get Active Tasks</button> */

// console.log ("Amazon Cognito ID token encoded: " + sessionStorage.idToken.toString());
// console.log ("Amazon Cognito ID token decoded: ");
// console.log ( idToken );
// console.log ("Amazon Cognito access token encoded: " + sessionStorage.accessToken.toString());
// console.log ("Amazon Cognito access token decoded: ");
// console.log ( accessToken );
// console.log ("Amazon Cognito refresh token: ");
// console.log ( sessionStorage.refreshToken );
