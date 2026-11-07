import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BoardsIcon, ChevronIcon, HomeIcon, LogoMark, PanelIcon, SettingsIcon } from './Icons';
import './SideNavBar.css';

const SideNavLink = ({ to, label, icon, isActive }) => (
  <Link
    to={to}
    className={`sidenav-row ${isActive ? "sidenav-row-active" : ""}`}
    data-tooltip={label}
    aria-current={isActive ? "page" : undefined}
  >
    {icon}
    <span className="sidenav-label">{label}</span>
  </Link>
);

const SideNavBar = ({
  sidebarIsOpen,
  handleSidebarCollapse,
  boards,
  placeholderBoardCount,
  setSidebarBoardsMenuIsOpen,
  sidebarBoardsMenuIsOpen,
  setActiveBoardID,
  activeBoard
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onBoardPage = pathname.startsWith('/board/');
  const boardsListIsOpen = sidebarIsOpen && sidebarBoardsMenuIsOpen;

  // True only for the render that opens or collapses the sidebar, which is the one that must not animate the list
  const previousSidebarIsOpen = useRef(sidebarIsOpen);
  const sidebarJustToggled = previousSidebarIsOpen.current !== sidebarIsOpen;
  useEffect(() => {
    previousSidebarIsOpen.current = sidebarIsOpen;
  }, [sidebarIsOpen]);

  // Board shows its own loader on a board change; setting it here would never clear when re-clicking the current board
  const handleBoardClick = (board) => {
    setActiveBoardID(board.SK)
  };

  const handleBoardsMenuClick = () => {
    if (sidebarIsOpen) {
      setSidebarBoardsMenuIsOpen(current => !current);
    } else if (activeBoard) {
      navigate(`/board/${activeBoard.SK}`);
    } else {
      // No board to go back to yet, so the rail has nothing to link to until the list is showing
      setSidebarBoardsMenuIsOpen(true);
      handleSidebarCollapse();
    }
  };

  const boardsRendered = boards.map(board => {
    // activeBoard outlives a visit to Home or Settings, where it's still the rail's link back but isn't the current page
    const isCurrent = onBoardPage && activeBoard?.SK === board.SK;
    return (
      <Link
        key={board.SK}
        to={`/board/${board.SK}`}
        className={`sidenav-board placeholderReveal-animation ${isCurrent ? "sidenav-row-active" : ""}`}
        title={board.Board}
        aria-current={isCurrent ? "page" : undefined}
        onClick={() => handleBoardClick(board)}
      >
        <span className="sidenav-board-emoji">{board.Emoji}</span>
        <span className="sidenav-label">{board.Board}</span>
      </Link>
    );
  });

  const boardPlaceholders = Array.from({ length: placeholderBoardCount }, (_, i) => (
    <div key={i} className="sidenav-board sidenav-board-placeholder" aria-hidden="true">
      <div className="placeholder-bar" />
      <div className="placeholder-bar" />
    </div>
  ));

  const sidebarClass = `sidebar-wrapper sidebar-fade-in ${sidebarIsOpen ? "sidebar-open" : "sidebar-collapsed"}`;
  const toggleLabel = sidebarIsOpen ? "Collapse sidebar" : "Expand sidebar";

  return (
    <nav className={sidebarClass} aria-label="Main">
      <div className="sidenav-header">
        <Link className="sidenav-brand" to="/home">
          <LogoMark />
          <span>ListPal</span>
        </Link>
        <button
          className="sidenav-row sidenav-toggle"
          data-tooltip={toggleLabel}
          aria-label={toggleLabel}
          aria-expanded={sidebarIsOpen}
          onClick={handleSidebarCollapse}
        >
          <PanelIcon />
        </button>
      </div>

      <div className="sidenav-links-wrapper">
        <SideNavLink to="/home" label="Home" icon={<HomeIcon />} isActive={pathname === '/home'} />

        <button
          className={`sidenav-row ${onBoardPage && !boardsListIsOpen ? "sidenav-row-active" : ""}`}
          data-tooltip="Boards"
          aria-expanded={boardsListIsOpen}
          onClick={handleBoardsMenuClick}
        >
          <BoardsIcon />
          <span className="sidenav-label">Boards</span>
          <ChevronIcon className={`sidenav-chevron ${boardsListIsOpen ? "sidenav-chevron-open" : ""}`} />
        </button>

        <div className={`sidenav-boards ${boardsListIsOpen ? "sidenav-boards-open" : ""} ${sidebarJustToggled ? "sidenav-boards-instant" : ""}`}>
          <div className="sidenav-boards-inner">
            {placeholderBoardCount ? boardPlaceholders : boardsRendered}
          </div>
        </div>
      </div>

      <div className="sidenav-footer">
        <SideNavLink to="/settings" label="Settings" icon={<SettingsIcon />} isActive={pathname === '/settings'} />
      </div>
    </nav>
  );
};

export default SideNavBar;
