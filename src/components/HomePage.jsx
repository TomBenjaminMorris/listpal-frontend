import { useEffect } from 'react';
import { formatScore } from '../utils/utils';
import { getAccountDetails } from '../utils/accountService';
import BoardList from './BoardList';
import DatePills from './DatePills';
import './HomePage.css';
import './PageLayout.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
};

const getGreetingEmoji = () => new Date().getHours() < 18 ? "☀️" : "🌙";

const SCORE_PERIODS = [
  { name: "Week", field: "WScore" },
  { name: "Month", field: "MScore" },
  { name: "Year", field: "YScore" },
];

const ScoreContent = ({ totals, isLoading }) => {
  return (
    <div className="home-totals" title="Tasks completed across all boards">
      <div className="home-totals-caption">✨ Tasks completed</div>
      <div className="home-stats">
        {SCORE_PERIODS.map(({ name, field }) => (
          <div key={name} className="home-stat">
            <div className="home-stat-value">
              {isLoading
                ? <div className="placeholder-bar home-stat-placeholder" aria-hidden="true" />
                : <div className="placeholderReveal-animation">{formatScore(totals[field])}</div>}
            </div>
            <div className="home-stat-label">{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage = ({ boards = [], setBoards, placeholderBoardCount, setPromptConf, setAlertConf, setActiveBoardID }) => {
  const totals = Object.fromEntries(SCORE_PERIODS.map(({ field }) => [
    field,
    boards.reduce((total, board) => total + Number(board[field]), 0)
  ]));

  const userName = getAccountDetails().givenName;

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

        <ScoreContent totals={totals} isLoading={placeholderBoardCount > 0} />
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
