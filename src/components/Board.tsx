import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getActiveTasks } from '../utils/apiGatewayClient';
import './Board.css'

// Board
const Board = () => {
  console.log("rendering: Board")
  const [activeTasks, setActiveTasks] = useState([]);

  const handleGetActiveTasks = async (boardID) => {
    console.log("TTT triggered: handleGetActiveTasks")
    const data = await getActiveTasks(boardID);
    setActiveTasks(data);
  }

  useEffect(() => {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    handleGetActiveTasks(boardID);
  }, [])

  /*eslint-enable*/
  return (
    <div className="wrapper">
      <div className="header">
        <div className="header-left">
          <Link to="/home" >{"Back"}</Link>
        </div>
      </div>
      <div className="flex-container">
        {activeTasks.map((t) => {
          return (
            <div key={t.SK} className="task">{t.Description}</div>
          )
        })}
      </div>
    </div >
  );
};

export default Board;
