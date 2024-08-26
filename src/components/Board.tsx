import { Link } from 'react-router-dom';
import { useEffect, useState, CSSProperties } from 'react';
import { getActiveTasks } from '../utils/apiGatewayClient';
import { isTokenExpired } from '../utils/utils';
import backIcon from '../assets/icons8-back-50-white.png';
import editIcon from '../assets/icons8-edit-64.png';
import PulseLoader from "react-spinners/PulseLoader";
import CardList from './CardList';
import ScoreBoard from './ScoreBoard';
import './Board.css';

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const Board = ({ sortedTasks, setSortedTasks, userDetails, setUserDetails, setBoards }) => {
  // console.log("rendering: Board")
  const [isLoading, setIsLoading] = useState(true);
  const [currentBoard, setCurrentBoard] = useState({});

  const handleGetActiveTasks = async (boardID) => {
    console.log("TTT triggered: handleGetActiveTasks")
    const data = await getActiveTasks(boardID);
    sortTasks(data);
    setIsLoading(false);
  }

  const handleEditBoard = async () => {
    console.log("TTT triggered: handleEditBoard")
    const boardName = prompt("Enter new name")
    if (boardName == "") {
      alert("Board name can't be empty");
      return;
    }
    if (!boardName) {
      return;
    }
    const url = window.location.href;
    const boardID = url.split('/').pop();
    setBoards(current => {
      let tmpBoards = [...current];

      setCurrentBoard(cb => {
        let tmpCB = { ...cb }
        tmpCB['Board'] = boardName;
        localStorage.setItem('activeBoard', JSON.stringify(tmpCB));
        return tmpCB
      })

      if (tmpBoards.length != 0) {
        return tmpBoards.map(b => {
          if (b.SK == boardID) {
            let tmpB = b
            tmpB['Board'] = boardName;
            return tmpB
          }
          return b
        })
      }
    })
  }

  const sortTasks = (data) => {
    console.log("TTT triggered: sortTasks")
    let sortedData = {}
    data && data.forEach((item) => {
      if (!sortedData[item.Category]) {
        sortedData[item.Category] = [item];
      } else {
        sortedData[item.Category].push(item);
      }
    })
    setSortedTasks(sortedData);
  }

  useEffect(() => {
    setCurrentBoard(JSON.parse(localStorage.getItem('activeBoard')));
    if (!isTokenExpired()) {
      const url = window.location.href;
      const boardID = url.split('/').pop();
      var firstKey = Object.keys(sortedTasks)[0];
      const currentBoardID = sortedTasks[firstKey] && sortedTasks[firstKey][0]['GSI1-PK'];
      console.log()
      if (Object.keys(sortedTasks).length === 0 || currentBoardID !== boardID) {
        handleGetActiveTasks(boardID);
      } else {
        setIsLoading(false);
      }
    } else {
      console.log("TTT Board load: token is exipred...");
    }
  }, [])

  return (
    <div className="wrapper">
      <div className="header">
        <div className="header-left">
          <Link className="back-button" to="/home" >
            <img className="back-icon" src={backIcon} alt="back icon" />
            {currentBoard ? <div>{currentBoard.Board}</div> : <div>Back</div>}
          </Link>
        </div>
        <div className="header-right">
          <img className="edit-icon" src={editIcon} alt="edit icon" onClick={handleEditBoard} />
          <ScoreBoard userDetails={userDetails} />
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
            <CardList sortedTasks={sortedTasks} setSortedTasks={setSortedTasks} setUserDetails={setUserDetails}></CardList>
        }
      </div>
    </div >
  );
};

export default Board;
