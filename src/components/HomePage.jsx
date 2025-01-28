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

// Determine the current week of the year
function getCurrentWeekOfYear() {
  const date = new Date();
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / 86400000);
  const dayOfWeek = (date.getDay() + 6) % 7;
  const weekNumber = Math.ceil((dayOfYear + dayOfWeek + 1) / 7);
  return weekNumber;
}

// Array of quotes and attributes to be used later
const quotes = [
  {
    quote: "It is easy to get bogged down trying to find the optimal plan for change: the fastest way to lose weight, the best program to build muscle, the perfect idea for a side hustle. We are so focused on figuring out the best approach that we never get around to taking action.",
    attribute: "James Clear | Atomic Habits"
  },
  {
    quote: "Your outcomes are a lagging measure of your habits. Your net worth is a lagging measure of your financial habits. Your weight is a lagging measure of your eating habits. Your knowledge is a lagging measure of your learning habits. Your clutter is a lagging measure of your cleaning habits. You get what you repeat.",
    attribute: "James Clear | Atomic Habits"
  },
  {
    quote: "Some people spend their entire lives waiting for the time to be right to make an improvement.",
    attribute: "James Clear | Atomic Habits"
  },
  {
    quote: "Making a choice that is 1 percent better or 1 percent worse seems insignificant in the moment, but over the span of moments that make up a lifetime these choices determine the difference between who you are and who you could be. Success is the product of daily habits—not once-in-a-lifetime transformations.",
    attribute: "James Clear | Atomic Habits"
  },
  {
    quote: "The ultimate form of intrinsic motivation is when a habit becomes part of your identity. It’s one thing to say I’m the type of person who wants this. It’s something very different to say I’m the type of person who is this.",
    attribute: "James Clear | Atomic Habits"
  },
]

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const quote = quotes[getRandomInt(quotes.length)]

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
      <h2>✨ Total tasks completed across your boards...</h2>
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
    <div className="home-page-content-wrapper">
      {
        isLoading ? <Loader /> : (
          <div className="home-page-content-sub-wrapper fadeUp-animation">
            <div className="home-page-week">
              {"Week of the Year: " + getCurrentWeekOfYear()}
            </div>
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

            <div className="homePageContent">
              <h2 className="settings-headers">Today's Tip</h2>
              <hr className="settings-line" />
              <div className="home-page-todays-tip-wrapper">
                <div className="home-page-todays-tip-quote">
                  {quote.quote}
                </div>
                <div className="home-page-todays-tip-attribution">
                  - {quote.attribute}
                </div>
              </div>
            </div>

            {/* <h2 className="settings-headers">Latest Roundup</h2>
              <hr className="settings-line" /> */}
          </div>
        )
      }
    </div>
  );
};

export default HomePage;
