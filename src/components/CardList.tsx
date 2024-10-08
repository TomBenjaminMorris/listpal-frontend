import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { newTask, deleteTask, updateTaskDescription } from '../utils/apiGatewayClient';
import Card from './Card';
import './CardList.css'

const CardList = ({ sortedTasks, setSortedTasks, setBoards }) => {
  // console.log("rendering: CardList")
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const handleDeleteTask = (taskID, title) => {
    const tmpSortedTasks = { ...sortedTasks };
    const tmp = tmpSortedTasks[title].filter((t) => t.CompletedDate == "nil");
    const isLastUncheckedTask = tmp.length == 1 && tmp[0].SK == taskID;
    if (tmpSortedTasks[title] && isLastUncheckedTask) {
      // const ok = confirm("Removing the last task will delete the category. Are you sure?");
      // if (ok) {
      //   delete tmpSortedTasks[title];
      // } else {
      //   return
      // }
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

  var cards = Object.keys(sortedTasks).map(function (key) {
    return <Card
      key={key}
      title={key}
      tasks={sortedTasks[key]}
      setSortedTasks={setSortedTasks}
      sortedTasks={sortedTasks}
      handleDeleteTask={handleDeleteTask}
      setBoards={setBoards}
    />
  });

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
    const url = window.location.href;
    const boardID = url.split('/').pop();

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
    newTask(newCardDefaultTask.SK, newCardDefaultTask.CreatedDate, newCardDefaultTask.CompletedDate, newCardDefaultTask.ExpiryDate, newCardDefaultTask['GSI1-PK'], newCardDefaultTask.Description, newCardDefaultTask.Category);
    setSortedTasks(tmpSortedTasks);
    forceUpdate();
  }

  return (
    <div className="card-list-container">
      {cards}
      <div id="addCardButton" onClick={handleNewCard}>+</div>
    </div>
  );
};

export default CardList;
