import { memo } from 'react';
import { isUrlValid } from '../utils/utils';
import { updateTaskDetails } from '../utils/apiGatewayClient';
import importantIcon from '../assets/icons8-important-30-white.png';
import deleteIcon from '../assets/icons8-delete-48.png';
import plusIcon from '../assets/icons8-plus-30.png';
import editIcon from '../assets/icons8-edit-48.png';
import "./TaskMenu.css";

const TaskMenu = memo(({ markAsImportant, deleteAndHideTask, isImportant, task, setSortedTasks, sortedTasks, setPromptConf, setConfirmConf, setAlertConf }) => {

  const handleAddLink = (enteredLink) => {
    if (enteredLink === null) return;

    // Validate URL
    if (enteredLink !== "" && !isUrlValid(enteredLink)) {
      setAlertConf({
        display: true,
        title: "Notice ⚠️",
        textValue: "URL is not valid.",
      });
      return;
    }

    if (enteredLink !== "" && !enteredLink.startsWith("https://")) {
      enteredLink = "https://".concat(enteredLink);
    }

    // Update task details
    updateTaskDetails(task.SK, task.CompletedDate, task.ExpiryDate, task["GSI1-SK"], task.ExpiryDateTTL || 0, enteredLink).then(() => {
      const tmpSortedTasks = { ...sortedTasks };
      tmpSortedTasks[task.Category] = tmpSortedTasks[task.Category].map(t => {
        if (t.SK === task.SK) {
          t.Link = enteredLink;
        }
        return t;
      });
      setSortedTasks(tmpSortedTasks);
    });
  };

  const handleEditLink = () => {
    setPromptConf({
      display: true,
      isEdit: true,
      defaultText: task.Link,
      title: "Enter Link...",
      callbackFunc: handleAddLink,
    });
  };

  const handleAddLinkPrompt = () => {
    setPromptConf({
      display: true,
      isEdit: false,
      defaultText: "",
      title: "Enter Link...",
      callbackFunc: handleAddLink,
    });
  };

  const handleDeleteTask = () => {
    setConfirmConf({
      display: true,
      title: "Delete Task?",
      textValue: "🚨 This action can't be undone 🚨",
      callbackFunc: deleteAndHideTask,
    });
  };

  const linkAction = task.Link ? (
    <li className="task-dropdown-li" onClick={handleEditLink}>
      <img className="task-dropdown-icons" src={editIcon} alt="Edit Link" />
      Edit Link
    </li>
  ) : (
    <li className="task-dropdown-li" onClick={handleAddLinkPrompt}>
      <img className="task-dropdown-icons" src={plusIcon} alt="Add Link" />
      Add Link
    </li>
  );

  return (
    <div className={`task-dropdown-menu fadeIn-animation ${isImportant ? 'important-menu' : ''}`}>
      <ul>
        <li className="task-dropdown-li" onClick={markAsImportant}>
          <img className="task-dropdown-icons" src={importantIcon} alt="Important Icon" />
          {`${isImportant ? "Unmark" : "Mark"} as Important`}
        </li>
        {linkAction}
        <li className="task-dropdown-li" onClick={handleDeleteTask}>
          <img className="task-dropdown-icons" src={deleteIcon} alt="Delete Icon" />
          Delete Task
        </li>
      </ul>
    </div>
  );
});

export default TaskMenu;
