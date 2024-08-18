import { useReducer, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import addIcon from "../assets/icons8-add-30.png"
import Task from './Task';
import './Card.css'

const fakeApi = (titleEdited) => console.log('Renaming title to: ' + titleEdited)

const Card = ({ title, tasks, setSortedTasks, sortedTasks, handleDeleteTask, setUserDetails }) => {
  // console.log("rendering: Card")
  const [titleEdited, setTitleEdited] = useState(title);
  const [timer, setTimer] = useState(null);
  const [orderedTasks, setOrderedTasks] = useState([]);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const sortList = (list) => {
    const doneList = []
    const notDoneList = []
    list && list.forEach(element => {
      element.CompletedDate === "nil" ? notDoneList.push(element) : doneList.push(element);
    });
    return [...doneList, ...notDoneList];
  }

  useEffect(() => {
    setOrderedTasks(sortList(tasks));
  }, [tasks])

  const handleEditTitle = e => {
    setTitleEdited(e.target.value)
    clearTimeout(timer)
    const newTimer = setTimeout(() => {
      fakeApi(e.target.value)
      renameCategory(e.target.value)
    }, 4000)
    setTimer(newTimer);
  }

  const renameCategory = (newTitle) => {
    const tmpSortedTasks = { ...sortedTasks }
    if (Object.keys(tmpSortedTasks).includes(newTitle)) {
      alert("That category already exists on this board, chose another");
      setTitleEdited(title);
      return;
    }
    const updatedCategoryArray = sortedTasks[title].map((t) => {
      if (t.Category === title) {
        t.Category = newTitle;
      }
      return t
    });
    tmpSortedTasks[newTitle] = updatedCategoryArray
    delete tmpSortedTasks[title];
    setSortedTasks(tmpSortedTasks);
  }

  const handleNewTask = async () => {
    console.log("TTT triggered: handleNewTask")
    const emptyTask = {
      "CreatedDate": Date.now(),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": "b#12345",
      "ExpiryDate": "nil",
      "Description": "",
      "CompletedDate": "nil",
      "PK": "u#365202d4-0091-708b-eafe-0027f8ef9007",
      "Category": title,
      "EntityType": "Task"
    }
    let tmpSortedTasks = { ...sortedTasks };
    tmpSortedTasks[title].push(emptyTask);
    setSortedTasks(tmpSortedTasks);
    setOrderedTasks((tasks) => {
      let tmpTasks = [...tasks];
      tmpTasks.push(emptyTask)
      return tmpTasks;
    });
    forceUpdate();
  }

  const tasksRendered = orderedTasks && orderedTasks.map((task) => {
    return (
      <Task
        key={task.SK}
        title={title}
        task={task}
        sortedTasks={sortedTasks}
        setSortedTasks={setSortedTasks}
        handleDeleteTask={handleDeleteTask}
        handleNewTask={handleNewTask}
        setUserDetails={setUserDetails}
      ></Task>
    )
  });

  return (
    <div className="card-container">
      <div className="headingWrapper">
        <input className="edit-title-input" type="text" value={titleEdited} onChange={handleEditTitle} />
        {/* <h3 className="score">{"0"}</h3> */}
      </div>
      <hr />
      {tasksRendered}
      <div className="task-container">
        {/* <div onClick={handleNewTask} id="addTask">+</div> */}
        <img
          className="addTask"
          onClick={handleNewTask}
          src={addIcon}
          alt="add icon" />
      </div>
    </div>
  );
};

export default Card;
