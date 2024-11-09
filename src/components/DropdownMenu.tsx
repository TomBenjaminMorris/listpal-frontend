import closeIcon from '../assets/icons8-delete-48.png';
import moveIcon from '../assets/icons8-arrow-50.png';
import "./DropdownMenu.css";
import { updateBoardCategoryOrder } from '../utils/apiGatewayClient';
import { getBoardIdFromUrl } from '../utils/utils';

const DropdownMenu = ({ handleDeleteCategory, boards, title, setSortedTasks, sortedTasks, setBoards }) => {
  
  const boardID = getBoardIdFromUrl();

  const move = (array, element, delta) => {
    var index = array.indexOf(element);
    if (index === -1) return;
    var newIndex = index + delta;
    if (newIndex < 0 || newIndex >= array.length) return;
    var [movedElement] = array.splice(index, 1);
    array.splice(newIndex, 0, movedElement);
  };

  const setMovedBoard = (val) => {
    let tmpBoards = [...boards]
    tmpBoards.forEach(b => {
      if (b.SK === boardID) {
        const tmpCategoryOrder = [...b.CategoryOrder]
        move(tmpCategoryOrder, title, val);
        let tmpBoard = b
        tmpBoard['CategoryOrder'] = tmpCategoryOrder;
        localStorage.setItem('activeBoard', JSON.stringify(tmpBoard));
        b['CategoryOrder'] = tmpCategoryOrder
        setSortedTasks(sortedTasks)
        updateBoardCategoryOrder(boardID, JSON.stringify(tmpCategoryOrder));
      }
    });
    setBoards(tmpBoards);
  }

  const handleCategoryMoveUp = () => {
    setMovedBoard(-1)
  }

  const handleCategoryMoveDown = () => {
    setMovedBoard(1)
  }

  return (
    <div className="dropdown-menu fadeIn-animation">
      <ul>
        <li onClick={handleCategoryMoveUp}>
          <img className="dropdown-icons rotate-back" src={moveIcon} alt="up icon" />
          Move Category Up
        </li>
        <li onClick={handleCategoryMoveDown}>
          <img className="dropdown-icons rotate" src={moveIcon} alt="down icon" />
          Move Category Down
        </li>
        <li onClick={handleDeleteCategory}>
          <img className="dropdown-icons" src={closeIcon} alt="delete icon" />
          Delete Category
        </li>
      </ul>
    </div>
  );
};

export default DropdownMenu;
