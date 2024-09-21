import { Link, useNavigate } from 'react-router-dom';
import { parseJwt } from '../utils/utils';
import menuIcon from '../assets/icons8-menu-50.png';
import sidebarIcon from '../assets/icons8-sidebar-96.png';
import homeIcon from '../assets/icons8-home-48.png';
import settingsIcon from '../assets/icons8-settings-50-white.png';
// import statsIcon from '../assets/icons8-graph-48.png';
import listsIcon from '../assets/icons8-todo-list-50.png';
import userIcon from '../assets/icons8-user-48.png';
import rightIcon from '../assets/icons8-right-arrow-64.png';
import logoutIcon from '../assets/icons8-logout-48.png';
import './SideNavBar.css'

const SideNavBar = ({ handleLogout, sidebarIsOpen, handleSidebarCollapse, boards, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isMobile, hideMobileSidebar }) => {
  // console.log("rendering: SideNavBar")
  var idToken = parseJwt(sessionStorage.idToken.toString());
  const navigate = useNavigate();
  const activeBoard = JSON.parse(localStorage.getItem('activeBoard'))

  const boardsRendered = boards.map((b) => {
    return (
      <div key={b.SK} className={`${ activeBoard && activeBoard.SK === b.SK ? "highlight-board-link" : null}`}>
      {/* <div key={b.SK} > */}
        <Link key={b.SK} to={"/board/" + b.SK} onClick={() => localStorage.setItem('activeBoard', JSON.stringify(b))}>{b.Board}</Link>
      </div>
    )
  });

  return (
    <div className="sidebar-wrapper" style={{ width: `${sidebarIsOpen ? "250px" : "80px"}`, display: isMobile && hideMobileSidebar ? "none" : "flex" }}>

      {/* MENU HAMBURGER */}
      <div className="toggle-wrapper">
        <img className={`${sidebarIsOpen ? "sidebar-icon" : "menu-icon"}`} src={sidebarIsOpen ? sidebarIcon : menuIcon} alt="menu icon" onClick={handleSidebarCollapse} />
      </div>

      <div className="sidenav-links-wrapper">
        {/* HOME */}
        <Link className={`sidenav-link ${sidebarIsOpen ? "open" : "collapsed"}`} to="/home" >
          <img src={homeIcon} />
          <div className={`${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`}>Home</div>
        </Link>

        {/* BOARD LINKS */}
        <div className={`sidenav-link-boards ${sidebarIsOpen ? "open" : "collapsed"}`} onClick={() => !sidebarIsOpen ? activeBoard && navigate("/board/" + (activeBoard.SK)) : setSidebarBoardsMenuIsOpen(current => !current)}>
          <img src={listsIcon} />
          <div className={`${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`}>Boards</div>
          <img className={`sidenav-board-link-arrow ${sidebarBoardsMenuIsOpen ? "rotate" : null} ${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`} src={rightIcon} />
        </div>
        <div className={`sidenav-link-boards-sub ${sidebarIsOpen ? "sidenav-link-text" : "hidden"} ${sidebarBoardsMenuIsOpen ? "sidenav-link-text" : "hidden"}`}>
          {boardsRendered}
        </div>

        {/* SETTINGS */}
        <Link className={`sidenav-link ${sidebarIsOpen ? "open" : "collapsed"}`} to="/settings" >
          <img src={settingsIcon} />
          <div className={`${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`}>Settings</div>
        </Link>

        {/* STATS */}
        {/* <Link className={`sidenav-link ${sidebarIsOpen ? "open" : "collapsed"}`} to="/stats" >
          <img src={statsIcon} />
          <div className={`${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`}>Stats</div>
        </Link> */}
      </div>

      {/* LOGOUT */}
      <Link onClick={() => handleLogout()} className={`sidenav-user sidenav-link sidenav-logout ${sidebarIsOpen ? "open" : "collapsed"}`} to="/login" >
        <img src={logoutIcon} />
        <div className={`${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`}>{"Log Out"}</div>
      </Link>

      {/* USER */}
      <Link className={`sidenav-user sidenav-link ${sidebarIsOpen ? "open" : "collapsed"}`} to="/home" >
        <img src={userIcon} />
        <div className={`${sidebarIsOpen ? "sidenav-link-text" : "hidden"}`}>{`${idToken.given_name} ${idToken.family_name}`}</div>
      </Link>
    </div>
  );
};

export default SideNavBar;

// console.log ("Amazon Cognito ID token encoded: " + sessionStorage.idToken.toString());
// console.log ("Amazon Cognito ID token decoded: ");
// console.log ( idToken );
// console.log ("Amazon Cognito access token encoded: " + sessionStorage.accessToken.toString());
// console.log ("Amazon Cognito access token decoded: ");
// console.log ( accessToken );
// console.log ("Amazon Cognito refresh token: ");
// console.log ( sessionStorage.refreshToken );
// var idToken = parseJwt(sessionStorage.idToken.toString());
// var accessToken = parseJwt(sessionStorage.accessToken.toString());
