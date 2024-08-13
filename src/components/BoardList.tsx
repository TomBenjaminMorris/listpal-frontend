import { Link } from 'react-router-dom';
import './BoardList.css'

const BoardList = ({ boards }) => {
  // console.log("rendering: BoardList")

  const handleBoardSelect = (b) => {
    // setActiveBoard(b)
    localStorage.setItem('activeBoard', JSON.stringify(b));
  }

  const boardsRendered = boards.map((b) => {
    return (
      <Link key={b.SK} className="boardLink" to={"/board/" + b.SK} onClick={() => handleBoardSelect(b)}>{b.Board}</Link>
    )
  });

  return (
    <div className="flex-container">
      {boardsRendered}
      <div id="addBoardButton">+</div>
    </div>
  );
};

export default BoardList;
