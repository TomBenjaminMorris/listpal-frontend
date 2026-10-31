import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { NEW_BOARD_DEFAULTS, queueBoardCreate } from '../utils/syncEngine';
import './BoardList.css';

const BoardCard = ({ board, onClick }) => {
  const maxLength = 12;
  const truncatedText = board.Board.length > maxLength
    ? `${board.Board.substring(0, maxLength)}...`
    : board.Board;

  return (
    <Link className="board-list-item-wrapper fadeInPure-animation" to={"/board/" + board.SK} onClick={onClick} >
      <div className="board-list-item-score">{board.YScore}</div>
      <div className="board-list-text-emoji-wrapper">
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
        : boards.map(board => (
          <BoardCard
            key={board.SK}
            board={board}
            onClick={() => setActiveBoardID(board.SK)}
          />
        ))}
      <AddBoardButton onClick={handleAddBoardClick} hidden={placeholderBoardCount > 0} />
    </div>
  );
};

export default BoardList;
