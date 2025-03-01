import { Link, useNavigate } from 'react-router-dom';
import menuIcon from '../assets/icons8-menu-50.png';
import sidebarIcon from '../assets/icons8-sidebar-96.png';
import homeIcon from '../assets/icons8-home-48.png';
import aiIcon from '../assets/icons8-ai-96.png';
import settingsIcon from '../assets/icons8-settings-50-white.png';
import listsIcon from '../assets/icons8-todo-list-50.png';
import rightIcon from '../assets/icons8-right-arrow-64.png';
import logoutIcon from '../assets/icons8-logout-48.png';
import statsIcon from '../assets/icons8-graph-48.png';
import './SideNavBar.css';

const SideNavBar = ({ 
  sidebarIsOpen, 
  handleSidebarCollapse, 
  boards, 
  setSidebarBoardsMenuIsOpen, 
  sidebarBoardsMenuIsOpen, 
  isMobile, 
  hideMobileSidebar, 
  setIsLoading, 
  setActiveBoard, 
  activeBoard 
}) => {
  const navigate = useNavigate();

  const handleBoardClick = (board) => {
    setActiveBoard(board)
    setIsLoading(true);
  };

  const handleBoardsMenuClick = () => {
    if (!sidebarIsOpen && activeBoard) {
      navigate(`/board/${activeBoard.SK}`);
      return;
    }
    setSidebarBoardsMenuIsOpen(current => !current);
  };

  const maxLength = 14;

  const boardsRendered = boards.map(board => (
    <div key={board.SK} className={activeBoard?.SK === board.SK ? "highlight-board-link" : ""}>
      <Link
        to={`/board/${board.SK}`}
        className={`sidenav-boards-link-item ${activeBoard?.SK === board.SK ? "highlight-board-link-text" : ""}`}
        onClick={() => handleBoardClick(board)}
      >
        <div>{board.Emoji}</div>
        <div>{board.Board.length > maxLength ? `${board.Board.substring(0, maxLength)}...` : board.Board}</div>
      </Link>
    </div>
  ));

  const navLinkClass = `sidenav-link ${sidebarIsOpen ? "open" : "collapsed"}`;
  const textClass = sidebarIsOpen ? "sidenav-link-text" : "hidden";

  return (
    <div className={`sidebar-wrapper ${!isMobile ? "fadeInPure-animation" : ""}`} style={{
      width: sidebarIsOpen ? "250px" : "80px", display: isMobile && hideMobileSidebar ? "none" : "flex"
    }} >

      <div className="toggle-wrapper">
        <img
          className={sidebarIsOpen ? "sidebar-icon" : "menu-icon"}
          src={sidebarIsOpen ? sidebarIcon : menuIcon}
          alt="menu icon"
          onClick={handleSidebarCollapse}
        />
      </div>

      <div className="sidenav-links-wrapper">
        <Link className={navLinkClass} to="/home">
          <img src={homeIcon} alt="home" />
          <div className={textClass}>Home</div>
        </Link>

        <Link className={navLinkClass} to="/weekly-roundups">
          <img src={aiIcon} alt="ai" />
          <div className={textClass}>Weekly Roundups</div>
        </Link>

        <Link className={navLinkClass} to="/stats">
          <img src={statsIcon} alt="stats" />
          <div className={textClass}>Stats</div>
        </Link>

        <div className={`sidenav-link-boards ${sidebarIsOpen ? "open" : "collapsed"}`} onClick={handleBoardsMenuClick}>
          <img src={listsIcon} alt="boards" />
          <div className={textClass}>Boards</div>
          <img
            className={`sidenav-board-link-arrow ${sidebarBoardsMenuIsOpen ? "rotate" : ""} ${textClass}`}
            src={rightIcon}
            alt="expand"
          />
        </div>

        <div className={`sidenav-link-boards-sub ${textClass} ${sidebarBoardsMenuIsOpen ? "sidenav-link-text" : "hidden"}`}>
          {boardsRendered}
        </div>
      </div>

      <Link to="/logout" className={`sidenav-user sidenav-link sidenav-logout ${navLinkClass}`}>
        <img src={logoutIcon} alt="logout" />
        <div className={textClass}>Log Out</div>
      </Link>

      <Link className={navLinkClass} to="/settings">
        <img src={settingsIcon} alt="settings" />
        <div className={textClass}>Settings</div>
      </Link>
    </div>
  );
};

export default SideNavBar;
