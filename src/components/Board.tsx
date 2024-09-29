import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, CSSProperties } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI } from '../utils/apiGatewayClient';
import deleteIcon from '../assets/icons8-delete-48.png';
import lineIcon from '../assets/icons8-line-50.png';
import editIcon from '../assets/icons8-edit-64.png';
import menuIcon from '../assets/icons8-menu-50.png';
import PulseLoader from "react-spinners/PulseLoader";
import CardList from './CardList';
import ScoreBoard from './ScoreBoard';
import SideNavBar from './SideNavBar';
import Select, { MultiValue } from "react-select";
import './Board.css';
import { BarLoader } from 'react-spinners';

const override: CSSProperties = {
  opacity: "0.8",
};

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' }
]

const Board = ({ handleLogout, sortedTasks, setSortedTasks, userDetails, setUserDetails, setBoards, handleSidebarCollapse, sidebarIsOpen, boards, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isLoading, hideMobileSidebar, isMobile, setSidebarIsOpen, setHideMobileSidebar }) => {
  // console.log("rendering: Board")
  const [localSortedTasks, setLocalSortedTasks] = useState({});
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [categories, setCategories] = useState([{ label: null, value: null }]);
  const [selectedCategories, setSelectedCategories] = useState<MultiValue<{
    value: string;
    label: string;
  }> | null>(null);
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
        document.title = "ListPal" + (ls_currentBoard && " | " + ls_currentBoard.Board);

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

  const handleMenuClick = async () => {
    setHideMobileSidebar(current => !current);
    setSidebarIsOpen(current => !current);
  }

  const getTasks = async () => {
    var firstKey = Object.keys(localSortedTasks)[0];
    const currentBoardID = localSortedTasks[firstKey] && localSortedTasks[firstKey][0]['GSI1-PK'];
    if (Object.keys(localSortedTasks).length === 0 || currentBoardID !== boardID) {
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
    ls_currentBoard ? document.title = "ListPal" + (ls_currentBoard && " | " + ls_currentBoard.Board) : null;
    getTasks()
  }, [boardID])

  useEffect(() => {
    if ((selectedCategories && selectedCategories.length == 0) || selectedCategories == null) {
      setLocalSortedTasks(sortedTasks)
    } else {
      const tmpCat = selectedCategories && selectedCategories.map((c) => {
        return c.label
      })
      const tmp = {}
      Object.keys(sortedTasks).forEach((t) => {
        tmpCat && tmpCat.includes(t) ? tmp[t] = sortedTasks[t] : null
      })
      setLocalSortedTasks(tmp)
    }
  }, [selectedCategories, sortedTasks])

  useEffect(() => {
    const tmpCategories = Object.keys(sortedTasks).map((t) => {
      return { label: t, value: t.toLowerCase() }
    });
    setCategories(tmpCategories)
  }, [sortedTasks])

  const customStyles = {
    option: (defaultStyles, state) => ({
      color: "var(--text-colour)",
      padding: "10px",
      borderRadius: "10px",
      ':hover': {
        backgroundColor: "var(--accent)"
      },
    }),
    multiValue: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
      backgroundColor: "var(--accent)",
      borderRadius: "10px",
      marginTop: "5px",
      marginBottom: "5px",
      padding: "5px",
      marginRight: "10px",
    }),
    multiValueLabel: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
    }),
    placeholder: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
      fontFamily: "CircularBook",
      fontSize: "20px",
      marginLeft: "5px",
      opacity: "0.6",
    }),
    multiValueRemove: (defaultStyles, state) => ({
      ...defaultStyles,
    }),
    clearIndicator: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
      padding: "5px",
      marginRight: "10px",
      borderRadius: "10px",
      backgroundColor: "var(--background)",
    }),
    dropdownIndicator: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
      padding: "5px",
      borderRadius: "10px",
      display: "none",
      backgroundColor: "var(--background)",
    }),
    container: (defaultStyles, state) => ({
      ...defaultStyles,
      border: "none",
    }),
    input: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
    }),
    indicatorSeparator: (defaultStyles, state) => ({
      display: "none",
    }),
    menu: (defaultStyles, state) => ({
      ...defaultStyles,
      backgroundColor: "var(--background)",
      fontSize: "20px",
      padding: "20px",
      boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px;"
    }),
    menuList: (defaultStyles, state) => ({
      ...defaultStyles,
      backgroundColor: "var(--background)",
    }),
    control: (defaultStyles, state) => ({
      backgroundColor: "var(--foreground)",
      padding: "3px",
      borderRadius: "10px",
      fontFamily: "CircularBold",
      fontSize: "20px",
      label: "control",
      display: "flex",
      transition: "all 100ms",
      border: "none",
      boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px;"
    }),
    noOptionsMessage: (defaultStyles, state) => ({
      ...defaultStyles,
      color: "var(--text-colour)",
      borderRadius: "10px",
      fontFamily: "CircularBold",
      fontSize: "20px",
    }),
  };

  const content = (
    <>
      <div className="header sticky">
        <div className="header-left">
          <Link className="back-button board-back-button listpal-board-logo " to="/home" >
            <div className="logo-text-wrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}`, marginTop: "15px" }}>
              <div className="logo-text-1">List</div><div className="logo-text-2">Pal</div>
            </div>
          </Link>
          {isMobile && <div className="toggle-wrapper">
            <img className="menu-icon-mobile" src={menuIcon} alt="menu icon" onClick={handleMenuClick} />
          </div>}
        </div>
        <div className="header-right">
          {(Object.keys(userDetails).length !== 0 && userDetails.constructor === Object) && <ScoreBoard userDetails={userDetails} setUserDetails={setUserDetails} />}
          <img className="line-icon" src={lineIcon} />
          <img className="delete-icon" src={deleteIcon} alt="delete icon" onClick={handleDeleteBoard} />
          <img className="edit-icon" src={editIcon} alt="edit icon" onClick={handleEditBoard} />
        </div>
      </div>

      <div className="board-content-wrapper">
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} />

        <div className="flex-container" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
          <Select
            isMulti
            name="categories"
            options={categories}
            className="basic-multi-select"
            noOptionsMessage={({ inputValue }) => `No category for "${inputValue}"`}
            styles={customStyles}
            onChange={setSelectedCategories}
            placeholder="Filter Categories..."
          />
          <CardList sortedTasks={localSortedTasks} setSortedTasks={setSortedTasks} setUserDetails={setUserDetails}></CardList>
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
