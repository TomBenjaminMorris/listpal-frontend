import { useEffect } from 'react';
import { parseJwt } from '../utils/utils';
import BoardList from './BoardList';
import DatePills from './DatePills';
import './HomePage.css';
import './PageLayout.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  return hour < 18 ? "☀️" : "🌙";
}

const ScoreContent = ({ totalYScore, totalMScore, totalWScore, isLoading }) => {
  const SCORE_MAP = [
    { name: "Weekly", score: totalWScore },
    { name: "Monthly", score: totalMScore },
    { name: "Yearly", score: totalYScore },
  ]

  return (
    <>
      <h2>✨ Total tasks completed across your boards...</h2>
      <div className="home-page-total-score-wrapper">
        {SCORE_MAP.map(({ name, score }) => (
          <div key={name} className="home-page-total-score-inner-wrapper">
            <div className="home-page-total-score-inner-label">{name}</div>
            <div className="home-page-total-score-inner-score">
              {isLoading
                ? <div className="placeholder-bar home-page-score-placeholder" aria-hidden="true" />
                : <div className="fadeInPure-animation">{score}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const HomePage = ({ boards = [], setBoards, placeholderBoardCount, setPromptConf, setAlertConf, setActiveBoardID }) => {
  const { totalYScore, totalMScore, totalWScore } = boards.reduce((acc, board) => ({
    totalWScore: acc.totalWScore + Number(board.WScore),
    totalMScore: acc.totalMScore + Number(board.MScore),
    totalYScore: acc.totalYScore + Number(board.YScore)
  }), { totalWScore: 0, totalMScore: 0, totalYScore: 0 });

  const userName = parseJwt(sessionStorage.idToken?.toString())?.given_name;

  useEffect(() => {
    document.title = "ListPal | Home 🏠";
  }, []);

  return (
    <div className="home-page-content-wrapper">
      <div className="home-page-content-sub-wrapper fadeUp-animation">

        <div className="page-title-wrapper">
          <h2 className="page-title">{`Good ${getGreeting()}${userName ? `, ${userName}` : ""} ${getGreetingEmoji()}`}</h2>
        </div>

        <div className="home-page-pills">
          <DatePills />
        </div>

        <ScoreContent
          totalYScore={totalYScore}
          totalMScore={totalMScore}
          totalWScore={totalWScore}
          isLoading={placeholderBoardCount > 0}
        />

        <div className="homePageContent">
          <h2 className="settings-headers">Your Boards</h2>
          <hr className="settings-line" />
          <BoardList
            boards={boards}
            placeholderBoardCount={placeholderBoardCount}
            setBoards={setBoards}
            setPromptConf={setPromptConf}
            setAlertConf={setAlertConf}
            setActiveBoardID={setActiveBoardID}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
