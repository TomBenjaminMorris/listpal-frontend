import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { newTask } from '../utils/apiGatewayClient';
import Card from './Card';
import './CardList.css'
import { deleteTask } from '../utils/apiGatewayClient';

const CardList = ({ sortedTasks, setSortedTasks, setUserDetails }) => {
  // console.log("rendering: CardList")
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const handleDeleteTask = (taskID, title) => {
    const tmpSortedTasks = { ...sortedTasks };
    if (sortedTasks[title] && sortedTasks[title].length === 1) {
      const ok = confirm("Removing the last task will delete the category. Are you sure?");
      if (ok) {
        delete tmpSortedTasks[title];
      } else {
        return
      }
    } else {
      tmpSortedTasks[title] = sortedTasks[title].filter(t => t.SK !== taskID);
    }
    deleteTask(taskID);
    setSortedTasks(tmpSortedTasks);
  }

  var cards = Object.keys(sortedTasks).map(function (key) {
    return <Card
      key={key}
      title={key}
      tasks={sortedTasks[key]}
      setSortedTasks={setSortedTasks}
      sortedTasks={sortedTasks}
      handleDeleteTask={handleDeleteTask}
      setUserDetails={setUserDetails}
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
    const newCardDefaultTask = {
      "CreatedDate": String(Date.now()),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": JSON.parse(localStorage.getItem('activeBoard')).SK,
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
