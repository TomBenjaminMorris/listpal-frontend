import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { newBoardAPI } from '../utils/apiGatewayClient';
import './BoardList.css';

const BoardCard = memo(({ board, onSelect }) => (
  <Link className="board-list-item-wrapper" to={"/board/" + board.SK} onClick={() => onSelect(board)}  >
    <div className="board-list-item-score">{board.YScore}</div>
    <div className="board-list-text-emoji-wrapper">
      <div className="boardLink">{board.Board}</div>
      <div className="boardLink">{board.Emoji}</div>
    </div>
  </Link>
));

const AddBoardButton = memo(({ onClick }) => (
  <div id="addBoardButton" onClick={onClick}>
    +
  </div>
));

const BoardList = memo(({ boards = [], setBoards, setPromptConf, setAlertConf }) => {
  const handleBoardSelect = useCallback((board) => {
    localStorage.setItem('activeBoard', JSON.stringify(board));
  }, []);

  const handleNewBoard = useCallback(async (name) => {
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
  }, [setBoards, setAlertConf]);

  const handleAddBoardClick = useCallback(() => {
    setPromptConf({
      display: true,
      isEdit: false,
      defaultText: "",
      title: "Enter New Board Name...",
      callbackFunc: handleNewBoard,
    });
  }, [setPromptConf, handleNewBoard]);

  return (
    <div className="flex-container-board-list">
      {boards.map(board => (
        <BoardCard
          key={board.SK}
          board={board}
          onSelect={handleBoardSelect}
        />
      ))}
      <AddBoardButton onClick={handleAddBoardClick} />
    </div>
  );
});

export default BoardList;
