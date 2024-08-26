import { useState } from 'react';
import binIcon from "../assets/icons8-close-50.png"
import './Task.css'
import TextareaAutosize from 'react-textarea-autosize';
import { updateTaskDescription, updateTaskDetails } from '../utils/apiGatewayClient';

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
      updateTaskDescription(task.SK, e.target.value)
      updateActiveTaskDescription(e.target.value)
    }, 600);
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
          t.CompletedDate = String(Date.now());
          t["GSI1-SK"] = String(Date.now());
          const today = new Date();
          t.ExpiryDate = String(today.setDate(today.getDate() + 3));
          setUserDetails((details) => {
            const tmpUserDetails = { ...details };
            tmpUserDetails.YScore++;
            tmpUserDetails.MScore++;
            tmpUserDetails.WScore++;
            return tmpUserDetails;
          });
        } else {
          t.CompletedDate = "nil";
          t["GSI1-SK"] = "nil";
          t.ExpiryDate = "nil";
          setUserDetails((details) => {
            const tmpUserDetails = { ...details };
            tmpUserDetails.YScore == 0 ? null : tmpUserDetails.YScore--;
            tmpUserDetails.MScore == 0 ? null : tmpUserDetails.MScore--;
            tmpUserDetails.WScore == 0 ? null : tmpUserDetails.WScore--;
            return tmpUserDetails;
          });
        }
        updateTaskDetails(t.SK, t.CompletedDate, t.ExpiryDate, t["GSI1-SK"]);
      }
      // call task details api
      return t;
    })
    setSortedTasks(tmpSortedTasks);
  }

  const handleDeleteAndHideTask = (taskID, title) => {
    console.log("TTT triggered: handleDeleteAndHideTask")
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

  return (
    <div className="task-container" style={display ? null : { display: "none" }}>
      <input
        style={checked ? { opacity: "0.7" } : null}
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
        style={checked ? { textDecoration: "line-through var(--red) 2px", opacity: "0.7" } : null}
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
