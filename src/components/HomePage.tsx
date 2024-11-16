import { CSSProperties, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { parseJwt } from '../utils/utils';
import PulseLoader from "react-spinners/PulseLoader";
import BoardList from './BoardList';
import Header from './Header';
import './HomePage.css'
import SideNavBar from './SideNavBar';
import GaugeChart from 'react-gauge-chart'


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
  const [totalTargets, setTotalTargets] = useState(0);
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

    let targets = 0
    boards && boards.forEach(element => {
      targets += Number(element.YTarget)
    });
    setTotalTargets(targets)
  }, [boards])

  const chartStyle = {
    width: 300,
    margin: "auto"
  }

  const content = (
    <>
      <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} />
      <div className="home-page-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} setIsLoading={setIsLoading} />
        <div className="home-page-content-sub-wrapper fadeUp-animation">
          <h2>{`Good ${getGreeting()}, ${idToken.given_name} 👋`}</h2>
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
          {totalScore !=0 && <GaugeChart id="gauge-chart"
            animate={false}
            arcPadding={0.03}
            cornerRadius={3}
            style={chartStyle}
            percent={Math.round(totalScore / totalTargets * 100) / 100}
            hideText={true}
            textColor="var(--accent)"
            needleColor="var(--accent)"
            needleBaseColor="var(--accent)"
            needleScale={0.6}
            nrOfLevels={4}
            colors={['#FFFE']}
            arcWidth={0.15}
          />}
          {totalScore !=0 && <div style={{ fontSize: "24px", marginTop: "-10px" }}>{totalScore && `${Math.round(totalScore / totalTargets * 100)}%`}</div>}
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
