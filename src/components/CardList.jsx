import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBoardIdFromUrl, getSortArray, updateCategoryOrder } from '../utils/utils';
import { writeDataToLocalDB, deleteTaskFromLocalDBWrapper, readDataFromLocalDB } from '../utils/localDBHelpers';
import Card from './Card';
import './CardList.css'

const CardList = ({ localDB, sortedTasks, setSortedTasks, setBoards, boards, setPromptConf, setConfirmConf, setAlertConf, setLocalSyncRequired }) => {
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

    // Perform validation against the last task being deleted in a category
    if (isLastUncheckedTask) {
      const task = tasks.find(t => t.SK === taskID);
      if (!task.Description) {
        showAlert("The last task cannot be removed...");
        return;
      }

      // Check if the task has been created since the last sync and update accordingly
      let isCreate = false
      readDataFromLocalDB(localDB, 'tasks', taskID).then(t => {
        isCreate = t.Action == "create"
      }).catch(() => { }).finally(() => {
        writeDataToLocalDB(localDB, "tasks", { ...task, Action: isCreate ? "create" : "update", Description: "" });
        setLocalSyncRequired(true);
      })
      
      setSortedTasks({
        ...sortedTasks,
        [title]: tasks.map(t => t.SK === taskID ? { ...t, Description: "" } : t)
      });
      return;
    }

    // Check if the task has been created since the last sync and update accordingly
    deleteTaskFromLocalDBWrapper(localDB, taskID, setLocalSyncRequired)

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
      PK: "",
      "GSI1-SK": "nil",
      "GSI1-PK": boardID,
      ExpiryDate: "nil",
      Description: "",
      CompletedDate: "nil",
      Category: name,
      EntityType: "Task",
      Emoji: "✅",
      Link: "",
      Important: "false",
      ExpiryDateTTL: 0
    };
    // newTask

    const sortArr = [name, ...getSortArray(boards)];
    updateCategoryOrder(sortArr, boards, setBoards)

    writeDataToLocalDB(localDB, "tasks", { ...newCardDefaultTask, Action: "create" }).then(() => {
      setLocalSyncRequired(true)
    })

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
          localDB={localDB}
          setLocalSyncRequired={setLocalSyncRequired}
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
