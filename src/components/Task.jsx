import { useState, useEffect, useRef, memo } from 'react';
import { updateBoardScoresAPI, updateTaskDescription, updateTaskImportance, newTask, updateTaskChecked } from '../utils/apiGatewayClient';
import { v4 as uuidv4 } from 'uuid';
import { useOnClickOutside } from 'usehooks-ts'
import linkIcon from '../assets/icons8-link-64.png';
import menuIcon from "../assets/icons8-dots-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import TaskMenu from './TaskMenu';
import './Task.css'

const Task = memo(({ title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask, setBoards, cardEmoji, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [description, setDescription] = useState(task.Description);
  const [checked, setChecked] = useState(task.CompletedDate != "nil");
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);
  const [descriptionHasChanged, setDescriptionHasChanged] = useState(false);
  const [timer, setTimer] = useState(null);

  // Update description when task.Description changes
  useEffect(() => {
    if (task.Description !== description) {  // Prevent unnecessary re-renders
      setDescription(task.Description);
    }
  }, [task.Description]);

  // Cleanup on unmount or when the component re-renders
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  // Toggle checkbox state
  const handleCheckBox = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    updateActiveTaskChecked(newChecked);
  }

  // Handle text update (only set state if the value has changed)
  const handleTextUpdate = e => {
    const newDescription = e.target.value;
    if (newDescription !== description) {
      setDescriptionHasChanged(true);
      setDescription(newDescription);
      if (timer) {
        clearTimeout(timer);
      }
      // Start a new timer to save data after a delay. Save after 10 seconds of inactivity
      const newTimer = setTimeout(() => {
        saveAndUpdate();
      }, 10000);
      setTimer(newTimer);
    }
  }

  // Persist changes to app state
  const updateActiveTaskDescription = (value) => {
    let tmpSortedTasks = { ...sortedTasks };
    tmpSortedTasks[title] = sortedTasks[title].map(t =>
      t.SK === task.SK ? { ...t, Description: value } : t
    );
    setSortedTasks(tmpSortedTasks);
  }

  // Perform update actions to the DB and app state on checkbox toggle
  const updateActiveTaskChecked = (isChecked) => {
    let tmpSortedTasks = { ...sortedTasks };
    const activeBoard = JSON.parse(localStorage.getItem('activeBoard'));
    let isLastUncheckedTask = false;
    if (isChecked) {
      const tmpTaskList = tmpSortedTasks[title]?.filter((t) => t.CompletedDate == "nil");
      isLastUncheckedTask = tmpTaskList.length === 1 && tmpTaskList[0].SK == task.SK;
    }

    const updateBoardScores = (increment) => {
      setBoards((current) => {
        return current.map(b => {
          if (b.SK === activeBoard?.SK) {
            b.YScore = Math.max(0, b.YScore + increment);
            b.MScore = Math.max(0, b.MScore + increment);
            b.WScore = Math.max(0, b.WScore + increment);
            updateBoardScoresAPI(b.SK, { YScore: b.YScore, MScore: b.MScore, WScore: b.WScore });
          }
          return b;
        });
      });
    };

    tmpSortedTasks[title] = sortedTasks[title]?.map(t => {
      if (t.SK === task.SK) {
        if (isChecked) {
          // Mark task as completed
          const today = new Date();
          const expiryDate = String(new Date(today.setDate(today.getDate() + 2)).valueOf());
          t.CompletedDate = String(Date.now());
          t["GSI1-SK"] = expiryDate;
          t.ExpiryDate = expiryDate;
          t.ExpiryDateTTL = Math.trunc(parseInt(expiryDate) / 1000);
          updateBoardScores(1); // Increment board scores
        } else {
          // Mark task as not completed
          t.CompletedDate = "nil";
          t["GSI1-SK"] = "nil";
          t.ExpiryDate = "nil";
          t.ExpiryDateTTL = 0;
          updateBoardScores(-1); // Decrement board scores
        }

        updateTaskChecked(t.SK, t.CompletedDate, t.ExpiryDate, t["GSI1-SK"], t.ExpiryDateTTL, "", isChecked, description, title, cardEmoji);
      }
      return t;
    });

    // Create a new task if this is the last unchecked task
    if (isLastUncheckedTask) {
      const newCardDefaultTask = {
        "CreatedDate": String(Date.now()),
        "SK": "t#" + uuidv4(),
        "GSI1-SK": "nil",
        "GSI1-PK": activeBoard.SK,
        "ExpiryDate": "nil",
        "Description": "",
        "CompletedDate": "nil",
        "Category": title,
        "EntityType": "Task",
        "Emoji": cardEmoji,
      };

      tmpSortedTasks[title].push(newCardDefaultTask);
      newTask(newCardDefaultTask.SK, newCardDefaultTask.CreatedDate, newCardDefaultTask.CompletedDate, newCardDefaultTask.ExpiryDate, newCardDefaultTask['GSI1-PK'], newCardDefaultTask.Description, newCardDefaultTask.Category, "", newCardDefaultTask.Emoji);
    }

    setSortedTasks(tmpSortedTasks);
  };

  // Delete the task and remove from the view
  const handleDeleteAndHideTask = (taskID, title) => {
    handleDeleteTask(taskID, title)
    setTaskMenuVisible(false);
  };

  // Perform update actions to the DB and app state on importance toggle
  const handleMarkAsImportant = (taskID) => {
    const updatedTasks = { ...sortedTasks };
    const task = updatedTasks[title]?.find(t => t.SK === taskID);
    if (task) {
      const newImportantStatus = task.Important === "true" ? "false" : "true";
      task.Important = newImportantStatus;
      updateTaskImportance(taskID, newImportantStatus).then(() => {
        setSortedTasks(updatedTasks);
      });
    }
    setTaskMenuVisible(false);
  };

  // Keyboard shortcuts for creating and deleting tasks
  const onKeyDown = (e, taskID, title) => {
    const { key, target } = e;
    if (key === "Backspace" && target.value === "") {
      handleDeleteAndHideTask(taskID, title);
      return;
    }
    if (key === "Enter") {
      e.preventDefault();
      handleNewTask();
    }
  };

  // Calculate completed task opacity based on time since completed
  const taskExpiryOpacity = () => {
    const now = Date.now();
    const expiryDate = parseInt(task.ExpiryDate);
    const diffDays = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays >= 2) return "0.4";
    if (diffDays === 1) return "0.3";
    if (diffDays === 0) return "0.2";

    return "1";
  };

  // Save update task description to the DB and persist to app state
  const saveAndUpdate = () => {
    if (descriptionHasChanged) {
      if (timer) {
        clearTimeout(timer);
      }
      updateTaskDescription(task.SK, description)
        .then(() => updateActiveTaskDescription(description))
        .finally(() => setDescriptionHasChanged(false)); // Reset after update
    }
  }

  // Handle click outside task menu
  const taskMenuRef = useRef(null);
  const handleClickOutside = () => taskMenuVisible && setTaskMenuVisible(false);
  useOnClickOutside(taskMenuRef, handleClickOutside);

  // Handle click outside description field, update description if changed
  const descriptionRef = useRef(null);
  useOnClickOutside(descriptionRef, saveAndUpdate);

  // Extract repeated logic
  const isImportant = task.Important === "true";
  const taskExpiryOpacityStyle = checked ? { opacity: taskExpiryOpacity() } : null;
  const taskTextDecorationStyle = checked ? { textDecoration: "line-through var(--accent) 2px", opacity: taskExpiryOpacity() } : null;
  const taskAutoFocus = description === "";
  const isLinkAvailable = task.Link && task.Link !== "";

  return (
    <div className="task-container">

      {/* Checkbox */}
      <input style={taskExpiryOpacityStyle} type="checkbox" name="checkbox" checked={checked} onChange={handleCheckBox} />

      {/* Description Input */}
      <TextareaAutosize
        className={`task-textarea-box ${isImportant ? "highlight" : ""} ${taskMenuVisible ? "highlight-2" : ""}`}
        value={description}
        disabled={checked}
        placeholder="new task..."
        onChange={handleTextUpdate}
        autoFocus={taskAutoFocus}
        onKeyDown={(e) => onKeyDown(e, task.SK, title)}
        style={taskTextDecorationStyle}
        ref={descriptionRef}
      />

      {/* Link Icon */}
      {isLinkAvailable ? (
        <a href={task.Link} target="_blank" rel="noreferrer">
          <img className="task-dropdown-icons task-three-dots-vertical" src={linkIcon} alt="follow link icon" />
        </a>
      ) : (
        <img className="task-dropdown-icons task-three-dots-vertical no-background" src={linkIcon} alt="follow link icon" style={{ opacity: '0.08' }} />
      )}

      {/* Menu Icon */}
      <div className={`taskMenu ${taskMenuVisible ? "menu-background-display" : ""}`} ref={taskMenuRef}>
        <img className="task-three-dots-vertical" src={menuIcon} alt="menu icon" onClick={() => setTaskMenuVisible(prev => !prev)} />
        {taskMenuVisible && (
          <TaskMenu
            markAsImportant={() => handleMarkAsImportant(task.SK)}
            deleteAndHideTask={() => handleDeleteAndHideTask(task.SK, title)}
            isImportant={isImportant}
            task={task}
            setSortedTasks={setSortedTasks}
            sortedTasks={sortedTasks}
            setPromptConf={setPromptConf}
            setConfirmConf={setConfirmConf}
            setAlertConf={setAlertConf}
          />
        )}
      </div>
    </div>
  );
});

export default Task;
