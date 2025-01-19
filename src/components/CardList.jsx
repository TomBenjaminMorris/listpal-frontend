import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBoardIdFromUrl, getSortArray, updateCategoryOrder } from '../utils/utils';
import { newTask, deleteTask, updateTaskDescription } from '../utils/apiGatewayClient';
import Card from './Card';
import './CardList.css'

const CardList = ({ sortedTasks, setSortedTasks, setBoards, boards, setPromptConf, setConfirmConf, setAlertConf }) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const showAlert = (textValue) => {
    setAlertConf({
      display: true,
      title: "Notice ⚠️",
      textValue,
      animate: false
    });
  };

  const handleDeleteTask = (taskID, title) => {
    const tasks = sortedTasks[title];
    const uncheckedTasks = tasks.filter(t => t.CompletedDate === "nil");
    const isLastUncheckedTask = uncheckedTasks.length === 1 && uncheckedTasks[0].SK === taskID;

    if (isLastUncheckedTask) {
      const task = tasks.find(t => t.SK === taskID);
      if (!task.Description) {
        showAlert("The last task cannot be removed...");
        return;
      }

      updateTaskDescription(taskID, "");
      setSortedTasks({
        ...sortedTasks,
        [title]: tasks.map(t => t.SK === taskID ? { ...t, Description: "" } : t)
      });
      return;
    }

    deleteTask(taskID);
    setSortedTasks({
      ...sortedTasks,
      [title]: tasks.filter(t => t.SK !== taskID)
    });
  };

  const handleNewCard = (name) => {
    if (!name || Object.keys(sortedTasks).includes(name)) {
      showAlert(name ? "That category already exists on this board, chose another..." : "Category name can't be empty...");
      return;
    }

    const boardID = getBoardIdFromUrl();
    const newCardDefaultTask = {
      CreatedDate: String(Date.now()),
      SK: "t#" + uuidv4(),
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
      ExpiryDate: "nil",
      Description: "",
      CompletedDate: "nil",
      Category: name,
      EntityType: "Task",
      Emoji: "✅",
    };

    const sortArr = [name, ...getSortArray(boards)];
    newTask(
      newCardDefaultTask.SK,
      newCardDefaultTask.CreatedDate,
      newCardDefaultTask.CompletedDate,
      newCardDefaultTask.ExpiryDate,
      newCardDefaultTask["GSI1-PK"],
      newCardDefaultTask.Description,
      newCardDefaultTask.Category,
      "",
      newCardDefaultTask.Emoji
    ).then(() => updateCategoryOrder(sortArr, boards, setBoards));

    setSortedTasks({
      ...sortedTasks,
      [name]: [newCardDefaultTask]
    });
    forceUpdate();
  };

  return (
    <div className="card-list-container">
      {Object.entries(sortedTasks).map(([key]) => (
        <Card
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
      ))}
      {sortedTasks && (
        <div
          id="addCardButton"
          className="fadeUp-animation"
          onClick={() => setPromptConf({
            display: true,
            isEdit: false,
            defaultText: "",
            title: "Enter New Category Name...",
            callbackFunc: handleNewCard,
          })}
        >
          +
        </div>
      )}
    </div>
  );
};

export default CardList;
