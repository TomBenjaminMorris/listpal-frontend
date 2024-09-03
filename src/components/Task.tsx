import { useState } from 'react';
import { updateScoresAPI, updateTaskDescription, updateTaskDetails } from '../utils/apiGatewayClient';
import binIcon from "../assets/icons8-close-50.png"
import TextareaAutosize from 'react-textarea-autosize';
import './Task.css'

const Task = ({ title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask, setUserDetails }) => {
  // console.log("rendering: Task")
  const [description, setDescription] = useState(task.Description);
  const [checked, setChecked] = useState(task.CompletedDate != "nil");
  const [timer, setTimer] = useState(null);
  const [display, setDisplay] = useState(true);

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
    }, 400);
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
    tmpSortedTasks[title] = sortedTasks[title] && sortedTasks[title].map(t => {
      if (t.SK === task.SK) {
        if (c) {
          const today = new Date();
          var date = new Date(today.valueOf());
          const expiryDate = String(date.setDate(date.getDate() + 3));

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
    setSortedTasks(tmpSortedTasks);
  }

  const handleDeleteAndHideTask = (taskID, title) => {
    // console.log("TTT triggered: handleDeleteAndHideTask")
    handleDeleteTask(taskID, title) ? setDisplay(false) : null;
  }

  const onKeyDown = (e, taskID, title) => {
    if (e.keyCode === 8 && e.target.value === "") {
      clearTimeout(timer);
      handleDeleteAndHideTask(taskID, title)
    } else if (e.keyCode === 13) {
      e.preventDefault()
      clearTimeout(timer);
      handleNewTask()
    }
  }

  const taskExpiryOpacity = () => {
    // const now = new Date
    // const expiryDate = new Date(parseInt(task.ExpiryDate));
    // const expiryDate = new Date(unix_timestamp * 1000);
    const now = Date.now()
    const expiryDate = parseInt(task.ExpiryDate);
    const diffTime = Math.abs(expiryDate - now);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // console.log(diffDays);

    if (diffDays >= 2) {
      return "0.8"
    } else if (diffDays >= 1) {
      return "0.4"
    } else if (diffDays >= 0) {
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
        className="task-textarea-box"
        value={description}
        disabled={checked}
        placeholder='new task...'
        onChange={handleTextUpdate}
        autoFocus
        onKeyDown={(e) => onKeyDown(e, task.SK, title)}
        style={checked ? { textDecoration: "line-through var(--red) 2px", opacity: taskExpiryOpacity() } : null}
      />
      <div className="deleteTask">
        <img
          className="deleteTask"
          src={binIcon}
          alt="delete icon"
          onClick={() => handleDeleteAndHideTask(task.SK, title)} />
      </div>
    </div>
  );
};

export default Task;
