import { CSSProperties, useEffect, useMemo } from 'react';
import { parseJwt } from '../utils/utils';
import PulseLoader from "react-spinners/PulseLoader";
import BoardList from './BoardList';
import './HomePage.css';

const EMOJIS = {
  SPARKLES: "✨",
} as const;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
};

const LOADER_STYLE: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const HomePage = ({ 
  boards = [], 
  setBoards, 
  sidebarIsOpen, 
  isLoading, 
  setPromptConf, 
  setAlertConf 
}) => {
  // Calculate totals using useMemo to avoid unnecessary recalculations
  const { totalScore, totalTargets } = useMemo(() => {
    if (!boards?.length) return { totalScore: 0, totalTargets: 0 };
    
    return boards.reduce((acc, board) => ({
      totalScore: acc.totalScore + Number(board.YScore),
      totalTargets: acc.totalTargets + Number(board.YTarget)
    }), { totalScore: 0, totalTargets: 0 });
  }, [boards]);

  // Get user's name from session storage, memoized to avoid recalculation
  const userName = useMemo(() => {
    const idToken = sessionStorage.idToken && parseJwt(sessionStorage.idToken.toString());
    return idToken?.given_name;
  }, []);

  useEffect(() => {
    document.title = "ListPal | Home 🏠";
  }, []);

  const renderScoreContent = () => {
    if (!totalScore) {
      return (
        <div style={{ fontSize: "22px" }}>
          Create your first board and start completing tasks to see your score...
        </div>
      );
    }

    return (
      <>
        <h2>The total score across your boards this year is...</h2>
        <h1 className="totalScore" style={{ fontSize: "40px" }}>
          {`${EMOJIS.SPARKLES} ${totalScore} ${EMOJIS.SPARKLES}`}
        </h1>
        {/* ...Out of {totalTargets} */}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="wrapper">
        <div className="loadingWrapper">
          <PulseLoader
            cssOverride={LOADER_STYLE}
            size={12}
            color="var(--text-colour)"
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <div className={`home-page-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="home-page-content-sub-wrapper fadeUp-animation">
          <h2>{`Good ${getGreeting()}${userName ? `, ${userName}` : ""} 👋`}</h2>
          {renderScoreContent()}
          <div className="homePageContent">
            <BoardList 
              boards={boards} 
              setBoards={setBoards} 
              setPromptConf={setPromptConf} 
              setAlertConf={setAlertConf} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
