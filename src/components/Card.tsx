import { useReducer, useState, useEffect, CSSProperties, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { newTask, renameCatagoryAPI, deleteTasks } from '../utils/apiGatewayClient';
import addIcon from "../assets/icons8-plus-30.png";
import closeIcon from "../assets/icons8-close-50-white.png";
import dotsIcon from "../assets/icons8-dots-50.png";
import PulseLoader from "react-spinners/PulseLoader";
import Task from './Task';
import './Card.css';
import DropdownMenu from "./DropdownMenu";
import { useOnClickOutside } from 'usehooks-ts'


const override: CSSProperties = {
  marginLeft: "30px",
  marginTop: "6px",
  marginBottom: "19px",
  opacity: "0.8",
};

const Card = ({ title, tasks, setSortedTasks, sortedTasks, handleDeleteTask, setBoards }) => {
  // console.log("rendering: Card")
  const [titleEdited, setTitleEdited] = useState(title);
  const [timer, setTimer] = useState(null);
  const [orderedTasks, setOrderedTasks] = useState([]);
  const [loadingTask, setLoadingTask] = useState(false);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const handleClickMenu = () => {
    setDropdownVisible(current => !current);
  };

  useEffect(() => {
    setOrderedTasks(sortList(tasks));
  }, [sortedTasks])

  const sortList = (list) => {
    const doneList = []
    const notDoneList = []
    list && list.forEach(element => {
      element.CompletedDate === "nil" ? notDoneList.push(element) : doneList.push(element);
    });
    doneList.sort(function (a, b) {
      return parseInt(a.ExpiryDate) - parseInt(b.ExpiryDate);
    });
    notDoneList.sort(function (a, b) {
      return parseInt(a.CreatedDate) - parseInt(b.CreatedDate);
    });
    // return [...notDoneList, ...doneList];
    return [...doneList, ...notDoneList];
  }

  const handleEditTitle = e => {
    setTitleEdited(e.target.value)
    clearTimeout(timer)
    const newTimer = setTimeout(() => {
      renameCategory(e.target.value)
    }, 2000)
    setTimer(newTimer);
  }

  const renameCategory = (newTitle) => {
    const tmpSortedTasks = { ...sortedTasks }
    if (!newTitle || newTitle == "") {
      alert("Name can't be empty");
      setTitleEdited(title);
      return;
    }
    if (Object.keys(tmpSortedTasks).includes(newTitle)) {
      alert("That category already exists on this board, chose another");
      setTitleEdited(title);
      return;
    }
    let taskIDs = [];
    const updatedCategoryArray = sortedTasks[title].map((t) => {
      if (t.Category === title) {
        t.Category = newTitle;
        taskIDs.push(t.SK);
      }
      return t
    });
    tmpSortedTasks[newTitle] = updatedCategoryArray
    delete tmpSortedTasks[title];
    renameCatagoryAPI(taskIDs, newTitle).then(() => {
      setSortedTasks(tmpSortedTasks);
    });
  }

  const handleNewTask = async () => {
    // console.log("TTT triggered: handleNewTask")
    const url = window.location.href;
    const boardID = url.split('/').pop();

    setLoadingTask(true)
    const emptyTask = {
      "CreatedDate": String(Date.now()),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
      "ExpiryDate": "nil",
      "Description": "",
      "CompletedDate": "nil",
      "Category": title,
      "EntityType": "Task"
    }

    newTask(emptyTask.SK, emptyTask.CreatedDate, emptyTask.CompletedDate, emptyTask.ExpiryDate, emptyTask['GSI1-PK'], emptyTask.Description, emptyTask.Category).then(() => {
      let tmpSortedTasks = { ...sortedTasks };
      // tmpSortedTasks[title].push(emptyTask);
      tmpSortedTasks[title].unshift(emptyTask);
      setSortedTasks(tmpSortedTasks);
      setOrderedTasks((tasks) => {
        let tmpTasks = [...tasks];
        // tmpTasks.unshift(emptyTask)
        tmpTasks.push(emptyTask)
        setLoadingTask(false)
        return tmpTasks;
      });
      forceUpdate();
    });
  }

  const handleDeleteCategory = () => {
    const ok = confirm(`Delete catagory - ${title}?`);
    if (ok) {
      const tmpSortedTasks = { ...sortedTasks };
      deleteTasks(tmpSortedTasks[title])
      delete tmpSortedTasks[title];
      setSortedTasks(tmpSortedTasks);
    } else {
      return
    }
  }

  const measuredRef = useCallback(node => {
    if (!node) return;
    const resizeObserver = new ResizeObserver(() => {
      forceUpdate()
    });
    resizeObserver.observe(node);
  }, []);

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
        setBoards={setBoards}
      ></Task>
    )
  });

  const newTaskRendered = (
    <div className="addTaskWrapper" onClick={handleNewTask}>
      <img className="addTask" src={addIcon} alt="add icon" />
      {/* <input className="addTask" type="checkbox" name="checkbox" /> */}
      <div className="addTaskText">new task...</div>
    </div>
  )

  const loader = (
    <PulseLoader
      cssOverride={override}
      size={5}
      color={"var(--text-colour)"}
      speedMultiplier={1}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  )

  const ref = useRef(null)
  
  const handleClickOutside = () => {
    setDropdownVisible(false)
  }

  useOnClickOutside(ref, handleClickOutside)

  return (
    <div ref={measuredRef} className="card-container">
      <div className="headingWrapper">
        <input className="edit-title-input" type="text" value={titleEdited} onChange={handleEditTitle} />
        {/* <img className="deleteCategory" onClick={handleDeleteCategory} src={closeIcon} alt="delete icon" /> */}
        <div className="menu" onClick={handleClickMenu} ref={ref}>
          <img className={`rotate card-menu-dots ${isDropdownVisible ? "card-menu-dots-bg-fill" : null}`} src={dotsIcon} alt="menu icon" />
          {isDropdownVisible && <DropdownMenu handleDeleteCategory={handleDeleteCategory}/>}
        </div>
      </div>
      <hr />
      {tasksRendered}
      <div className="new-task-container">
        {loadingTask ? loader : null}
        {newTaskRendered}
      </div>
    </div>
  );
};

export default Card;
