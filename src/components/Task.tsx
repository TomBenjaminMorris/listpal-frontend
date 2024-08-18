import { useState } from 'react';
import binIcon from "../assets/icons8-close-50.png"
import './Task.css'
import TextareaAutosize from 'react-textarea-autosize';
// const fakeApi = () => console.log('Api is called')

const Task = ({ title, task, sortedTasks, setSortedTasks, handleDeleteTask, handleNewTask }) => {
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
      // fakeApi()
      updateActiveTaskDescription(e.target.value)
    }, 100);
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
          t.CompletedDate = Date.now();
          t["GSI1-SK"] = Date.now();
          const today = new Date();
          t.ExpiryDate = today.setDate(today.getDate() + 3);
        } else {
          t.CompletedDate = "nil";
          t["GSI1-SK"] = "nil";
          t.ExpiryDate = "nil";
        }
      }
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
