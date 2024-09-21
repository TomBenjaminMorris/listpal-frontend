import { CSSProperties, useEffect } from 'react';
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

const HomePage = ({ handleLogout, boards, setBoards, userDetails, handleSidebarCollapse, sidebarIsOpen, isLoading, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isMobile, hideMobileSidebar, setHideMobileSidebar, setSidebarIsOpen }) => {
  // console.log("rendering: HomePage")
  var idToken = parseJwt(sessionStorage.idToken.toString());

  useEffect(() => {
    document.title = "ListPal | Home";
  }, [])

  const content = (
    <>
      <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} />
      <div className="home-page-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} />

        <div className="home-page-content-sub-wrapper">
          {<h2>{`Good ${getGreeting()}, ${idToken.given_name} 👋`}</h2>}
          {<h2>{`Your total score this year, so far is...`}</h2>}
          {<h1 className="totalScore" style={{ fontSize: "40px" }}>{userDetails.YScore && `${emojiList[3]} ${userDetails.YScore} ${emojiList[3]}`}</h1>}
          <div className="homePageContent">
            <BoardList boards={boards} setBoards={setBoards} />
          </div>
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
