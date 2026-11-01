import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { setCachedTasks } from '../utils/boardCache';
import { NEW_BOARD_DEFAULTS, queueBoardCreate } from '../utils/syncEngine';
import { formatScore } from '../utils/utils';
import { PlusIcon } from './Icons';
import './BoardList.css';

const BoardCard = ({ board, onClick, replacesPlaceholder }) => {
  const weeklyScore = Number(board.WScore);
  const weeklyTarget = Number(board.WTarget);
  const weeklyPercent = weeklyTarget > 0 ? Math.min(weeklyScore / weeklyTarget, 1) * 100 : 0;

  // Fading the whole card over a placeholder would make its frame vanish and return, so only the contents fade
  const cardFade = replacesPlaceholder ? "" : "fadeInPure-animation";
  const contentFade = replacesPlaceholder ? "placeholderReveal-animation" : "";

  return (
    <Link className={`board-card ${cardFade}`} to={"/board/" + board.SK} title={board.Board} onClick={onClick} >
      <div className={`board-card-head ${contentFade}`}>
        <span className="board-card-emoji">{board.Emoji}</span>
        <span className="board-card-name">{board.Board}</span>
        <div className="board-card-year">
          <div className="board-card-year-value">{formatScore(Number(board.YScore))}</div>
          <div className="board-card-year-label">this year</div>
        </div>
      </div>
      <div className={contentFade}>
        <div className="board-card-figures">
          {weeklyScore.toLocaleString()}{weeklyTarget > 0 && ` of ${weeklyTarget.toLocaleString()}`} this week
        </div>
        <div className="board-card-meter" aria-hidden="true">
          <div style={{ width: `${weeklyPercent}%` }} />
        </div>
      </div>
    </Link>
  );
};

const BoardCardPlaceholder = () => (
  <div className="board-card board-card-placeholder" aria-hidden="true">
    <div className="board-card-head">
      <div className="board-card-emoji"><div className="placeholder-bar" /></div>
      <div className="placeholder-bar" />
      <div className="board-card-year"><div className="placeholder-bar" /></div>
    </div>
    <div>
      <div className="board-card-figures"><div className="placeholder-bar" /></div>
      <div className="board-card-meter" />
    </div>
  </div>
);

// Hidden rather than left out while loading, so it can't be clicked before the boards it would be added to have landed
const AddBoardButton = ({ onClick, hidden }) => (
  <button className={`add-tile ${hidden ? "add-board-button-loading" : ""}`} onClick={onClick} disabled={hidden}>
    <span className="add-tile-icon"><PlusIcon /></span>
    <span>New board</span>
  </button>
);

const BoardList = ({ boards = [], placeholderBoardCount = 0, setBoards, setPromptConf, setAlertConf, setActiveBoardID }) => {
  const navigate = useNavigate();

  // Outlives the load, so a card's fade doesn't change, and restart, once the placeholder count drops to zero
  const placeholdersShown = useRef(0);
  if (placeholderBoardCount > 0) placeholdersShown.current = placeholderBoardCount;

  const handleNewBoard = (name) => {
    if (!name?.trim()) {
      setAlertConf({
        display: true,
        title: "Name, please! ✏️",
        textValue: "Every board needs a name, even a short one.",
      });
      return;
    }

    const newBoard = { SK: "b#" + uuidv4(), Board: name, ...NEW_BOARD_DEFAULTS };

    setBoards(prevBoards => [...prevBoards, newBoard]);
    queueBoardCreate(newBoard);
    // A new board has no tasks, so it can show at once rather than waiting for its create to sync
    setCachedTasks(newBoard.SK, {});
    setActiveBoardID(newBoard.SK);
    navigate("/board/" + newBoard.SK);
  };

  const handleAddBoardClick = () => {
    setPromptConf({
      display: true,
      isEdit: false,
      defaultText: "",
      title: "Name your new board ✏️",
      callbackFunc: handleNewBoard,
    });
  };

  return (
    <div className="board-list">
      {placeholderBoardCount > 0
        ? Array.from({ length: placeholderBoardCount }, (_, i) => <BoardCardPlaceholder key={i} />)
        : boards.map((board, i) => (
          <BoardCard
            key={board.SK}
            board={board}
            replacesPlaceholder={i < placeholdersShown.current}
            onClick={() => setActiveBoardID(board.SK)}
          />
        ))}
      <AddBoardButton onClick={handleAddBoardClick} hidden={placeholderBoardCount > 0} />
    </div>
  );
};

export default BoardList;
