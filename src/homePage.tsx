import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from './utils/apiGatewayClient';
import { parseJwt, isTokenExpired } from './utils/utils';
import { refreshTokens } from './utils/authService';
import './HomePage.css'
import BoardList from './components/BoardList';
import Header from './components/Header';

/*eslint-disable*/
// HomePage
const HomePage = ({ boards, setBoards, setActiveTasks }) => {
  console.log("rendering: HomePage")
  const [isLoading, setIsLoading] = useState(true);
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
    setBoards([]);
    setActiveTasks([]);
    sessionStorage.clear();
    navigate('/login');
  };

  // const handleRefreshTokens = () => {
  //   console.log("TTTT triggered: handleRefreshTokens")
  //   refreshTokens(sessionStorage.refreshToken).then((tokens) => {
  //     console.log("TTTT tokens refreshed successfully")
  //     handleGetBoards();
  //   })
  //     .catch((err) => {
  //       handleLogout()
  //     });
  // };
  const handleRefreshTokens = async () => {
    console.log("TTTT triggered: handleRefreshTokens")
    const token = await refreshTokens(sessionStorage.refreshToken)
    if (token) {
      console.log("TTTT tokens refreshed successfully");
      handleGetBoards();
    } else {
      handleLogout()
    }
  };
  
  useEffect(() => {
    if (isTokenExpired(accessToken)) {
      console.log("TTTT token expired, renewing...");
      try {
        handleRefreshTokens().then(() => {
          handleGetBoards().then(() => {
            setIsLoading(false);
          });
        })
      }
      catch (err) {
        handleLogout()
      }
    } else if (boards.length === 0) {
      handleGetBoards().then(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [])

  /*eslint-enable*/
  return (
    <div className="wrapper">
      <Header handleLogout={handleLogout} />
      <h2>Hello {`${idToken.given_name} ${idToken.family_name}`}</h2>
      {!isLoading ? <BoardList boards={boards} /> : "loading..."}
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
