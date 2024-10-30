import closeIcon from '../assets/icons8-delete-48.png';
import moveIcon from '../assets/icons8-arrow-50.png';
import "./DropdownMenu.css";

const DropdownMenu = ({handleDeleteCategory}) => {

  
  return (
    <div className="dropdown-menu fadeIn-animation">
      <ul>
        <li onClick={() => alert("move up")}>
          <img className="dropdown-icons rotate-back" src={moveIcon} alt="up icon"/>
          Move Category Up
        </li>
        <li onClick={() => alert("move down")}>
          <img className="dropdown-icons rotate" src={moveIcon} alt="down icon"/>
          Move Category Down
        </li>
        <li onClick={handleDeleteCategory}>
          <img className="dropdown-icons" src={closeIcon} alt="delete icon"/>
          Delete Category
        </li>

      </ul>
    </div>
  );
};

export default DropdownMenu;
