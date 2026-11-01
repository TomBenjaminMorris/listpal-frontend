import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { setCachedTasks } from '../utils/boardCache';
import { NEW_BOARD_DEFAULTS, queueBoardCreate } from '../utils/syncEngine';
import './BoardList.css';

const BoardCard = ({ board, onClick, replacesPlaceholder }) => {
  const maxLength = 12;
  const truncatedText = board.Board.length > maxLength
    ? `${board.Board.substring(0, maxLength)}...`
    : board.Board;

  // Fading the whole card over a placeholder would make its frame vanish and return, so only the contents fade
  const cardFade = replacesPlaceholder ? "" : "fadeInPure-animation";
  const contentFade = replacesPlaceholder ? "placeholderReveal-animation" : "";

  return (
    <Link className={`board-list-item-wrapper ${cardFade}`} to={"/board/" + board.SK} onClick={onClick} >
      <div className={`board-list-item-score ${contentFade}`}>{board.YScore}</div>
      <div className={`board-list-text-emoji-wrapper ${contentFade}`}>
        <div className="boardLink">{truncatedText}</div>
        <div className="boardLink">{board.Emoji}</div>
      </div>
    </Link>
  );
};

const BoardCardPlaceholder = () => (
  <div className="board-list-item-wrapper board-list-item-placeholder" aria-hidden="true">
    <div className="placeholder-bar" />
  </div>
);

// Hidden rather than left out while loading, as the row is centred and the boards would shift when it arrived
const AddBoardButton = ({ onClick, hidden }) => (
  <div id="addBoardButton" className={hidden ? "add-board-button-loading" : ""} onClick={onClick}>
    +
  </div>
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
    <div className="flex-container-board-list">
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
