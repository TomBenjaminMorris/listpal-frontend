import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Card from './Card';
import './CardList.css'

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
    if (!name) {
      alert("Name can't be empty");
      return;
    }
    if (Object.keys(tmpSortedTasks).includes(name)) {
      alert("That category already exists on this board, chose another");
      return;
    }
    const newCardDefaultTask = {
      "CreatedDate": Date.now(),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": "b#12345",
      "ExpiryDate": "nil",
      "Description": "",
      "CompletedDate": "nil",
      "PK": "u#365202d4-0091-708b-eafe-0027f8ef9007",
      "Category": name,
      "EntityType": "Task"
    }
    tmpSortedTasks[name] = [newCardDefaultTask];
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
