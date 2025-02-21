import { useState, useEffect, useRef, memo } from 'react';
import { updateBoardScoresAPI } from '../utils/apiGatewayClient';
import { writeDataToLocalDB, readDataFromLocalDB } from '../utils/localDBHelpers';
import { v4 as uuidv4 } from 'uuid';
import { useOnClickOutside } from 'usehooks-ts'
import linkIcon from '../assets/icons8-link-64.png';
import menuIcon from "../assets/icons8-dots-50.png"
import arrowIcon from "../assets/icons8-line-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import TaskMenu from './TaskMenu';
import './Task.css'

const Task = memo(({ localDB, title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask, setBoards, cardEmoji, setPromptConf, setConfirmConf, setAlertConf, setLocalSyncRequired }) => {
  const [description, setDescription] = useState(task.Description);
  const [checked, setChecked] = useState(task.CompletedDate != "nil");
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);

  // Update description when task.Description changes
  useEffect(() => {
    if (task.Description !== description) {  // Prevent unnecessary re-renders
      setDescription(task.Description);
    }
  }, [task.Description]);

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
      setDescription(newDescription);
      updateActiveTaskDescription(newDescription)

      // Check if the task has been created since the last sync and update accordingly
      let isCreate = false
      readDataFromLocalDB(localDB, 'tasks', task.SK).then(t => {
        isCreate = t.Action == "create"
      }).catch(() => { }).finally(() => {
        writeDataToLocalDB(localDB, "tasks", { ...task, Action: isCreate ? "create" : "update", Description: newDescription });
        setLocalSyncRequired(true);
      })
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
            updateBoardScoresAPI(
              b.SK,
              { YScore: b.YScore, MScore: b.MScore, WScore: b.WScore },
              { taskID: task.SK, description: task.Description, category: task.Category, emoji: task.Emoji, checked: isChecked }
            );
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

        // Check if the task has been created since the last sync and update accordingly
        let isCreate = false
        readDataFromLocalDB(localDB, 'tasks', task.SK).then(localTask => {
          isCreate = localTask.Action == "create"
        }).catch(() => { }).finally(() => {
          writeDataToLocalDB(localDB, "tasks", { ...t, Action: isCreate ? "create" : "update" });
          setLocalSyncRequired(true);
        })
      }
      return t;
    });

    // Create a new task if this is the last unchecked task
    if (isLastUncheckedTask) {
      const newCardDefaultTask = {
        "CreatedDate": String(Date.now()),
        "SK": "t#" + uuidv4(),
        "PK": "",
        "GSI1-SK": "nil",
        "GSI1-PK": activeBoard.SK,
        "ExpiryDate": "nil",
        "Description": "",
        "CompletedDate": "nil",
        "Category": title,
        "EntityType": "Task",
        "Emoji": cardEmoji,
        "Link": "",
        "Important": "false",
        "ExpiryDateTTL": 0
      };

      tmpSortedTasks[title].push(newCardDefaultTask);
      writeDataToLocalDB(localDB, "tasks", { ...newCardDefaultTask, Action: "create" }).then(() => {
        setLocalSyncRequired(true)
      })
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

      // Check if the task has been created since the last sync and update accordingly
      let isCreate = false
      readDataFromLocalDB(localDB, 'tasks', task.SK).then(t => {
        isCreate = t.Action == "create"
      }).catch(() => { }).finally(() => {
        writeDataToLocalDB(localDB, "tasks", { ...task, Action: isCreate ? "create" : "update", Important: newImportantStatus });
        setLocalSyncRequired(true);
        setSortedTasks(updatedTasks);
      })
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
      // Pass the latest sortedTasks to the handleNewTask to prevent it being overwritten (bug)
      let tmpSortedTasks = { ...sortedTasks };
      tmpSortedTasks[title] = sortedTasks[title].map(t =>
        t.SK === taskID ? { ...t, Description: description } : t
      );
      handleNewTask(tmpSortedTasks);
    }
  };

  // Calculate completed task opacity based on time since completed
  const taskExpiryOpacity = () => {
    const now = Date.now();
    const expiryDate = parseInt(task.ExpiryDate);
    const diffDays = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays >= 2) return "0.4";
    if (diffDays === 1) return "0.3";
    if (diffDays < 1) return "0.2";

    return "1";
  };

  // Handle click outside task menu
  const taskMenuRef = useRef(null);
  useOnClickOutside(taskMenuRef, () => taskMenuVisible && setTaskMenuVisible(false));

  // Extract repeated logic
  const isImportant = task.Important === "true";
  const taskExpiryOpacityStyle = checked ? { opacity: taskExpiryOpacity() } : null;
  const taskTextDecorationStyle = checked ? { textDecoration: "line-through var(--accent) 2px", opacity: taskExpiryOpacity() } : null;
  const taskAutoFocus = description === "";
  const isLinkAvailable = task.Link && task.Link !== "";

  return (
    <div className="task-container">

      <img className="task-hover-indicator" src={arrowIcon} alt="follow link icon" />

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
            localDB={localDB}
            setLocalSyncRequired={setLocalSyncRequired}
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
