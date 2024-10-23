import { useRef } from 'react'
import { useOnClickOutside } from 'usehooks-ts'
import closeIcon from '../assets/icons8-close-50-white.png';
import moveIcon from '../assets/icons8-arrow-50.png';
import "./DropdownMenu.css";

const DropdownMenu = ({handleDeleteCategory, setDropdownVisible}) => {
  const ref = useRef(null)
  
  const handleClickOutside = () => {
    setDropdownVisible(false)
  }
  
  useOnClickOutside(ref, handleClickOutside)
  
  return (
    <div className="dropdown-menu" ref={ref}>
      <ul>
        <li onClick={() => alert("move up")}>
          <img className="dropdown-icons rotate-back" src={moveIcon} alt="up icon"/>
          Move Up
        </li>
        <li onClick={() => alert("move down")}>
          <img className="dropdown-icons rotate" src={moveIcon} alt="down icon"/>
          Move Down
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
