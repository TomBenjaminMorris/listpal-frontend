import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { newBoardAPI } from '../utils/apiGatewayClient';
import './BoardList.css'

const BoardList = ({ boards, setBoards }) => {
  // console.log("rendering: BoardList")

  const handleBoardSelect = (b) => {
    localStorage.setItem('activeBoard', JSON.stringify(b));
  }

  const handleNewBoard = async () => {
    // console.log("TTT triggered: handleNewTask")
    const name = prompt("Enter new name...");
    if (name == "") {
      alert("Board name can't be empty");
      return;
    }
    if (!name) {
      return;
    }
    const newBoard = {
      "SK": "b#" + uuidv4(),
      "Board": name,
      "WTarget": 7,
      "YTarget": 365,
      "MTarget": 31,
      "WScore": 0,
      "MScore": 0,
      "YScore": 0,
      "Emoji": "🚀"
    }
    let tmpBoards = [...boards];
    tmpBoards.push(newBoard);
    newBoardAPI(newBoard.SK, newBoard.Board);
    setBoards(tmpBoards);
  }

  const boardsRendered = boards.map((b) => {
    return (
      <Link key={b.SK} className="board-list-item-wrapper" to={"/board/" + b.SK} onClick={() => handleBoardSelect(b)}>
        <div className="board-list-item-score">{b.YScore}</div>
        <div className="board-list-text-emoji-wrapper">
          <div className="boardLink">{b.Board}</div>
          <div className="boardLink">{b.Emoji}</div>
        </div>
      </Link>
    )
  });

  return (
    <div className="flex-container-board-list">
      {boardsRendered}
      <div id="addBoardButton" onClick={handleNewBoard}>+</div>
    </div>
  );
};

export default BoardList;
