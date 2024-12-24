import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBoardIdFromUrl, getSortArray, updateCategoryOrder } from '../utils/utils';
import { newTask, deleteTask, updateTaskDescription } from '../utils/apiGatewayClient';
import Card from './Card';
import './CardList.css'

const CardList = ({ filteredSortedTasks, sortedTasks, setSortedTasks, setBoards, boards, setPromptConf, setConfirmConf, setAlertConf }) => {
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
            setAlertConf({
              display: true,
              title: "Notice ⚠️",
              textValue: "The last task cannot be removed...",
              animate: true
            })
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

  const handleNewCard = (name) => {
    let tmpSortedTasks = { ...sortedTasks };
    if (name === null) {
      return;
    }
    if (!name || name == "") {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "Category name can't be empty...",
      })
      return;
    }
    if (Object.keys(tmpSortedTasks).includes(name)) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "That category already exists on this board, chose another...",
      })
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
      "EntityType": "Task",
      "Emoji": "✅",
    }
    tmpSortedTasks[name] = [newCardDefaultTask];

    newTask(newCardDefaultTask.SK, newCardDefaultTask.CreatedDate, newCardDefaultTask.CompletedDate, newCardDefaultTask.ExpiryDate, newCardDefaultTask['GSI1-PK'], newCardDefaultTask.Description, newCardDefaultTask.Category, "", newCardDefaultTask.Emoji).then(() => {
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
      setPromptConf={setPromptConf}
      setConfirmConf={setConfirmConf}
      setAlertConf={setAlertConf}
    />
  });

  return (
    <div className="card-list-container">
      {cards}
      <div id="addCardButton" className="fadeUp-animation" onClick={() => setPromptConf({
        display: true,
        isEdit: false,
        defaultText: "",
        title: "Enter New Category Name...",
        callbackFunc: handleNewCard,
      })}>+</div>
    </div>
  );
};

export default CardList;
