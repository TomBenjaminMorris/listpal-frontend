import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, CSSProperties } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI } from '../utils/apiGatewayClient';
import deleteIcon from '../assets/icons8-delete-48.png';
import lineIcon from '../assets/icons8-line-50.png';
import editIcon from '../assets/icons8-edit-64.png';
import PulseLoader from "react-spinners/PulseLoader";
import CardList from './CardList';
import ScoreBoard from './ScoreBoard';
import './Board.css';
import SideNavBar from './SideNavBar';

const override: CSSProperties = {
  opacity: "0.8",
};

const Board = ({ handleLogout, sortedTasks, setSortedTasks, userDetails, setUserDetails, setBoards, handleSidebarCollapse, sidebarIsOpen, boards, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isLoading }) => {
  // console.log("rendering: Board")
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const navigate = useNavigate();
  const url = window.location.href;
  const boardID = url.split('/').pop();

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
    setIsLoadingLocal(true);

    renameBoardAPI(boardID, boardName).then(() => {
      setBoards(current => {
        let ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
        ls_currentBoard['Board'] = boardName;
        localStorage.setItem('activeBoard', JSON.stringify(ls_currentBoard));
        document.title = "ListPal" + (ls_currentBoard.Board && " | " + ls_currentBoard.Board);

        let tmpBoards = [...current];
        if (tmpBoards.length != 0) {
          return tmpBoards.map(b => {
            if (b.SK == boardID) {
              let tmpB = b
              tmpB['Board'] = boardName;
              setIsLoadingLocal(false);
              return tmpB
            }
            setIsLoadingLocal(false);
            return b
          })
        }
      })
    }).catch((e) => {
      alert(e);
      setIsLoadingLocal(false);
    });
  }

  const handleDeleteBoard = async () => {
    if (!confirm("Delete board?")) {
      return
    }
    setIsLoadingLocal(true);
    deleteBoard(boardID).then(() => {
      setBoards((boards) => {
        return boards.filter(b => b.SK !== boardID);
      })
      navigate('/home');
    });
  }

  const sortTasks = (data) => {
    let sortedData = {}
    data && data.forEach((item) => {
      if (!sortedData[item.Category]) {
        sortedData[item.Category] = [item];
      } else {
        sortedData[item.Category].push(item);
      }
    })
    setSortedTasks(sortedData);
    setIsLoadingLocal(false);
  }

  const getTasks = async () => {
    var firstKey = Object.keys(sortedTasks)[0];
    const currentBoardID = sortedTasks[firstKey] && sortedTasks[firstKey][0]['GSI1-PK'];
    if (Object.keys(sortedTasks).length === 0 || currentBoardID !== boardID) {
      getActiveTasks(boardID).then((data) => {
        sortTasks(data);
      });
    }
    else {
      setIsLoadingLocal(false);
    }
  }

  useEffect(() => {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
    ls_currentBoard ? document.title = "ListPal" + (ls_currentBoard.Board && " | " + ls_currentBoard.Board) : null;
    getTasks();
  }, [boardID])

  const content = (
    <>
      <div className="header sticky">
        <div className="header-left">
          <Link className="back-button board-back-button " to="/home" >
            <div className="logo-text-wrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}` }}>
              <div className="logo-text-1">List</div><div className="logo-text-2">Pal</div>
            </div>
          </Link>
        </div>
        <div className="header-right">
          {(Object.keys(userDetails).length !== 0 && userDetails.constructor === Object) && <ScoreBoard userDetails={userDetails} />}
          <img className="line-icon" src={lineIcon} />
          <img className="delete-icon" src={deleteIcon} alt="delete icon" onClick={handleDeleteBoard} />
          <img className="edit-icon" src={editIcon} alt="edit icon" onClick={handleEditBoard} />
        </div>
      </div>

      <div className="board-content-wrapper">
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} />

        <div className="flex-container" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
          {/* <div className="board-filter-wrapper">All</div> */}
          <CardList sortedTasks={sortedTasks} setSortedTasks={setSortedTasks} setUserDetails={setUserDetails}></CardList>
        </div>
      </div>
    </>
  )

  return (
    <div className="wrapper">
      {isLoadingLocal || isLoading ? <div className="loadingWrapper"><PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      /></div> : content}
    </div >
  );
};

export default Board;
