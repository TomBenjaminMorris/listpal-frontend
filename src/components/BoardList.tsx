import { Link } from 'react-router-dom';
import './BoardList.css'

const BoardList = ({ boards, setActiveBoard }) => {
  // console.log("rendering: BoardList")

  return (
    <div className="flex-container">
      {boards.map((b) => {
        return (
          <Link key={b.SK} className="boardLink" to={"/board/" + b.SK} onClick={() => setActiveBoard(b.Board)}>{b.Board}</Link>
        )
      })}
    </div>
  );
};

export default BoardList;
