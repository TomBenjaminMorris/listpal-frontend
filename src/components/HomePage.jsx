import { useEffect } from 'react';
import { parseJwt } from '../utils/utils';
import BoardList from './BoardList';
import Loader from './Loader';
import './HomePage.css';

// Determine greeting based on current time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
};

// Determine greeting emoji based on current time of day
const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  return hour < 18 ? "☀️" : "🌙";
}

// Component to display total scores or initial message
const ScoreContent = ({ totalYScore, totalMScore, totalWScore }) => {
  // Show prompt if no scores exist
  if (!totalYScore) {
    return <div style={{ fontSize: "22px" }}>Create your first board to see your score...</div>;
  }

  // Map for displaying weekly/monthly/yearly scores
  const SCORE_MAP = [
    { name: "Weekly", score: totalWScore },
    { name: "Monthly", score: totalMScore },
    { name: "Yearly", score: totalYScore },
  ]

  // Display total scores
  return (
    <>
      <h2>✨ Total scores across your boards...</h2>
      <div className="home-page-total-score-wrapper">
        {SCORE_MAP.map(({ name, score }) => (
          <div key={name} className="home-page-total-score-inner-wrapper">
            <div className="home-page-total-score-inner-label">{name}</div>
            <div className="home-page-total-score-inner-score">{score}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// Main HomePage component for displaying boards and user information
const HomePage = ({ boards = [], setBoards, isLoading, setPromptConf, setAlertConf }) => {
  // Calculate total scores by reducing board data
  const { totalYScore, totalMScore, totalWScore } = boards.reduce((acc, board) => ({
    totalWScore: acc.totalWScore + Number(board.WScore),
    totalMScore: acc.totalMScore + Number(board.MScore),
    totalYScore: acc.totalYScore + Number(board.YScore)
  }), { totalWScore: 0, totalMScore: 0, totalYScore: 0 });

  // Extract username from JWT token in session storage
  const userName = parseJwt(sessionStorage.idToken?.toString())?.given_name;

  // Set page title on component mount
  useEffect(() => {
    document.title = "ListPal | Home 🏠";
  }, []);

  return (
    <div className="wrapper">
      <div className="home-page-content-wrapper">
        {
          isLoading ? <Loader /> : (
            <div className="home-page-content-sub-wrapper fadeUp-animation">
              {/* Personalized greeting with optional username */}
              <h2>{`Good ${getGreeting()}${userName ? `, ${userName}` : ""} ${getGreetingEmoji()}`}</h2>

              {/* Display total scores */}
              <ScoreContent
                totalYScore={totalYScore}
                totalMScore={totalMScore}
                totalWScore={totalWScore}
              />

              {/* Board list section */}
              <div className="homePageContent">
                <h2 className="settings-headers">Your Boards</h2>
                <hr className="settings-line" />
                <BoardList
                  boards={boards}
                  setBoards={setBoards}
                  setPromptConf={setPromptConf}
                  setAlertConf={setAlertConf}
                />
              </div>

              {/* <h2 className="settings-headers">Latest Roundup</h2>
              <hr className="settings-line" /> */}
            </div>
          )
        }
      </div>
    </div>
  );
};

export default HomePage;
