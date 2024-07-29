import { Link } from 'react-router-dom';
import './Boards.css'

// HomePage
const Boards = ({boards}) => {
  console.log("rendering: Boards")

  /*eslint-enable*/
  return (
      <div className="flex-container">
        {boards.map((b) => {
          return (
            <Link key={b.SK} className="boardLink" to={"/board/"+b.SK}>{b.Board}</Link>
          )
        })}
      </div>
  );
};

export default Boards;
