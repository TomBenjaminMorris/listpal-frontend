import { memo } from 'react';
import { updateBoardCategoryOrder } from '../utils/apiGatewayClient';
import { getBoardIdFromUrl } from '../utils/utils';
import closeIcon from '../assets/icons8-delete-48.png';
import moveIcon from '../assets/icons8-arrow-50.png';
import "./DropdownMenu.css";

const DropdownMenu = memo(({ handleDeleteCategory, boards, title, setSortedTasks, sortedTasks, setBoards, setConfirmConf }) => {

  const boardID = getBoardIdFromUrl();

  const moveArrayElement = (array, element, delta) => {
    const index = array.indexOf(element);
    const newIndex = index + delta;
    if (index === -1 || newIndex < 0 || newIndex >= array.length) return array;
    const newArray = [...array];
    const [moved] = newArray.splice(index, 1);
    newArray.splice(newIndex, 0, moved);
    return newArray;
  };

  const updateCategoryOrder = (direction) => {
    // Move within the categories actually on screen, as the saved order can hold stale or missing names
    const newCategoryOrder = moveArrayElement(Object.keys(sortedTasks), title, direction);
    const updatedBoards = boards.map(board => {
      if (board.SK !== boardID) return board;
      const updatedBoard = { ...board, CategoryOrder: newCategoryOrder };
      updateBoardCategoryOrder(boardID, JSON.stringify(newCategoryOrder));
      return updatedBoard;
    });

    setBoards(updatedBoards);
    // Pass the new order explicitly: the active board in App is only updated after this render
    setSortedTasks(sortedTasks, newCategoryOrder);
  };

  return (
    <div className="dropdown-menu fadeIn-animation">
      <ul>
        <li onClick={() => updateCategoryOrder(-1)}>
          <img className="dropdown-icons rotate-back" src={moveIcon} alt="up icon" />
          Move Category Up
        </li>
        <li onClick={() => updateCategoryOrder(1)}>
          <img className="dropdown-icons rotate" src={moveIcon} alt="down icon" />
          Move Category Down
        </li>
        <li onClick={() => setConfirmConf({
          display: true,
          title: "Delete Category?",
          textValue: "🚨 This action can't be undone 🚨",
          callbackFunc: handleDeleteCategory,
        })}>
          <img className="dropdown-icons" src={closeIcon} alt="delete icon" />
          Delete Category
        </li>
      </ul>
    </div>
  );
});

export default DropdownMenu;
