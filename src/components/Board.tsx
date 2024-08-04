import PulseLoader from "react-spinners/PulseLoader";
import { Link } from 'react-router-dom';
import { useEffect, useState, CSSProperties } from 'react';
import { getActiveTasks } from '../utils/apiGatewayClient';
import './Board.css'

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

// Board
const Board = ({ activeTasks, setActiveTasks }) => {
  console.log("rendering: Board")
  const [isLoading, setIsLoading] = useState(true);

  const handleGetActiveTasks = async (boardID) => {
    console.log("TTT triggered: handleGetActiveTasks")
    const data = await getActiveTasks(boardID);
    setActiveTasks(data);
  }

  useEffect(() => {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    if (activeTasks.length === 0 || activeTasks[0]["GSI1-PK"] !== boardID) {
      handleGetActiveTasks(boardID).then(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
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
        {
          isLoading ? <PulseLoader
            cssOverride={override}
            size={10}
            color={"#fff"}
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
          /> : 
          activeTasks.map((t) => {
            return (
              <div key={t.SK} className="task">{t.Description}</div>
            )
          })
        }
      </div>
    </div >
  );
};

export default Board;
