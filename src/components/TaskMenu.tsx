import importantIcon from '../assets/icons8-important-30-white.png';
import deleteIcon from '../assets/icons8-delete-48.png';
import plusIcon from '../assets/icons8-plus-30.png';
import editIcon from '../assets/icons8-edit-48.png';
import { updateTaskDetails } from '../utils/apiGatewayClient';
import { isUrlValid } from '../utils/utils';
import "./TaskMenu.css";

const TaskMenu = ({ markAsImportant, deleteAndHideTask, isImportant, task, setSortedTasks, sortedTasks, setPromptConf, setConfirmConf }) => {

  const handleAddLink = (enteredLink) => {
    if (enteredLink === null) {
      return;
    }
    if (!isUrlValid(enteredLink) && enteredLink != "") {
      alert("URL is not valid")
      return
    }

    if (!enteredLink.startsWith("https://") && enteredLink != "") {
      enteredLink = "https://".concat(enteredLink)
    }

    updateTaskDetails(task.SK, task.CompletedDate, task.ExpiryDate, task["GSI1-SK"], task.ExpiryDateTTL || 0, enteredLink).then(() => {
      const tmpSortedTasks = { ...sortedTasks };
      tmpSortedTasks[task.Category] = tmpSortedTasks[task.Category].map(t => {
        if (t.SK === task.SK) {
          t.Link = enteredLink
        }
        return t;
      });
      setSortedTasks(tmpSortedTasks)
    })
  }

  const withLink = (
    <>
      <li className="task-dropdown-li" onClick={() => setPromptConf({
        display: true,
        isEdit: true,
        defaultText: task.Link,
        title: "Enter Link...",
        callbackFunc: handleAddLink,
      })}>
        <img className="task-dropdown-icons" src={editIcon} alt="down icon" />
        Edit Link
      </li>
    </>
  )

  const withoutLink = (
    <>
      <li className="task-dropdown-li" onClick={() => setPromptConf({
        display: true,
        isEdit: false,
        defaultText: "",
        title: "Enter Link...",
        callbackFunc: handleAddLink,
      })}>
        <img className="task-dropdown-icons" src={plusIcon} alt="down icon" />
        Add Link
      </li>
    </>
  )

  return (
    <div className="task-dropdown-menu fadeIn-animation" style={isImportant ? { marginLeft: "-220px" } : null}>
      <ul>
        <li className="task-dropdown-li" onClick={markAsImportant}>
          <img className="task-dropdown-icons" src={importantIcon} alt="up icon" />
          {`${isImportant ? "Unmark" : "Mark"} as Important`}
        </li>
        {task.Link === undefined || task.Link === "" ? withoutLink : withLink}
        <li className="task-dropdown-li" onClick={() => setConfirmConf({
          display: true,
          title: "Delete Task?",
          textValue: "🚨 This action can't be undone 🚨",
          callbackFunc: deleteAndHideTask,
        })}>
          <img className="task-dropdown-icons" src={deleteIcon} alt="down icon" />
          Delete Task
        </li>
      </ul>
    </div>
  );
};

export default TaskMenu;
