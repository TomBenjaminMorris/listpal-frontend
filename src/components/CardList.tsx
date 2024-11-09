import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBoardIdFromUrl, getSortArray, updateCategoryOrder } from '../utils/utils';
import { newTask, deleteTask, updateTaskDescription } from '../utils/apiGatewayClient';
import Card from './Card';
import './CardList.css'

const CardList = ({ filteredSortedTasks, sortedTasks, setSortedTasks, setBoards, boards }) => {
  // console.log("rendering: CardList")
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const handleDeleteTask = (taskID, title) => {
    const tmpSortedTasks = { ...sortedTasks };
    const tmp = tmpSortedTasks[title].filter((t) => t.CompletedDate == "nil");
    const isLastUncheckedTask = tmp.length == 1 && tmp[0].SK == taskID;
    if (tmpSortedTasks[title] && isLastUncheckedTask) {
      tmpSortedTasks[title] = tmpSortedTasks[title].map(t => {
        if (t.SK === taskID) {
          if (t.Description != "") {
            t.Description = "";
            updateTaskDescription(taskID, "");
          } else {
            alert("Last task cannot be removed");
          }
        }
        return t;
      });
      setSortedTasks(tmpSortedTasks)
    } else {
      tmpSortedTasks[title] = sortedTasks[title].filter(t => t.SK !== taskID);
      deleteTask(taskID);
      setSortedTasks(tmpSortedTasks);
    }
  }

  const handleNewCard = () => {
    let tmpSortedTasks = { ...sortedTasks };
    const name = prompt("Enter new name...");
    if (name === null) {
      return;
    }
    if (!name || name == "") {
      alert("Name can't be empty");
      return;
    }
    if (Object.keys(tmpSortedTasks).includes(name)) {
      alert("That category already exists on this board, chose another");
      return;
    }

    let sortArr = getSortArray(boards);
    sortArr.unshift(name)
    const boardID = getBoardIdFromUrl();

    const newCardDefaultTask = {
      "CreatedDate": String(Date.now()),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
      "ExpiryDate": "nil",
      "Description": "",
      "CompletedDate": "nil",
      "Category": name,
      "EntityType": "Task"
    }
    tmpSortedTasks[name] = [newCardDefaultTask];

    newTask(newCardDefaultTask.SK, newCardDefaultTask.CreatedDate, newCardDefaultTask.CompletedDate, newCardDefaultTask.ExpiryDate, newCardDefaultTask['GSI1-PK'], newCardDefaultTask.Description, newCardDefaultTask.Category, "").then(() => {
      updateCategoryOrder(sortArr, boards, setBoards)
    });
    setSortedTasks(tmpSortedTasks);
    forceUpdate();
  }

  const cards = Object.keys(filteredSortedTasks).map(function (key) {
    return <Card
      key={key}
      title={key}
      tasks={sortedTasks[key]}
      setSortedTasks={setSortedTasks}
      sortedTasks={sortedTasks}
      handleDeleteTask={handleDeleteTask}
      setBoards={setBoards}
      boards={boards}
    />
  });

  return (
    <div className="card-list-container">
      {cards}
      <div id="addCardButton" className="fadeUp-animation" onClick={handleNewCard}>+</div>
    </div>
  );
};

export default CardList;
