import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BoardsIcon, CheckIcon, HomeIcon, SettingsIcon } from './Icons';
import './BottomNavBar.css';

// emoji-mart's picker keeps its search field in a shadow root, so focus inside it lands on the host element
const TEXT_FIELD = 'textarea, input:not([type]), input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], [contenteditable="true"], em-emoji-picker';

// A drag further than this, or a flick faster than this, closes the sheet. Anything less springs back.
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.5; // px per ms

const isTextField = (element) => element instanceof Element && element.matches(TEXT_FIELD);

// The bar would otherwise sit on top of the on-screen keyboard, or ride up above it in iOS Safari
const useTextFieldFocused = () => {
  const [focused, setFocused] = useState(() => isTextField(document.activeElement));

  useEffect(() => {
    const handleFocusIn = (e) => setFocused(isTextField(e.target));
    // relatedTarget is where focus is going, so moving from one field to the next doesn't flash the bar back in
    const handleFocusOut = (e) => setFocused(isTextField(e.relatedTarget));
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return focused;
};

// Pointer capture keeps the drag going when the finger leaves the handle, and works for a mouse too
const useDragToDismiss = (onDismiss) => {
  const [offset, setOffset] = useState(0);
  const drag = useRef(null);

  const onPointerDown = (e) => {
    drag.current = { startY: e.clientY, lastY: e.clientY, lastTime: e.timeStamp, velocity: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const current = drag.current;
    if (!current) return;
    const elapsed = e.timeStamp - current.lastTime;
    if (elapsed > 0) current.velocity = (e.clientY - current.lastY) / elapsed;
    current.lastY = e.clientY;
    current.lastTime = e.timeStamp;
    setOffset(Math.max(0, e.clientY - current.startY));
  };

  const onPointerUp = () => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (current.lastY - current.startY > DISMISS_DISTANCE || current.velocity > DISMISS_VELOCITY) onDismiss();
    setOffset(0);
  };

  return { offset, dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
};

const NavTab = ({ to, label, icon, isActive, onClick }) => (
  <Link
    to={to}
    className={`bottomnav-tab ${isActive ? "bottomnav-tab-active" : ""}`}
    aria-label={label}
    aria-current={isActive ? "page" : undefined}
    onClick={onClick}
  >
    <span className="bottomnav-pill">{icon}</span>
  </Link>
);

const BottomNavBar = ({ boards, placeholderBoardCount, setActiveBoardID, activeBoard }) => {
  const { pathname } = useLocation();
  const onBoardPage = pathname.startsWith('/board/');
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const textFieldFocused = useTextFieldFocused();
  const closeSheet = useCallback(() => setSheetIsOpen(false), []);
  const { offset, dragHandlers } = useDragToDismiss(closeSheet);

  // Brings what sits above the bar (the sync indicator, the bottom fade) down to the edge while it's away. Cleared on
  // unmount too, as widening the window past mobile swaps the bar out mid-edit.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-bottom-nav-hidden', textFieldFocused);
    return () => document.documentElement.removeAttribute('data-bottom-nav-hidden');
  }, [textFieldFocused]);

  // Covers the back button too, which would otherwise leave the sheet open over the new page
  useEffect(() => {
    setSheetIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetIsOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSheetIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sheetIsOpen]);

  // Board shows its own loader on a board change; setting it here would never clear when re-picking the current board
  const handleBoardClick = (board) => {
    setActiveBoardID(board.SK);
    closeSheet();
  };

  const boardsRendered = boards.map(board => {
    const isCurrent = onBoardPage && activeBoard?.SK === board.SK;
    return (
      <Link
        key={board.SK}
        to={`/board/${board.SK}`}
        className={`bottomnav-board placeholderReveal-animation ${isCurrent ? "bottomnav-board-active" : ""}`}
        aria-current={isCurrent ? "page" : undefined}
        onClick={() => handleBoardClick(board)}
      >
        <span className="bottomnav-board-emoji">{board.Emoji}</span>
        <span className="bottomnav-board-name">{board.Board}</span>
        {isCurrent && <CheckIcon />}
      </Link>
    );
  });

  const boardPlaceholders = Array.from({ length: placeholderBoardCount }, (_, i) => (
    <div key={i} className="bottomnav-board bottomnav-board-placeholder" aria-hidden="true">
      <div className="placeholder-bar" />
      <div className="placeholder-bar" />
    </div>
  ));

  const sheetContent = placeholderBoardCount
    ? boardPlaceholders
    : boards.length
      ? boardsRendered
      : <p className="bottomnav-sheet-empty">No boards yet. Add one from Home.</p>;

  // Inline only while dragging, so letting go hands the position back to the class and its transition
  const sheetStyle = offset ? { transform: `translateY(${offset}px)`, transition: 'none' } : undefined;

  return (
    <>
      <div className={`bottomnav-scrim ${sheetIsOpen ? "bottomnav-scrim-visible" : ""}`} onClick={closeSheet} />

      <div
        id="bottomnav-sheet"
        className={`bottomnav-sheet ${sheetIsOpen ? "" : "bottomnav-sheet-closed"}`}
        style={sheetStyle}
      >
        <div className="bottomnav-sheet-header" {...dragHandlers}>
          <div className="bottomnav-sheet-handle" />
          <h2 className="bottomnav-sheet-title">Boards</h2>
        </div>
        <div className="bottomnav-sheet-list">
          {sheetContent}
        </div>
      </div>

      <nav className={`bottomnav ${textFieldFocused ? "bottomnav-hidden" : ""}`} aria-label="Main">
        <NavTab to="/home" label="Home" icon={<HomeIcon />} isActive={pathname === '/home' && !sheetIsOpen} onClick={closeSheet} />
        <button
          className={`bottomnav-tab ${onBoardPage || sheetIsOpen ? "bottomnav-tab-active" : ""}`}
          aria-label="Boards"
          aria-expanded={sheetIsOpen}
          aria-controls="bottomnav-sheet"
          onClick={() => setSheetIsOpen(current => !current)}
        >
          <span className="bottomnav-pill"><BoardsIcon /></span>
        </button>
        <NavTab to="/settings" label="Settings" icon={<SettingsIcon />} isActive={pathname === '/settings' && !sheetIsOpen} onClick={closeSheet} />
      </nav>
    </>
  );
};

export default BottomNavBar;
