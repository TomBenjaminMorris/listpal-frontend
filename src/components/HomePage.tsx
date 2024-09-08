import { useEffect, useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, getUser } from '../utils/apiGatewayClient';
import { isTokenExpired } from '../utils/utils';
import { parseJwt } from '../utils/utils';
import PulseLoader from "react-spinners/PulseLoader";
import BoardList from './BoardList';
import Header from './Header';
import './HomePage.css'

const emojiList = ["🎉", "💫", "⭐", "✨"];
const emoji = emojiList[Math.floor(Math.random() * 4)];

const getGreeting = () => {
  var today = new Date()
  var curHr = today.getHours()

  if (curHr < 12) {
    return "Morning"
  } else if (curHr < 18) {
    return "Afternoon"
  } else {
    return "Evening"
  }
}

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const HomePage = ({ setSortedTasks, boards, setBoards, userDetails, setUserDetails, handleRefreshTokens }) => {
  // console.log("rendering: HomePage")
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  var idToken = parseJwt(sessionStorage.idToken.toString());

  const handleGetBoards = async () => {
    // console.log("TTT triggered: handleGetBoards")
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
    document.title = "ListPal | Home";
    if (!isTokenExpired()) {
      if (boards.length === 0 || Object.keys(userDetails).length === 0 && userDetails.constructor === Object) {
        handleGetBoards().then(() => {
          // setIsLoading(false);
          getUser().then((u) => {
            setUserDetails(u[0]);
            setIsLoading(false);
          })
        });
      } else {
        setIsLoading(false);
      }

    } else {
      setIsLoading(true);
      console.log("TTT HomePage load: token is exipred...");
      try {
        handleRefreshTokens().then((t) => {
          handleGetBoards().then(() => {
            getUser().then((u) => {
              setUserDetails(u[0]);
              setIsLoading(false);
            })
          });
        })
      }
      catch (err) {
        console.error(err);
      }
    }
  }, [setBoards])

  const content = (
    <>
      <Header handleLogout={handleLogout} />
      <div className="home-page-content-wrapper">
        {<h2>{`Good ${getGreeting()}, ${idToken.given_name} 👋`}</h2>}
        {<h2>{`Your total score this year, so far is...`}</h2>}
        {<h1 className="totalScore" style={{ fontSize: "40px" }}>{userDetails.YScore && `${emojiList[3]} ${userDetails.YScore} ${emojiList[3]}`}</h1>}
        <div className="homePageContent">
          <BoardList boards={boards} setBoards={setBoards} />
        </div>
      </div>
    </>
  )

  return (
    <div className="wrapper">
      {isLoading ? <div className="loadingWrapper"><PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      /></div> : content}
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
