import { useEffect } from 'react';
import { formatScore, parseJwt } from '../utils/utils';
import BoardList from './BoardList';
import DatePills from './DatePills';
import { LogoMark } from './Icons';
import './HomePage.css';
import './PageLayout.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
};

const getGreetingEmoji = () => new Date().getHours() < 18 ? "☀️" : "🌙";

const ScoreContent = ({ totalYScore, totalMScore, totalWScore, isLoading }) => {
  const SCORE_MAP = [
    { name: "This week", score: totalWScore },
    { name: "This month", score: totalMScore },
    { name: "This year", score: totalYScore },
  ]

  return (
    <section className="page-section">
      <div className="page-section-header">
        <h2>✨ Tasks completed</h2>
        <span>across all boards</span>
      </div>
      <div className="home-stats">
        {SCORE_MAP.map(({ name, score }) => (
          <div key={name} className="home-stat">
            <div className="home-stat-label">{name}</div>
            <div className="home-stat-value">
              {isLoading
                ? <div className="placeholder-bar home-stat-placeholder" aria-hidden="true" />
                : <div className="placeholderReveal-animation">{formatScore(score)}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <div className="page-column fadeUp-animation">
      <header>
        <h1 className="page-heading">{`Good ${getGreeting()}${userName ? `, ${userName}` : ""} ${getGreetingEmoji()}`}</h1>
        <DatePills showDate />
      </header>

      <ScoreContent
        totalYScore={totalYScore}
        totalMScore={totalMScore}
        totalWScore={totalWScore}
        isLoading={placeholderBoardCount > 0}
      />

      <section className="page-section">
        <div className="page-section-header">
          <h2><LogoMark className="home-section-logo" />Your boards</h2>
        </div>
        <BoardList
          boards={boards}
          placeholderBoardCount={placeholderBoardCount}
          setBoards={setBoards}
          setPromptConf={setPromptConf}
          setAlertConf={setAlertConf}
          setActiveBoardID={setActiveBoardID}
        />
      </section>
    </div>
  );
};

export default HomePage;
