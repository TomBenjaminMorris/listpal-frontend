import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createRandomString } from '../utils/utils';
import Card from './Card';
import './CardList.css'

const CardList = ({ sortedTasks, setSortedTasks }) => {
  // console.log("rendering: CardList")
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const handleDeleteTask = (taskID, title) => {
    if (sortedTasks[title] && sortedTasks[title].length === 1) {
      alert("last task, can't delete");
      return false
    } else {
      const tmpSortedTasks = { ...sortedTasks };
      tmpSortedTasks[title] = sortedTasks[title].filter(t => t.SK !== taskID);
      setSortedTasks(tmpSortedTasks);
      return true
    }
  }

  var cards = Object.keys(sortedTasks).map(function (key) {
    return <Card key={key} title={key} tasks={sortedTasks[key]} setSortedTasks={setSortedTasks} sortedTasks={sortedTasks} handleDeleteTask={handleDeleteTask} />
  });

  const handleNewCard = () => {
    let tmpSortedTasks = { ...sortedTasks };
    const tmpName = createRandomString(9);
    const newCardDefaultTask = {
      "CreatedDate": Date.now(),
      "SK": "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": "b#12345",
      "ExpiryDate": "nil",
      "Description": "new task...",
      "CompletedDate": "nil",
      "PK": "u#365202d4-0091-708b-eafe-0027f8ef9007",
      "Category": tmpName,
      "EntityType": "Task"
    }
    tmpSortedTasks[tmpName] = [newCardDefaultTask];
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
