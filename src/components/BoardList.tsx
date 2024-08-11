import { Link } from 'react-router-dom';
import './BoardList.css'

const BoardList = ({ boards, setActiveBoard }) => {
  // console.log("rendering: BoardList")
  const boardsRendered = boards.map((b) => {
    return (
      <Link key={b.SK} className="boardLink" to={"/board/" + b.SK} onClick={() => setActiveBoard(b)}>{b.Board}</Link>
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
