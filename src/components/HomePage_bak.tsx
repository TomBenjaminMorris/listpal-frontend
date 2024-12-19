import { CSSProperties, useEffect, useState } from 'react';
import { parseJwt } from '../utils/utils';
import PulseLoader from "react-spinners/PulseLoader";
import BoardList from './BoardList';
import './HomePage.css'

const emojiList = ["🎉", "💫", "⭐", "✨"];

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

const HomePage = ({ boards, setBoards, sidebarIsOpen, isLoading, setPromptConf, setAlertConf }) => {
  // console.log("rendering: HomePage")
  const [totalScore, setTotalScore] = useState(0);
  var idToken = sessionStorage.idToken && parseJwt(sessionStorage.idToken.toString());

  useEffect(() => {
    document.title = "ListPal | Home 🏠";
  }, [])

  useEffect(() => {
    let score = 0
    boards && boards.forEach(element => {
      score += Number(element.YScore)
    });
    setTotalScore(score)
  }, [boards])

  const content = (
    <>
      <div className={`home-page-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="home-page-content-sub-wrapper fadeUp-animation">
          <h2>{`Good ${getGreeting()}${idToken && idToken.given_name != undefined ? ", " + idToken.given_name : ""} 👋`}</h2>
          {totalScore == 0 || totalScore == undefined ?
            <>
              <div style={{ fontSize: "22px" }}>Create your first board and start completing tasks to see your score...</div>
            </> :
            <>
              <h2>The total score across your boards this year is...</h2>
              <h1 className="totalScore" style={{ fontSize: "40px" }}>
                {totalScore && `${emojiList[3]} ${totalScore} ${emojiList[3]}`}
              </h1>
            </>}
          <div className="homePageContent">
            <BoardList boards={boards} setBoards={setBoards} setPromptConf={setPromptConf} setAlertConf={setAlertConf} />
          </div>
        </div>
      </div>
    </>
  )

  const loader = (
    <div className="loadingWrapper">
      <PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  )

  return (
    <div className="wrapper">
      {isLoading ? loader : content}
    </div>
  );
};

export default HomePage;
