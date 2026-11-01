import { useEffect } from 'react';
import { formatScore, parseJwt } from '../utils/utils';
import BoardList from './BoardList';
import DatePills from './DatePills';
import './HomePage.css';
import './PageLayout.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
};

const getGreetingEmoji = () => new Date().getHours() < 18 ? "☀️" : "🌙";

const ScoreContent = ({ totalYScore, totalMScore, totalWScore, isLoading }) => {
  const SCORE_MAP = [
    { name: "Week", score: totalWScore },
    { name: "Month", score: totalMScore },
    { name: "Year", score: totalYScore },
  ]

  return (
    <div className="home-totals" title="Tasks completed across all boards">
      <div className="home-totals-caption">✨ Tasks completed</div>
      <div className="home-stats">
        {SCORE_MAP.map(({ name, score }) => (
          <div key={name} className="home-stat">
            <div className="home-stat-value">
              {isLoading
                ? <div className="placeholder-bar home-stat-placeholder" aria-hidden="true" />
                : <div className="placeholderReveal-animation">{formatScore(score)}</div>}
            </div>
            <div className="home-stat-label">{name}</div>
          </div>
        ))}
      </div>
    </div>
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
      <header className="home-header">
        <div>
          <h1 className="page-heading">{`Good ${getGreeting()}${userName ? `, ${userName}` : ""} ${getGreetingEmoji()}`}</h1>
          <DatePills showDate />
        </div>

        <ScoreContent
          totalYScore={totalYScore}
          totalMScore={totalMScore}
          totalWScore={totalWScore}
          isLoading={placeholderBoardCount > 0}
        />
      </header>

      <section className="page-section">
        <div className="page-section-header">
          <h2>Your boards</h2>
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
