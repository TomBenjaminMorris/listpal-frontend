import { memo } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { isUrlValid } from '../utils/utils';
import { queueUpdate } from '../utils/syncEngine';
import importantIcon from '../assets/icons8-important-30-white.png';
import deleteIcon from '../assets/icons8-delete-48.png';
import plusIcon from '../assets/icons8-plus-30.png';
import editIcon from '../assets/icons8-edit-48.png';
import "./TaskMenu.css";

const TaskMenu = memo(({ containerRef, onClose, markAsImportant, deleteAndHideTask, isImportant, task, setTaskFields, setPromptConf, setConfirmConf, setAlertConf }) => {
  // Here rather than in Task, so only an open menu listens for outside clicks, not every task on the board
  useOnClickOutside(containerRef, onClose);

  const handleAddLink = (enteredLink) => {
    if (enteredLink === null) return;

    // Validate URL
    if (enteredLink !== "" && !isUrlValid(enteredLink)) {
      setAlertConf({
        display: true,
        title: "That link looks a bit off 🔗",
        textValue: "We couldn't make sense of that web address. Check for typos and try again.",
      });
      return;
    }

    if (enteredLink !== "" && !enteredLink.startsWith("https://")) {
      enteredLink = "https://".concat(enteredLink);
    }

    queueUpdate(task.SK, task["GSI1-PK"], { Link: enteredLink });
    setTaskFields(task.SK, { Link: enteredLink });
  };

  const handleEditLink = () => {
    setPromptConf({
      display: true,
      isEdit: true,
      defaultText: task.Link,
      title: "Update this task's link 🔗",
      callbackFunc: handleAddLink,
    });
  };

  const handleAddLinkPrompt = () => {
    setPromptConf({
      display: true,
      isEdit: false,
      defaultText: "",
      title: "Paste a link for this task 🔗",
      callbackFunc: handleAddLink,
    });
  };

  const handleDeleteTask = () => {
    setConfirmConf({
      display: true,
      title: "Delete this task?",
      textValue: "🚨 No take-backs: this can't be undone 🚨",
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
