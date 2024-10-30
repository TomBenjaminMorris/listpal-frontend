import { CSSProperties, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { parseJwt } from '../utils/utils';
import PulseLoader from "react-spinners/PulseLoader";
import BoardList from './BoardList';
import Header from './Header';
import './HomePage.css'
import SideNavBar from './SideNavBar';

const emojiList = ["🎉", "💫", "⭐", "✨"];
// const emoji = emojiList[Math.floor(Math.random() * 4)];

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

const HomePage = ({ handleLogout, boards, setBoards, handleSidebarCollapse, sidebarIsOpen, isLoading, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isMobile, hideMobileSidebar, setHideMobileSidebar, setSidebarIsOpen, setIsLoading }) => {
  // console.log("rendering: HomePage")
  const [totalScore, setTotalScore] = useState(0);
  var idToken = parseJwt(sessionStorage.idToken.toString());

  useEffect(() => {
    document.title = "ListPal | Home";
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
      <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} />
      <div className="home-page-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} setIsLoading={setIsLoading} />
        <div className="home-page-content-sub-wrapper fadeUp-animation">
          {<h2>{`Good ${getGreeting()}, ${idToken.given_name} 👋`}</h2>}
          {<h2>The total score across your boards this year is...</h2>}
          {<h1 className="totalScore" style={{ fontSize: "40px" }}>
            {totalScore && `${emojiList[3]} ${totalScore} ${emojiList[3]}`}
          </h1>}
          <div className="homePageContent">
            <BoardList boards={boards} setBoards={setBoards} />
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
