import { useOnClickOutside } from 'usehooks-ts';
import "./DropdownMenu.css";

// The board header's actions on a phone, where they and the name won't fit on one line as separate buttons.
// Board.jsx defines the actions, shared with its desktop buttons.
const BoardMenu = ({ containerRef, onClose, actions }) => {
  // Here rather than in Board, so only an open menu listens for outside clicks
  useOnClickOutside(containerRef, onClose);

  // Each choice opens a modal, which shouldn't have the menu left open behind it
  const choose = (action) => () => {
    onClose();
    action.onClick();
  };

  return (
    <div className="popup-menu board-dropdown-menu fadeIn-animation">
      <ul>
        {actions.map(action => (
          <li key={action.label} className={action.danger ? "menu-danger" : undefined} onClick={choose(action)}>
            {action.icon}
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BoardMenu;
