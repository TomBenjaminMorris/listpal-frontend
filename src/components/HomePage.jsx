import { memo, useEffect, useMemo } from 'react';
import { parseJwt } from '../utils/utils';
import BoardList from './BoardList';
import Loader from './Loader';
import './HomePage.css';

const EMOJIS = {
  SPARKLES: "✨"
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
};

// Memoized score content component
const ScoreContent = memo(({ totalScore, totalTargets }) => {
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
        {/* ...out of {totalTargets} */}
    </>
  );
});

// Main HomePage component
const HomePage = memo(({ boards = [], setBoards, sidebarIsOpen, isLoading, setPromptConf, setAlertConf }) => {

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

  return (
    <div className="wrapper">
      <div className={`home-page-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        {
          isLoading ? <Loader sidebarIsOpen={sidebarIsOpen}/> : <div className="home-page-content-sub-wrapper fadeUp-animation">
            <h2>{`Good ${getGreeting()}${userName ? `, ${userName}` : ""} 👋`}</h2>
            <ScoreContent totalScore={totalScore} totalTargets={totalTargets} />
            <div className="homePageContent">
              <BoardList
                boards={boards}
                setBoards={setBoards}
                setPromptConf={setPromptConf}
                setAlertConf={setAlertConf}
              />
            </div>
          </div>
        }
      </div>
    </div>
  );
});

export default HomePage;
