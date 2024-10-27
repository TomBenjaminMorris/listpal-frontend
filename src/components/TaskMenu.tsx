import importantIcon from '../assets/icons8-important-30-white.png';
import deleteIcon from '../assets/icons8-delete-48.png';
import linkIcon from '../assets/icons8-link-64.png';
import plusIcon from '../assets/icons8-plus-30.png';
import editIcon from '../assets/icons8-edit-48.png';
import { updateTaskDetails } from '../utils/apiGatewayClient';
import { isUrlValid } from '../utils/utils';
import "./TaskMenu.css";

const TaskMenu = ({ markAsImportant, deleteAndHideTask, isImportant, task, setSortedTasks, sortedTasks }) => {

  const handleAddLink = (e) => {
    let enteredLink = prompt("Enter Link", task.Link)
    if (enteredLink === null) {
      return;
    }
    if (!enteredLink || enteredLink == "") {
      alert("Name can't be empty");
      return;
    }
    if (!isUrlValid(enteredLink)) {
      alert("URL is not valid")
      return
    }

    if (!enteredLink.startsWith("https://")) {
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
      {/* <a href={task.Link} target="_blank" rel="noreferrer">
        <li className="task-dropdown-li">
          <img className="task-dropdown-icons" src={linkIcon} alt="down icon" />
          Follow Link
        </li>
      </a> */}
      <li className="task-dropdown-li" onClick={handleAddLink}>
        <img className="task-dropdown-icons" src={editIcon} alt="down icon" />
        Edit Link
      </li>
    </>
  )

  const withoutLink = (
    <>
      <li className="task-dropdown-li" onClick={handleAddLink}>
        <img className="task-dropdown-icons" src={plusIcon} alt="down icon" />
        Add Link
      </li>
    </>
  )
  return (
    <div className="task-dropdown-menu" style={isImportant ? { marginLeft: "-218px" } : null}>
      <ul>
        <li className="task-dropdown-li" onClick={markAsImportant}>
          <img className="task-dropdown-icons" src={importantIcon} alt="up icon" />
          {`${isImportant ? "Unmark" : "Mark"} as Important`}
        </li>
        {task.Link === undefined ? withoutLink : withLink}
        <li className="task-dropdown-li" onClick={deleteAndHideTask}>
          <img className="task-dropdown-icons" src={deleteIcon} alt="down icon" />
          Delete Task
        </li>
      </ul>
    </div>
  );
};

export default TaskMenu;
