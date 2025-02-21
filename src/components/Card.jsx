import { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { renameCategoryAPI, updateTaskEmojiAPI } from '../utils/apiGatewayClient';
import { writeDataToLocalDB, deleteTaskFromLocalDBWrapper } from '../utils/localDBHelpers';
import { useOnClickOutside } from 'usehooks-ts'
import { getSortArray, updateCategoryOrder } from '../utils/utils';
import addIcon from "../assets/icons8-plus-30.png";
import dotsIcon from "../assets/icons8-dots-50.png";
import DropdownMenu from "./DropdownMenu";
import PulseLoader from "react-spinners/PulseLoader";
import Task from './Task';
import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import './Card.css';

const loaderStyle = {
  marginLeft: "30px",
  marginTop: "6px",
  marginBottom: "19px",
  opacity: "0.8",
};

const Card = ({ localDB, title, tasks, setSortedTasks, sortedTasks, handleDeleteTask, setBoards, boards, setPromptConf, setConfirmConf, setAlertConf, setLocalSyncRequired }) => {
  const [titleEdited, setTitleEdited] = useState(title);
  const [orderedTasks, setOrderedTasks] = useState([]);
  const [loadingTask, setLoadingTask] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [titleHasChanged, setTitleHasChanged] = useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [displayEmojiPicker, setDisplayEmojiPicker] = useState(false);
  const [cardEmoji, setCardEmoji] = useState(tasks?.[0]?.Emoji || "✅");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const cardMenuRef = useRef(null);
  const cardTitleRef = useRef(null);
  const emojiMenuRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setIsFirstLoad(false)
    }, 1000);
  }, []);

  useEffect(() => {
    setOrderedTasks(sortList(tasks));
  }, [sortedTasks]);

  const sortList = list => {
    if (!list) return [];
    const [doneList, notDoneList] = list.reduce((acc, el) => {
      el.CompletedDate === "nil" ? acc[1].push(el) : acc[0].push(el);
      return acc;
    }, [[], []]);

    return [
      ...doneList.sort((a, b) => parseInt(a.ExpiryDate) - parseInt(b.ExpiryDate)),
      ...notDoneList.sort((a, b) => parseInt(a.CreatedDate) - parseInt(b.CreatedDate))
    ];
  };

  const handleDeleteCategory = () => {
    // Remove from local DB, as appropriate
    sortedTasks[title]?.forEach(t => {
      // Check if the task has been created since the last sync and update accordingly
      deleteTaskFromLocalDBWrapper(localDB, t.SK)
    });
    setLocalSyncRequired(true);
    // Update the state to reflect the deleted category
    const newSortedTasks = { ...sortedTasks };
    delete newSortedTasks[title];
    setSortedTasks(newSortedTasks);
    const sortArr = getSortArray(boards);
    const index = sortArr.indexOf(title);
    if (index !== -1) {
      sortArr.splice(index, 1);
      updateCategoryOrder(sortArr, boards, setBoards);
    }
  }

  const renameCategory = newTitle => {
    // Perform validations on the new title name
    if (!newTitle) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "Category name can't be empty...",
      });
      setTitleEdited(title);
      return;
    }

    if (sortedTasks[newTitle]) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "That category already exists on this board, chose another...",
      });
      setTitleEdited(title);
      return;
    }

    const taskIDs = [];
    const updatedTasks = sortedTasks[title].map(t => {
      if (t.Category === title) {
        t.Category = newTitle;
        taskIDs.push(t.SK);
      }
      return t;
    });

    const tmpSortedTasks = { ...sortedTasks }
    tmpSortedTasks[newTitle] = updatedTasks
    delete tmpSortedTasks[title];
    renameCategoryAPI(taskIDs, newTitle).then(() => {
      setSortedTasks(tmpSortedTasks);
    });

    let sortArr = getSortArray(boards)
    var index = sortArr.indexOf(title);
    if (index !== -1) {
      sortArr[index] = newTitle
    }
    updateCategoryOrder(sortArr, boards, setBoards)
  };

  const handleNewTask = async (incomingTasks) => {
    setLoadingTask(true);
    const boardID = window.location.href.split('/').pop();

    const newTaskData = {
      Action: "create",
      CreatedDate: String(Date.now()),
      SK: "t#" + uuidv4(),
      PK: "",
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
      ExpiryDate: "nil",
      Description: "",
      CompletedDate: "nil",
      Category: title,
      EntityType: "Task",
      Emoji: cardEmoji,
      Link: "",
      Important: "false",
      ExpiryDateTTL: 0
    };

    // newTask
    writeDataToLocalDB(localDB, "tasks", newTaskData).then(() => {
      setLocalSyncRequired(true)
    })

    const tmpTasks = incomingTasks || { ...sortedTasks };
    tmpTasks[title] = tmpTasks[title] || [];
    tmpTasks[title].unshift(newTaskData);
    setSortedTasks(tmpTasks);
    setOrderedTasks(prev => [...prev, newTaskData]);
    setLoadingTask(false);
  };

  const handleEmojiSelect = (e) => {
    const newEmoji = e.native;
    setCardEmoji(newEmoji)
    const updatedCategoryArray = sortedTasks[title].map(t => ({ ...t, Emoji: newEmoji }));
    const tmpSortedTasks = { ...sortedTasks }
    tmpSortedTasks[title] = updatedCategoryArray
    updateTaskEmojiAPI(tasks.map(t => t.SK), newEmoji).then(() => {
      setSortedTasks(tmpSortedTasks);
    });
  }

  const handleCardTitleEdit = (e) => {
    const newTitle = e.target.value
    setTitleHasChanged(true);
    setTitleEdited(newTitle);
  }

  const measuredRef = useCallback(node => {
    if (!node) return;
    new ResizeObserver(() => forceUpdate()).observe(node);
  }, []);

  useOnClickOutside(cardMenuRef, () => isDropdownVisible && setDropdownVisible(false));
  useOnClickOutside(cardTitleRef, () => {
    if (titleHasChanged) {
      renameCategory(titleEdited);
      setTitleHasChanged(false);
    }
  });
  useOnClickOutside(emojiMenuRef, () => displayEmojiPicker && setDisplayEmojiPicker(false));

  return (
    <div ref={measuredRef} className={`card-container ${isFirstLoad ? "fadeUp-animation" : ""}`}>
      <div className="headingWrapper">
        <div className={`card-emoji-picker-wrapper ${displayEmojiPicker ? "emoji-highlight" : ""}`} ref={emojiMenuRef}>
          <div className="card-emoji-icon" onClick={() => setDisplayEmojiPicker(prev => !prev)}>
            {cardEmoji}
          </div>
          {displayEmojiPicker && (
            <div className="board-emoji-wrapper">
              <Picker data={emojiData} onEmojiSelect={handleEmojiSelect} theme="light" autoFocus navPosition="none" previewPosition="none" perLine={8} />
            </div>
          )}
        </div>

        <input className="edit-title-input" type="text" value={titleEdited} onChange={handleCardTitleEdit} ref={cardTitleRef} />

        <div className="menu" onClick={() => setDropdownVisible(prev => !prev)} ref={cardMenuRef}>
          <img className={`rotate card-menu-dots ${isDropdownVisible ? "card-menu-dots-bg-fill" : ""}`} src={dotsIcon} alt="menu icon" />
          {isDropdownVisible && (
            <DropdownMenu
              handleDeleteCategory={handleDeleteCategory}
              boards={boards}
              title={title}
              sortedTasks={sortedTasks}
              setSortedTasks={setSortedTasks}
              setBoards={setBoards}
              setConfirmConf={setConfirmConf}
            />
          )}
        </div>
      </div>

      <hr />

      {orderedTasks.map(task => (
        <Task
          key={task.SK}
          title={title}
          task={task}
          sortedTasks={sortedTasks}
          setSortedTasks={setSortedTasks}
          handleDeleteTask={handleDeleteTask}
          handleNewTask={handleNewTask}
          setBoards={setBoards}
          cardEmoji={cardEmoji}
          setPromptConf={setPromptConf}
          setConfirmConf={setConfirmConf}
          setAlertConf={setAlertConf}
          localDB={localDB}
          setLocalSyncRequired={setLocalSyncRequired}
        />
      ))}

      <div className="new-task-container">
        {loadingTask && (
          <PulseLoader
            cssOverride={loaderStyle}
            size={5}
            color="var(--text-colour)"
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        )}
        <div className="addTaskWrapper" onClick={() => handleNewTask(null)}>
          <img className="addTask" src={addIcon} alt="add icon" />
          <div className="addTaskText">new task...</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
