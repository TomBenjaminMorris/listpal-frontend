import { useState, useEffect } from 'react';
import { updateScoresAPI, updateTaskDescription, updateTaskDetails, updateTaskImportance, newTask } from '../utils/apiGatewayClient';
import { v4 as uuidv4 } from 'uuid';
import binIcon from "../assets/icons8-close-50-white.png"
import importantIcon from "../assets/icons8-important-30-white.png"
import TextareaAutosize from 'react-textarea-autosize';
import './Task.css'

const Task = ({ title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask, setUserDetails }) => {
  // console.log("rendering: Task")
  const [description, setDescription] = useState(task.Description);
  const [checked, setChecked] = useState(task.CompletedDate != "nil");
  const [timer, setTimer] = useState(null);
  const [display, setDisplay] = useState(true);

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
          setUserDetails((details) => {
            const tmpUserDetails = { ...details };
            tmpUserDetails.YScore++;
            tmpUserDetails.MScore++;
            tmpUserDetails.WScore++;
            updateScoresAPI({ YScore: tmpUserDetails.YScore, MScore: tmpUserDetails.MScore, WScore: tmpUserDetails.WScore })
            return tmpUserDetails;
          })
        } else {
          t.CompletedDate = "nil";
          t["GSI1-SK"] = "nil";
          t.ExpiryDate = "nil";
          setUserDetails((details) => {
            const tmpUserDetails = { ...details };
            tmpUserDetails.YScore == 0 ? null : tmpUserDetails.YScore--;
            tmpUserDetails.MScore == 0 ? null : tmpUserDetails.MScore--;
            tmpUserDetails.WScore == 0 ? null : tmpUserDetails.WScore--;
            updateScoresAPI({ YScore: tmpUserDetails.YScore, MScore: tmpUserDetails.MScore, WScore: tmpUserDetails.WScore })
            return tmpUserDetails;
          });
        }
        updateTaskDetails(t.SK, t.CompletedDate, t.ExpiryDate, t["GSI1-SK"])
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
        className={`task-textarea-box ${task.Important == "true" ? "highlight" : null}`}
        value={description}
        disabled={checked}
        placeholder='new task...'
        onChange={handleTextUpdate}
        autoFocus={description === "" ? true : false}
        onKeyDown={(e) => onKeyDown(e, task.SK, title)}
        style={checked ? { textDecoration: "line-through var(--accent) 2px", opacity: taskExpiryOpacity() } : null}
      />
      <div className="deleteTask">
        <img
          src={importantIcon}
          alt="important icon"
          onClick={() => handleMarkAsImportant(task.SK)} />
      </div>
      <div className="deleteTask" >
        <img
          src={binIcon}
          alt="delete icon"
          onClick={() => handleDeleteAndHideTask(task.SK, title, false)} />
      </div>
    </div>
  );
};

export default Task;
