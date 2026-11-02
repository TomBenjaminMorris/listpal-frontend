import { memo } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { isUrlValid } from '../utils/utils';
import { queueUpdate } from '../utils/syncEngine';
import { AlertIcon, CopyIcon, PencilIcon, PlusIcon, SparklesIcon, TrashIcon } from './Icons';
import "./DropdownMenu.css";
import "./TaskMenu.css";

// rewordTask is null when the task can't be reworded (ticked, blank or too long), which hides the item
const TaskMenu = memo(({ containerRef, onClose, markAsImportant, duplicateTask, rewordTask, deleteAndHideTask, isImportant, task, setTaskFields, setPromptConf, setAlertConf }) => {
  // Here rather than in Task, so only an open menu listens for outside clicks, not every task on the board
  useOnClickOutside(containerRef, onClose);

  const handleAddLink = (enteredLink) => {
    if (enteredLink === null) return;

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

  const linkAction = task.Link ? (
    <li onClick={handleEditLink}>
      <PencilIcon />
      Edit link
    </li>
  ) : (
    <li onClick={handleAddLinkPrompt}>
      <PlusIcon />
      Add link
    </li>
  );

  return (
    <div className="task-dropdown-menu fadeIn-animation">
      <ul>
        <li onClick={markAsImportant}>
          <AlertIcon />
          {`${isImportant ? "Unmark" : "Mark"} as important`}
        </li>
        {linkAction}
        <li onClick={duplicateTask}>
          <CopyIcon />
          Duplicate
        </li>
        {rewordTask && (
          <li onClick={rewordTask}>
            <SparklesIcon />
            Reword
          </li>
        )}
        <li className="menu-danger" onClick={deleteAndHideTask}>
          <TrashIcon />
          Delete
        </li>
      </ul>
    </div>
  );
});

export default TaskMenu;
