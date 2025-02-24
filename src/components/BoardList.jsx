import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { newBoardAPI } from '../utils/apiGatewayClient';
import './BoardList.css';

const BoardCard = ({ board, onClick }) => {
  const maxLength = 12;
  const truncatedText = board.Board.length > maxLength
    ? `${board.Board.substring(0, maxLength)}...`
    : board.Board;

  return (
    <Link className="board-list-item-wrapper" to={"/board/" + board.SK} onClick={onClick} >
      <div className="board-list-item-score">{board.YScore}</div>
      <div className="board-list-text-emoji-wrapper">
        <div className="boardLink">{truncatedText}</div>
        <div className="boardLink">{board.Emoji}</div>
      </div>
    </Link>
  );
};

const AddBoardButton = ({ onClick }) => (
  <div id="addBoardButton" onClick={onClick}>
    +
  </div>
);

const BoardList = ({ boards = [], setBoards, setPromptConf, setAlertConf, setActiveBoard }) => {
  const handleNewBoard = async (name) => {
    if (!name?.trim()) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "Board name can't be empty...",
      });
      return;
    }

    const newBoard = {
      SK: "b#" + uuidv4(),
      Board: name,
      WTarget: 7,
      YTarget: 365,
      MTarget: 31,
      WScore: 0,
      MScore: 0,
      YScore: 0,
      Emoji: "🚀",
      CategoryOrder: [],
    };

    setBoards(prevBoards => [...prevBoards, newBoard]);
    await newBoardAPI(newBoard.SK, newBoard.Board);
  };

  const handleAddBoardClick = () => {
    setPromptConf({
      display: true,
      isEdit: false,
      defaultText: "",
      title: "Enter New Board Name...",
      callbackFunc: handleNewBoard,
    });
  };

  return (
    <div className="flex-container-board-list">
      {boards.map(board => (
        <BoardCard
          key={board.SK}
          board={board}
          onClick={() => setActiveBoard(board)}
        />
      ))}
      <AddBoardButton onClick={handleAddBoardClick} />
    </div>
  );
};

export default BoardList;
