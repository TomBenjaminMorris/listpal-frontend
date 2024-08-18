import { useEffect, useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from './utils/apiGatewayClient';
import { isTokenExpired } from './utils/utils';
import PulseLoader from "react-spinners/PulseLoader";
import BoardList from './components/BoardList';
import Header from './components/Header';
import { parseJwt } from './utils/utils';
import './HomePage.css'
const emojiList = ["🎉", "💫", "⭐", "✨"];
const emoji = emojiList[Math.floor(Math.random() * 4)];

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const HomePage = ({ setSortedTasks, boards, setBoards, userDetails, setUserDetails }) => {
  // console.log("rendering: HomePage")
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  var idToken = parseJwt(sessionStorage.idToken.toString());

  const handleGetBoards = async () => {
    console.log("TTT triggered: handleGetBoards")
    const data = await getBoards();
    setBoards(data);
  }

  const handleLogout = () => {
    console.log("TTT triggered: handleLogout")
    setBoards([]);
    setSortedTasks([]);
    setUserDetails({})
    sessionStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (!isTokenExpired()) {
      if (boards.length === 0) {
        handleGetBoards().then(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    } else {
      console.log("TTT HomePage load: token is exipred...");
      window.location.reload();
    }
  }, [])

  return (
    <div className="wrapper">
      <Header handleLogout={handleLogout} />
      {<h2>{`Hello ${idToken.given_name} 👋`}</h2>}
      {<h2>{`Your total score across all your boards is... 100 ${emoji}`}</h2>}
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
            <BoardList boards={boards} setBoards={setBoards} />
        }
      </div>
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
// var idToken = parseJwt(sessionStorage.idToken.toString());
// var accessToken = parseJwt(sessionStorage.accessToken.toString());
// {<h2>Hello {`${idToken.given_name} ${idToken.family_name}`}</h2>}
