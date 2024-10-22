
import React from "react";
import deleteIcon from '../assets/icons8-delete-48.png';
import editIcon from '../assets/icons8-edit-64.png';
import clearIcon from '../assets/icons8-clear-60.png';
import "./DropdownMenu.css";

const DropdownMenu = () => {

  
  return (
    <div className="dropdown-menu">
      <ul>
        <li>
          <img className="delete-icon" src={deleteIcon} alt="delete icon"  />
        </li>
        <li>
          <img className="edit-icon" src={editIcon} alt="edit icon"/>
        </li>
        <li>
          <img className="clear-icon" src={clearIcon} alt="clear icon" />
        </li>
      </ul>
    </div>
  );
};

export default DropdownMenu;
