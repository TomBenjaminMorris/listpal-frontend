import PulseLoader from "react-spinners/PulseLoader";
import { Link } from 'react-router-dom';
import { useEffect, useState, CSSProperties } from 'react';
import { getActiveTasks } from '../utils/apiGatewayClient';
import { isTokenExpired } from '../utils/utils';
import './Board.css'
import CardList from './CardList';

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const Board = ({ activeBoard, activeTasks, setActiveTasks }) => {
  // console.log("rendering: Board")
  const [isLoading, setIsLoading] = useState(true);
  const [sortedTasks, setSortedTasks] = useState({});

  const handleGetActiveTasks = async (boardID) => {
    console.log("TTT triggered: handleGetActiveTasks")
    const data = await getActiveTasks(boardID);
    setActiveTasks(data);
    return data;
  }

  const sortTasks = (data) => {
    let sortedData = {}
    data.forEach((item) => {
      if (!sortedData[item.Category]) {
        sortedData[item.Category] = [item];
      } else {
        sortedData[item.Category].push(item);
      }
    })
    setSortedTasks(sortedData);
  }

  useEffect(() => {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    if (!isTokenExpired()) {
      if ( activeTasks.length === 0 || activeTasks[0]["GSI1-PK"] !== boardID ) {
        handleGetActiveTasks(boardID).then((data) => {
          setIsLoading(false);
          sortTasks(data);
        });
      } else {
        setIsLoading(false);
        sortTasks(activeTasks);
      }
    } else {
      console.log("TTT Board load: token is exipred...");
    }
  }, [])

  return (
    <div className="wrapper">
      <div className="header">
        <div className="header-left">
          <Link to="/home" >{activeBoard ? "Home | " + activeBoard : "Home"}</Link>
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
            <CardList activeTasks={activeTasks} sortedTasks={sortedTasks} setActiveTasks={setActiveTasks}></CardList>
        }
      </div>
    </div >
  );
};

export default Board;
