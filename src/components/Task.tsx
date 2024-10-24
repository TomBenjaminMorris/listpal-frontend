import { useState, useEffect, useRef } from 'react';
import { updateBoardScoresAPI, updateTaskDescription, updateTaskDetails, updateTaskImportance, newTask } from '../utils/apiGatewayClient';
import { v4 as uuidv4 } from 'uuid';
import menuIcon from "../assets/icons8-dots-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import './Task.css'
import TaskMenu from './TaskMenu';
import { useOnClickOutside } from 'usehooks-ts'

const Task = ({ title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask, setBoards }) => {
  // console.log("rendering: Task")
  const [description, setDescription] = useState(task.Description);
  const [checked, setChecked] = useState(task.CompletedDate != "nil");
  const [timer, setTimer] = useState(null);
  const [display, setDisplay] = useState(true);
  const [taskMenuVisible, setTaskMenuVisible] = useState(false);

  useEffect(() => {
    setDescription(task.Description);
  }, [task.Description])

  const handleCheckBox = () => {
    setChecked((checked) => !checked);
    updateActiveTaskChecked(!checked);
  }

  const handleTextUpdate = e => {
    setDescription(e.target.value);
    clearTimeout(timer);
    const newTimer = setTimeout(() => {
      updateTaskDescription(task.SK, e.target.value).then(() => {
        updateActiveTaskDescription(e.target.value)
      });
    }, 2000);
    setTimer(newTimer);
  }

  const updateActiveTaskDescription = (value) => {
    let tmpSortedTasks = { ...sortedTasks };
    tmpSortedTasks[title] = sortedTasks[title].map(t => {
      if (t.SK === task.SK) {
        t.Description = value;
      }
      return t;
    });
    setSortedTasks(tmpSortedTasks);
  }

  const updateActiveTaskChecked = (c) => {
    let tmpSortedTasks = { ...sortedTasks };
    let isLastUncheckedTask = false;
    tmpSortedTasks[title] = sortedTasks[title] && sortedTasks[title].map(t => {
      if (t.SK === task.SK) {
        if (c) {
          const tmp = tmpSortedTasks[title].filter((t) => t.CompletedDate == "nil");
          isLastUncheckedTask = tmp.length == 1 && tmp[0].SK == task.SK;

          const today = new Date();
          var date = new Date(today.valueOf());
          const expiryDate = String(date.setDate(date.getDate() + 2));

          t.CompletedDate = String(Date.now());
          t["GSI1-SK"] = expiryDate;
          t.ExpiryDate = expiryDate;
          t.ExpiryDateTTL = Math.trunc(parseInt(expiryDate) / 1000);
          setBoards(current => {
            const tmpBoards = current.map(b => {
              if (b.SK == JSON.parse(localStorage.getItem('activeBoard')).SK) {
                b.YScore++;
                b.MScore++;
                b.WScore++;
                updateBoardScoresAPI(b.SK, { YScore: b.YScore, MScore: b.MScore, WScore: b.WScore })
              }
              return b
            });
            return tmpBoards;
          })
        } else {
          t.CompletedDate = "nil";
          t["GSI1-SK"] = "nil";
          t.ExpiryDate = "nil";
          t.ExpiryDateTTL = 0;
          setBoards(current => {
            const tmpBoards = current.map(b => {
              if (b.SK == JSON.parse(localStorage.getItem('activeBoard')).SK) {
                b.YScore == 0 ? null : b.YScore--;
                b.MScore == 0 ? null : b.MScore--;
                b.WScore == 0 ? null : b.WScore--;
                updateBoardScoresAPI(b.SK, { YScore: b.YScore, MScore: b.MScore, WScore: b.WScore })
              }
              return b
            });
            return tmpBoards;
          })
        }
        updateTaskDetails(t.SK, t.CompletedDate, t.ExpiryDate, t["GSI1-SK"], t.ExpiryDateTTL)
      }
      return t;
    })

    const activeBoard = JSON.parse(localStorage.getItem('activeBoard'))
    const newCardDefaultTask = {
      "CreatedDate": String(Date.now()),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": activeBoard.SK,
      "ExpiryDate": "nil",
      "Description": "",
      "CompletedDate": "nil",
      "Category": title,
      "EntityType": "Task"
    }
    if (isLastUncheckedTask) {
      tmpSortedTasks[title].push(newCardDefaultTask);
      newTask(newCardDefaultTask.SK, newCardDefaultTask.CreatedDate, newCardDefaultTask.CompletedDate, newCardDefaultTask.ExpiryDate, newCardDefaultTask['GSI1-PK'], newCardDefaultTask.Description, newCardDefaultTask.Category);
    }
    setSortedTasks(tmpSortedTasks);
  }

  const handleDeleteAndHideTask = (taskID, title, fromKeybord) => {
    if (!fromKeybord && !confirm("Delete task?")) {
      return
    }
    handleDeleteTask(taskID, title) ? setDisplay(false) : null;
    setTaskMenuVisible(false);
  }

  const handleMarkAsImportant = (taskID) => {
    let tmpSortedTasks = { ...sortedTasks };
    let isImportant = "false";
    tmpSortedTasks[title] = sortedTasks[title] && sortedTasks[title].map(t => {
      if (t.SK === taskID) {
        t.Important == "true" ? isImportant = "false" : isImportant = "true";
        t.Important = isImportant
      }
      return t;
    })
    updateTaskImportance(taskID, isImportant).then(() => {
      setSortedTasks(tmpSortedTasks);
    })
    setTaskMenuVisible(false);
  }

  const onKeyDown = (e, taskID, title) => {
    if (e.keyCode === 8 && e.target.value === "") {
      clearTimeout(timer);
      handleDeleteAndHideTask(taskID, title, true)
    } else if (e.keyCode === 13) {
      e.preventDefault()
      // clearTimeout(timer);
      handleNewTask()
    }
  }

  const taskExpiryOpacity = () => {
    const now = Date.now()
    const expiryDate = parseInt(task.ExpiryDate);
    const diffTime = Math.abs(expiryDate - now);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 2) {
      return "0.4"
    } else if (diffDays == 1) {
      return "0.3"
    } else if (diffDays == 0) {
      return "0.2"
    }
  }

  const handleClickMenu = () => {
    setTaskMenuVisible(current => !current);
  };

  const ref = useRef(null)
  
  const handleClickOutside = () => {
    setTaskMenuVisible(false)
  }
  
  useOnClickOutside(ref, handleClickOutside)

  return (
    <div className="task-container" style={display ? null : { display: "none" }}>
      <input
        style={checked ? { opacity: taskExpiryOpacity() } : null}
        type="checkbox"
        name="checkbox"
        checked={checked}
        onChange={handleCheckBox}
      />
      <TextareaAutosize
        className={`task-textarea-box ${task.Important == "true" ? "highlight" : null} ${taskMenuVisible ? "highlight-2" : null}`}
        value={description}
        disabled={checked}
        placeholder='new task...'
        onChange={handleTextUpdate}
        autoFocus={description === "" ? true : false}
        onKeyDown={(e) => onKeyDown(e, task.SK, title)}
        style={checked ? { textDecoration: "line-through var(--accent) 2px", opacity: taskExpiryOpacity() } : null}
      />
      <div className={`taskMenu ${taskMenuVisible ? "menu-background-display" : null}`} ref={ref}>
        <img
          className="task-three-dots-vertical"
          src={menuIcon}
          alt="menu icon"
          onClick={handleClickMenu} />
      {taskMenuVisible && <TaskMenu markAsImportant={() => handleMarkAsImportant(task.SK)} deleteAndHideTask={() => handleDeleteAndHideTask(task.SK, title, false)} isImportant={task.Important == "true"} />}
      </div>
    </div>
  );
};

export default Task;
