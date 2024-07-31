import { Link } from 'react-router-dom';
import './BoardList.css'

// HomePage
const BoardList = ({ boards }) => {
  console.log("rendering: BoardList")

  /*eslint-enable*/
  return (
    <div className="flex-container">
      {boards.map((b) => {
        return (
          <Link key={b.SK} className="boardLink" to={"/board/" + b.SK}>{b.Board}</Link>
        )
      })}
    </div>
  );
};

export default BoardList;
