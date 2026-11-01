import { memo } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { updateCategoryOrder as saveCategoryOrder } from '../utils/utils';
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from './Icons';
import "./DropdownMenu.css";

const DropdownMenu = memo(({ containerRef, onClose, handleDeleteCategory, title, setSortedTasks, sortedTasks, setBoards, setConfirmConf }) => {
  // Here rather than in Card, so only an open menu listens for outside clicks
  useOnClickOutside(containerRef, onClose);

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
    saveCategoryOrder(newCategoryOrder, setBoards);
    // Pass the new order explicitly: the active board in App is only updated after this render
    setSortedTasks(sortedTasks, newCategoryOrder);
  };

  return (
    <div className="dropdown-menu fadeIn-animation">
      <ul>
        <li onClick={() => updateCategoryOrder(-1)}>
          <ArrowUpIcon />
          Move up
        </li>
        <li onClick={() => updateCategoryOrder(1)}>
          <ArrowDownIcon />
          Move down
        </li>
        <li className="menu-danger" onClick={() => setConfirmConf({
          display: true,
          title: "Delete this category?",
          textValue: "🚨 No take-backs: this can't be undone 🚨",
          callbackFunc: handleDeleteCategory,
        })}>
          <TrashIcon />
          Delete
        </li>
      </ul>
    </div>
  );
});

export default DropdownMenu;
