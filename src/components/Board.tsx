import { useNavigate } from 'react-router-dom';
import { useEffect, useState, CSSProperties, useRef } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI, deleteTasks, updateBoardEmojiAPI } from '../utils/apiGatewayClient';
import { useOnClickOutside } from 'usehooks-ts'
import { getBoardIdFromUrl } from '../utils/utils';
import deleteIcon from '../assets/icons8-delete-48.png';
import editIcon from '../assets/icons8-edit-64.png';
import clearIcon from '../assets/icons8-clear-60.png';
import PulseLoader from "react-spinners/PulseLoader";
import CardList from './CardList';
import ScoreBoard from './ScoreBoard';
import SideNavBar from './SideNavBar';
import Header from './Header';
import Select, { MultiValue } from "react-select";
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import './Board.css';

const override: CSSProperties = {
  opacity: "0.8",
};

const Board = ({ handleLogout, sortedTasks, setSortedTasks, setBoards, handleSidebarCollapse, sidebarIsOpen, boards, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isLoading, setIsLoading, hideMobileSidebar, isMobile, setSidebarIsOpen, setHideMobileSidebar, setPromptConf, setConfirmConf }) => {
  // console.log("rendering: Board")
  const [filteredSortedTasks, setFilteredSortedTasks] = useState({});
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [categories, setCategories] = useState([{ label: null, value: null }]);
  const [selectedCategories, setSelectedCategories] = useState<MultiValue<{ value: string; label: string; }> | null>(null);
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [boardEmoji, setBoardEmoji] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("Delete Board?");

  const navigate = useNavigate();
  const boardID = getBoardIdFromUrl()

  let ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
  const boardName = ls_currentBoard && ls_currentBoard.Board

  const handleEditBoard = async (name) => {
    if (name == "") {
      alert("Board name can't be empty");
      return;
    }
    if (!name) {
      return;
    }
    setIsLoadingLocal(true);
    renameBoardAPI(boardID, name).then(() => {
      setBoards(current => {
        let ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
        ls_currentBoard['Board'] = name;
        localStorage.setItem('activeBoard', JSON.stringify(ls_currentBoard));
        document.title = "ListPal" + (ls_currentBoard && " | " + ls_currentBoard.Board + " " + ls_currentBoard.Emoji);

        let tmpBoards = [...current];
        if (tmpBoards.length != 0) {
          return tmpBoards.map(b => {
            if (b.SK == boardID) {
              let tmpB = b
              tmpB['Board'] = name;
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
    setIsLoadingLocal(true);
    deleteBoard(boardID).then(() => {
      localStorage.removeItem('activeBoard');
      setBoards((boards) => {
        return boards.filter(b => b.SK !== boardID);
      })
      navigate('/home');
    });
  }

  const handleClearTasks = async () => {
    const tmpSortedTasks = { ...sortedTasks };
    const tasksToDelete = [];
    for (const category in tmpSortedTasks) {
      tasksToDelete.push(...tmpSortedTasks[category].filter((t) => t.CompletedDate != 'nil'));
      tmpSortedTasks[category] = tmpSortedTasks[category].filter((t) => t.CompletedDate == 'nil')
    }
    setSortedTasks(tmpSortedTasks);
    deleteTasks(tasksToDelete)
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

  // const handleMenuClick = async () => {
  //   setHideMobileSidebar(current => !current);
  //   setSidebarIsOpen(current => !current);
  // }

  const getTasks = async () => {
    var firstKey = Object.keys(filteredSortedTasks)[0];
    const currentBoardID = filteredSortedTasks[firstKey] && filteredSortedTasks[firstKey][0]['GSI1-PK'];
    if (Object.keys(filteredSortedTasks).length === 0 || currentBoardID !== boardID) {
      getActiveTasks(boardID).then((data) => {
        sortTasks(data);
        setIsLoading(false)
      });
    }
    else {
      setIsLoadingLocal(false)
    }
  }

  const handleEmojiSelect = (e) => {
    setBoardEmoji(e.native)
    updateBoardEmojiAPI(boardID, e.native)
    setBoards(current => {
      let ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
      ls_currentBoard['Emoji'] = e.native;
      localStorage.setItem('activeBoard', JSON.stringify(ls_currentBoard));
      document.title = "ListPal" + (ls_currentBoard && " | " + ls_currentBoard.Board + " " + ls_currentBoard.Emoji);

      let tmpBoards = [...current];
      if (tmpBoards.length != 0) {
        return tmpBoards.map(b => {
          if (b.SK == boardID) {
            let tmpB = b
            tmpB['Emoji'] = e.native;
            return tmpB
          }
          return b
        })
      }
    })
  }

  const loadEmoji = () => {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
    if (ls_currentBoard && ls_currentBoard.Emoji) {
      setBoardEmoji(ls_currentBoard.Emoji)
    } else {
      boards.forEach(b => {
        if (b.SK === boardID) {
          setBoardEmoji(b.Emoji)
        }
      });
    }
  }

  useEffect(() => {
    loadEmoji()
  }, [boards])

  useEffect(() => {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
    ls_currentBoard ? document.title = "ListPal" + (ls_currentBoard && " | " + ls_currentBoard.Board + " " + ls_currentBoard.Emoji) : null;
    let message = '';
    ls_currentBoard ? message = `Delete Board - "${ls_currentBoard.Board}" ?` : "Delete Board?";
    setDeleteMessage(message);
    loadEmoji()
    getTasks()
  }, [boardID])

  useEffect(() => {
    if ((selectedCategories && selectedCategories.length == 0) || selectedCategories == null) {
      setFilteredSortedTasks(sortedTasks)
    } else {
      const tmpCat = selectedCategories && selectedCategories.map((c) => {
        return c.label
      })
      const tmp = {}
      Object.keys(sortedTasks).forEach((t) => {
        tmpCat && tmpCat.includes(t) ? tmp[t] = sortedTasks[t] : null
      })
      setFilteredSortedTasks(tmp)
    }
  }, [selectedCategories, sortedTasks])

  useEffect(() => {
    const tmpCategories = Object.keys(sortedTasks).map((t) => {
      return { label: t, value: t.toLowerCase() }
    });
    setCategories(tmpCategories)
  }, [sortedTasks])

  const emojiMenuRef = useRef(null)
  const handleClickOutside = () => {
    if (displayEmojiPicker) {
      setDisplayEmojiPicker(false)
    }
  }
  useOnClickOutside(emojiMenuRef, handleClickOutside)

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
      marginRight: "10px",
      borderRadius: "10px",
      // display: "none",
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
      borderRadius: "10px",
      fontSize: "20px",
      padding: "20px",
      boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px;",
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

  const loader = (
    <div className="loadingWrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}` }}>
      <PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  )

  const content = (
    <>
      <span className="transparent_gradient"></span>
      <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} />
      <div className="board-content-wrapper">
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} setIsLoading={setIsLoading} />

        {isLoadingLocal || isLoading ? loader : <div className="flex-container" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
          <div className="board-filter-actions-wrapper fadeUp-animation">

            <Select isMulti name="categories" options={categories} className="basic-multi-select" noOptionsMessage={({ inputValue }) => `No category for "${inputValue}"`} styles={customStyles} onChange={setSelectedCategories} placeholder="Filter Categories..." autoFocus menuShouldBlockScroll />

            <div className={`board-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : null}`} ref={emojiMenuRef}>
              <div className="emoji-icon" onClick={() => setDisplayEmojiPicker(current => !current)}>{boardEmoji}</div>
              {displayEmojiPicker ? <div className="board-emoji-wrapper">
                <Picker data={emojiData} onEmojiSelect={handleEmojiSelect} theme="light" autoFocus navPosition="none" previewPosition="none" perLine={8} />
              </div> : null}
            </div>

            <div className="board-actions-wrapper">
              <img className="delete-icon" src={deleteIcon} alt="delete icon" onClick={() => setConfirmConf({
                display: true,
                title: deleteMessage,
                textValue: "🚨 This action can't be undone 🚨",
                callbackFunc: handleDeleteBoard,
              })} />
              <img className="edit-icon" src={editIcon} alt="edit icon" onClick={() => setPromptConf({
                display: true,
                isEdit: true,
                defaultText: boardName,
                title: "Enter New Board Name...",
                callbackFunc: handleEditBoard,
              })} />
              <img className="clear-icon" src={clearIcon} alt="clear icon" onClick={() => setConfirmConf({
                display: true,
                title: "Clear All Completed Tasks?",
                textValue: "✨ Time for a spring clean ✨",
                callbackFunc: handleClearTasks,
              })} />
            </div>

            <ScoreBoard boards={boards} setBoards={setBoards} boardID={boardID} />

          </div>
          {sortedTasks == undefined || sortedTasks == "" || Object.keys(sortedTasks).length == 0 ?
            <div style={{ fontSize: "20px", marginTop: "40px", marginBottom: "30px", }}>
              Create a category to get going...
            </div> : null}
          <CardList sortedTasks={sortedTasks} filteredSortedTasks={filteredSortedTasks} setSortedTasks={setSortedTasks} setBoards={setBoards} boards={boards} setPromptConf={setPromptConf} setConfirmConf={setConfirmConf}></CardList>
        </div>}
      </div>
    </>
  )

  return (
    <div className="wrapper">
      {content}
    </div >
  );
};

export default Board;
