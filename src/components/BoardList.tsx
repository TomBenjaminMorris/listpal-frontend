import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './BoardList.css'

const BoardList = ({ boards, setBoards }) => {
  // console.log("rendering: BoardList")

  const handleBoardSelect = (b) => {
    // setActiveBoard(b)
    localStorage.setItem('activeBoard', JSON.stringify(b));
  }

  const handleNewBoard = async () => {
    console.log("TTT triggered: handleNewTask")
    const newBoard = { "SK": "b#" + uuidv4(), "Board": "New Board" }
    let tmpBoards = [...boards];
    tmpBoards.push(newBoard);
    setBoards(tmpBoards);
  }

  const boardsRendered = boards.map((b) => {
    return (
      <Link key={b.SK} className="boardLink" to={"/board/" + b.SK} onClick={() => handleBoardSelect(b)}>{b.Board}</Link>
    )
  });

  return (
    <div className="flex-container-board-list">
      {boardsRendered}
      <div autoFocus id="addBoardButton" onClick={handleNewBoard}>+</div>
    </div>
  );
};

export default BoardList;
