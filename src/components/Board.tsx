import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, CSSProperties } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI, getUser } from '../utils/apiGatewayClient';
import { isTokenExpired } from '../utils/utils';
import backIcon from '../assets/icons8-back-50-white.png';
import deleteIcon from '../assets/icons8-delete-48.png';
import lineIcon from '../assets/icons8-line-50.png';
import editIcon from '../assets/icons8-edit-64.png';
import PulseLoader from "react-spinners/PulseLoader";
import CardList from './CardList';
import ScoreBoard from './ScoreBoard';
import './Board.css';

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
  marginTop: "200px",
};

const Board = ({ sortedTasks, setSortedTasks, userDetails, setUserDetails, setBoards, handleRefreshTokens }) => {
  // console.log("rendering: Board")
  const [isLoading, setIsLoading] = useState(true);
  const [currentBoard, setCurrentBoard] = useState({});
  const navigate = useNavigate();

  const handleGetActiveTasks = async (boardID) => {
    // console.log("TTT triggered: handleGetActiveTasks")
    const data = await getActiveTasks(boardID);
    sortTasks(data);
    setIsLoading(false);
  }

  const handleEditBoard = async () => {
    // console.log("TTT triggered: handleEditBoard")
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
    renameBoardAPI(boardID, boardName).then(() => {
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
    }).catch((e) => {
      alert(e);
    });
  }

  const handleDeleteBoard = async () => {
    if (!confirm("Delete board?")) {
      return
    }
    const url = window.location.href;
    const boardID = url.split('/').pop();
    deleteBoard(boardID).then(() => {
      setBoards((boards) => {
        return boards.filter(b => b.SK !== boardID);
      })
      navigate('/home');
    });
  }

  const sortTasks = (data) => {
    // console.log("TTT triggered: sortTasks")
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

  const getTasks = () => {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    var firstKey = Object.keys(sortedTasks)[0];
    const currentBoardID = sortedTasks[firstKey] && sortedTasks[firstKey][0]['GSI1-PK'];
    if (Object.keys(sortedTasks).length === 0 || currentBoardID !== boardID) {
      handleGetActiveTasks(boardID);
    } else {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
    document.title = "ListPal" + (ls_currentBoard.Board && " | " + ls_currentBoard.Board);
    setCurrentBoard(ls_currentBoard);
    if (!isTokenExpired()) {
      getTasks();
      if (Object.keys(userDetails).length === 0 && userDetails.constructor === Object) {
        getUser().then((u) => {
          setUserDetails(u[0]);
        })
      }

    } else {
      setIsLoading(true);
      console.log("TTT Board load: token is exipred...");
      try {
        handleRefreshTokens().then((t) => {
          getTasks();
          getUser().then((u) => {
            setUserDetails(u[0]);
          })
        })
      }
      catch (err) {
        console.error(err);
      }
    }
  }, [])

  return (
    <div className="wrapper">
      <div className="header sticky">
        <div className="header-left">
          <Link className="back-button" to="/home" >
            <img className="back-icon" src={backIcon} alt="back icon" />
            {currentBoard ? <div>{currentBoard.Board}</div> : <div>Back</div>}
          </Link>
        </div>
        <div className="header-right">
          {/* <img className="line-icon" src={lineIcon} /> */}
          {(Object.keys(userDetails).length !== 0 && userDetails.constructor === Object) && <ScoreBoard userDetails={userDetails} />}
          <img className="line-icon" src={lineIcon} />
          <img className="delete-icon" src={deleteIcon} alt="delete icon" onClick={handleDeleteBoard} />
          <img className="edit-icon" src={editIcon} alt="edit icon" onClick={handleEditBoard} />
        </div>
      </div>
      <div className="flex-container">
        {
          isLoading ? <PulseLoader
            cssOverride={override}
            size={10}
            color={"var(--text-colour)"}
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
