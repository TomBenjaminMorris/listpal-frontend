import { useEffect, useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from './utils/apiGatewayClient';
// import { parseJwt, isTokenExpired } from './utils/utils';
// import { refreshTokens } from './utils/authService';
import PulseLoader from "react-spinners/PulseLoader";
import './HomePage.css'
import BoardList from './components/BoardList';
import Header from './components/Header';

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

/*eslint-disable*/
// HomePage
const HomePage = ({ boards, setBoards, setActiveTasks }) => {
  console.log("rendering: HomePage")
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // var idToken = parseJwt(sessionStorage.idToken.toString());
  // var accessToken = parseJwt(sessionStorage.accessToken.toString());

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

  // const handleRefreshTokens = async () => {
  //   console.log("TTTT triggered: handleRefreshTokens")
  //   const token = await refreshTokens(sessionStorage.refreshToken)
  //   if (token) {
  //     console.log("TTTT tokens refreshed successfully");
  //     handleGetBoards();
  //   } else {
  //     handleLogout()
  //   }
  // };

  useEffect(() => {
    // if (isTokenExpired(accessToken)) {
    //   console.log("TTTT token expired, renewing...");
    //   try {
    //     handleRefreshTokens().then(() => {
    //       handleGetBoards().then(() => {
    //         setIsLoading(false);
    //       });
    //     })
    //   }
    //   catch (err) {
    //     handleLogout()
    //   }
    // } else 
    if (boards.length === 0) {
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
      <div className="homePageContent">
        {
          isLoading ?
            <PulseLoader
            cssOverride={override}
            size={10}
            color={"#fff"}
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
            /> :
            <BoardList boards={boards} />
          }
      </div>
    </div>
  );
};

export default HomePage;

{/* <h2>Hello {`${idToken.given_name} ${idToken.family_name}`}</h2> */}
// console.log ("Amazon Cognito ID token encoded: " + sessionStorage.idToken.toString());
// console.log ("Amazon Cognito ID token decoded: ");
// console.log ( idToken );
// console.log ("Amazon Cognito access token encoded: " + sessionStorage.accessToken.toString());
// console.log ("Amazon Cognito access token decoded: ");
// console.log ( accessToken );
// console.log ("Amazon Cognito refresh token: ");
// console.log ( sessionStorage.refreshToken );
