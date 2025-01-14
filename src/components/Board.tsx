import { useNavigate } from 'react-router-dom';
import { useEffect, useState, CSSProperties, useRef } from 'react';
import { deleteBoard, getActiveTasks, renameBoardAPI, deleteTasks, updateBoardEmojiAPI } from '../utils/apiGatewayClient';
import { useOnClickOutside } from 'usehooks-ts'
import { getBoardIdFromUrl } from '../utils/utils';
import deleteIcon from '../assets/icons8-delete-48.png';
import editIcon from '../assets/icons8-edit-64.png';
import targetIcon from '../assets/icons8-bullseye-50.png';
import clearIcon from '../assets/icons8-clear-60.png';
import PulseLoader from "react-spinners/PulseLoader";
import CardList from './CardList';
import ScoreBoard from './ScoreBoard';
import TargetSetterModal from './TargetSetterModal';
import Loader from './Loader';
import Select, { MultiValue } from "react-select";
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import './Board.css';

// const override: CSSProperties = {
//   opacity: "0.8",
// };

// const customStyles = {
//   option: (defaultStyles, state) => ({
//     color: "var(--text-colour)",
//     padding: "10px",
//     borderRadius: "10px",
//     ':hover': {
//       backgroundColor: "var(--accent)"
//     },
//   }),
//   multiValue: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//     backgroundColor: "var(--accent)",
//     borderRadius: "10px",
//     marginTop: "5px",
//     marginBottom: "5px",
//     padding: "5px",
//     marginRight: "10px",
//   }),
//   multiValueLabel: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//   }),
//   placeholder: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//     fontFamily: "CircularBook",
//     fontSize: "20px",
//     marginLeft: "5px",
//     opacity: "0.6",
//   }),
//   multiValueRemove: (defaultStyles, state) => ({
//     ...defaultStyles,
//   }),
//   clearIndicator: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//     padding: "5px",
//     marginRight: "10px",
//     borderRadius: "10px",
//     backgroundColor: "var(--background)",
//   }),
//   dropdownIndicator: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//     padding: "5px",
//     marginRight: "10px",
//     borderRadius: "10px",
//     // display: "none",
//     backgroundColor: "var(--background)",
//   }),
//   container: (defaultStyles, state) => ({
//     ...defaultStyles,
//     border: "none",
//   }),
//   input: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//   }),
//   indicatorSeparator: (defaultStyles, state) => ({
//     display: "none",
//   }),
//   menu: (defaultStyles, state) => ({
//     ...defaultStyles,
//     backgroundColor: "var(--background)",
//     borderRadius: "10px",
//     fontSize: "20px",
//     padding: "20px",
//     boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px;",
//   }),
//   menuList: (defaultStyles, state) => ({
//     ...defaultStyles,
//     backgroundColor: "var(--background)",
//   }),
//   control: (defaultStyles, state) => ({
//     backgroundColor: "var(--foreground)",
//     padding: "3px",
//     borderRadius: "10px",
//     fontFamily: "CircularBold",
//     fontSize: "20px",
//     label: "control",
//     display: "flex",
//     transition: "all 100ms",
//     border: "none",
//     boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px;"
//   }),
//   noOptionsMessage: (defaultStyles, state) => ({
//     ...defaultStyles,
//     color: "var(--text-colour)",
//     borderRadius: "10px",
//     fontFamily: "CircularBold",
//     fontSize: "20px",
//   }),
// };

