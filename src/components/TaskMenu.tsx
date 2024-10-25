import importantIcon from '../assets/icons8-important-30-white.png';
import deleteIcon from '../assets/icons8-delete-48.png';
import linkIcon from '../assets/icons8-link-64.png';
import "./TaskMenu.css";

const TaskMenu = ({markAsImportant, deleteAndHideTask, isImportant}) => {  
  return (
    <div className="task-dropdown-menu" style={ isImportant ? {marginLeft: "-223px"} : null}>
      <ul>
        <li className="task-dropdown-li" onClick={markAsImportant}>
          <img className="task-dropdown-icons" src={importantIcon} alt="up icon"/>
          {`${isImportant ? "Unmark" : "Mark" } as Important`}
        </li>
        <li className="task-dropdown-li" onClick={deleteAndHideTask}>
          <img className="task-dropdown-icons" src={deleteIcon} alt="down icon"/>
          Delete Task
        </li>
        <li className="task-dropdown-li" onClick={() => alert("follow link")}>
          <img className="task-dropdown-icons" src={linkIcon} alt="down icon"/>
          Follow Link
        </li>
      </ul>
    </div>
  );
};

export default TaskMenu;