const Board = ({ sortedTasks, setSortedTasks, setBoards, sidebarIsOpen, boards, isLoading, setIsLoading, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [filteredSortedTasks, setFilteredSortedTasks] = useState({});
  const [categories, setCategories] = useState([{ label: null, value: null }]);
  const [selectedCategories, setSelectedCategories] = useState<MultiValue<{ value: string; label: string; }> | null>(null);
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [displayTargetSetter, setDisplayTargetSetter] = useState(false);
  const [boardEmoji, setBoardEmoji] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("Delete Board?");
  const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
  const boardName = ls_currentBoard && ls_currentBoard.Board
  const navigate = useNavigate();
  const boardID = getBoardIdFromUrl()
  const emojiMenuRef = useRef(null)

  const handleEditBoard = async (name) => {
    if (!name) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "Board name can't be empty...",
      });
      return;
    }
    setIsLoading(true);

    try {
      await renameBoardAPI(boardID, name);
      let ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard')) || {};
      ls_currentBoard['Board'] = name;
      localStorage.setItem('activeBoard', JSON.stringify(ls_currentBoard));
      document.title = `ListPal${ls_currentBoard.Board ? ' | ' + ls_currentBoard.Board + ' ' + ls_currentBoard.Emoji : ''}`;
      setBoards(current => {
        return current.map(b => b.SK === boardID ? { ...b, Board: name } : b);
      });

    } catch (error) {
      setAlertConf({
        display: true,
        title: "Error 💀",
        textValue: error.message || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBoard = async () => {
    setIsLoading(true);
    try {
      await deleteBoard(boardID);
      localStorage.removeItem('activeBoard');
      setBoards((boards) => boards.filter(b => b.SK !== boardID));
      navigate('/home');
    } catch (error) {
      setAlertConf({
        display: true,
        title: "Error 💀",
        textValue: error.message || "Something went wrong while deleting the board.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTasks = async () => {
    const tasksToDelete = [];
    // Loop through categories and filter tasks
    for (const category in sortedTasks) {
      const incompleteTasks = [];
      for (const task of sortedTasks[category]) {
        if (task.CompletedDate !== 'nil') {
          tasksToDelete.push(task); // Collect tasks to delete
        } else {
          incompleteTasks.push(task); // Keep incomplete tasks
        }
      }
      // Update category with only incomplete tasks
      sortedTasks[category] = incompleteTasks;
    }
    // Update the state with the modified tasks
    setSortedTasks({ ...sortedTasks });
    // Call deleteTasks and await its completion
    try {
      await deleteTasks(tasksToDelete);
    } catch (error) {
      // Optionally, handle any errors during deletion
      setAlertConf({
        display: true,
        title: "Error 💀",
        textValue: error.message || "Something went wrong while clearing tasks.",
      });
    }
  };

  const sortTasks = (data) => {
    if (!data || data.length === 0) {
      setSortedTasks({});
      return;
    }
    const sortedData = data.reduce((acc, item) => {
      if (!acc[item.Category]) {
        acc[item.Category] = [item];
      } else {
        acc[item.Category].push(item);
      }
      return acc;
    }, {});
    setSortedTasks(sortedData);
    setIsLoading(false);
  };

  const getTasks = async () => {
    const firstKey = Object.keys(filteredSortedTasks)[0];
    const currentBoardID = firstKey && filteredSortedTasks[firstKey]?.[0]?.['GSI1-PK'];

    // If no tasks are filtered or the current board ID doesn't match, fetch tasks
    if (!filteredSortedTasks || Object.keys(filteredSortedTasks).length === 0 || currentBoardID !== boardID) {
      setIsLoading(true);
      try {
        const data = await getActiveTasks(boardID);
        sortTasks(data);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        setIsLoading(false);
        setAlertConf({
          display: true,
          title: "Error 💀",
          textValue: error.message || "Failed to fetch tasks.",
        });
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = (e) => {
    const selectedEmoji = e.native;
    setBoardEmoji(selectedEmoji);
    updateBoardEmojiAPI(boardID, selectedEmoji);
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'));
    ls_currentBoard['Emoji'] = selectedEmoji;
    localStorage.setItem('activeBoard', JSON.stringify(ls_currentBoard));
    document.title = `ListPal${ls_currentBoard ? ' | ' + ls_currentBoard.Board + ' ' + ls_currentBoard.Emoji : ''}`;
    setBoards(current =>
      current.map(b =>
        b.SK === boardID ? { ...b, Emoji: selectedEmoji } : b
      )
    );
  };

  const loadEmoji = () => {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'));
    if (ls_currentBoard?.Emoji) {
      setBoardEmoji(ls_currentBoard.Emoji);
    } else {
      const board = boards.find(b => b.SK === boardID);
      board && setBoardEmoji(board.Emoji);
    }
  };

  useEffect(() => {
    loadEmoji();
  }, [boards]);

  useEffect(() => {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'));
    if (ls_currentBoard) {
      document.title = `ListPal | ${ls_currentBoard.Board} ${ls_currentBoard.Emoji}`;
      setDeleteMessage(`Delete Board - "${ls_currentBoard.Board}" ?`);
    } else {
      document.title = "ListPal";
      setDeleteMessage("Delete Board?");
    }
    loadEmoji();
    getTasks();
  }, [boardID]);

  useEffect(() => {
    // Filter tasks based on selected categories or reset to all tasks
    if (!selectedCategories || selectedCategories.length === 0) {
      setFilteredSortedTasks(sortedTasks);
    } else {
      const selectedCategoryLabels = selectedCategories.map(c => c.label);
      const filteredTasks = Object.keys(sortedTasks).reduce((acc, category) => {
        if (selectedCategoryLabels.includes(category)) {
          acc[category] = sortedTasks[category];
        }
        return acc;
      }, {});
      setFilteredSortedTasks(filteredTasks);
    }
  }, [selectedCategories, sortedTasks]);

  useEffect(() => {
    // Set categories based on the sorted tasks
    const categories = Object.keys(sortedTasks).map(t => ({ label: t, value: t.toLowerCase() }));
    setCategories(categories);
  }, [sortedTasks]);

  const handleClickOutside = () => {
    if (displayEmojiPicker) {
      setDisplayEmojiPicker(false)
    }
  }
  useOnClickOutside(emojiMenuRef, handleClickOutside)

  // const loader = (
  //   <div className="loadingWrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}` }}>
  //     <PulseLoader
  //       cssOverride={override}
  //       size={12}
  //       color={"var(--text-colour)"}
  //       speedMultiplier={1}
  //       aria-label="Loading Spinner"
  //       data-testid="loader"
  //     />
  //   </div>
  // )

  return (
    <div className="wrapper">

      <TargetSetterModal
        display={displayTargetSetter}
        setDisplay={setDisplayTargetSetter}
        boardID={boardID}
        boards={boards}
        setBoards={setBoards}
        setAlertConf={setAlertConf}
      />

      <div className="board-content-wrapper">
        {
          isLoading ? <Loader sidebarIsOpen={sidebarIsOpen}/> : <div className={`flex-container ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
            <div className="board-filter-actions-wrapper fadeUp-animation">

              {/* <Select isMulti name="categories" options={categories} className="basic-multi-select" noOptionsMessage={({ inputValue }) => `No category for "${inputValue}"`} styles={customStyles} onChange={setSelectedCategories} placeholder="Filter Categories..." autoFocus menuShouldBlockScroll /> */}

              <div className="board-name-wrapper">
                <div className="board-name board-actions-wrapper">
                  {boardName}
                </div>
                <div className={`board-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : null}`} ref={emojiMenuRef}>
                  <div className="emoji-icon" onClick={() => setDisplayEmojiPicker(current => !current)}>{boardEmoji}</div>
                  {
                    displayEmojiPicker ? <div className="board-emoji-wrapper">
                      <Picker
                        data={emojiData}
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                        autoFocus
                        navPosition="none"
                        previewPosition="none"
                        perLine={8}
                      />
                    </div> : null
                  }
                </div>
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
                <img className="clear-icon" src={targetIcon} alt="target icon" onClick={() => setDisplayTargetSetter(true)} />
              </div>

              <ScoreBoard boards={boards} setBoards={setBoards} boardID={boardID} setAlertConf={setAlertConf} />

            </div>
            {
              !sortedTasks || Object.keys(sortedTasks).length === 0 ? (
                <div className="fadeUp-animation" style={{ fontSize: "20px", marginTop: "40px", marginBottom: "30px", }}>
                  Create a category to get going...
                </div>
              ) : null
            }
            <CardList
              sortedTasks={sortedTasks}
              filteredSortedTasks={filteredSortedTasks}
              setSortedTasks={setSortedTasks}
              setBoards={setBoards}
              boards={boards}
              setPromptConf={setPromptConf}
              setConfirmConf={setConfirmConf}
              setAlertConf={setAlertConf}
            />
          </div>
        }
      </div>
    </div >
  );
};

export default Board;
