import './Header.css'
import menuIcon from '../assets/icons8-menu-50.png';
import { Link } from 'react-router-dom';

const Header = ({ sidebarIsOpen, handleSidebarCollapse }) => {
  // console.log("rendering: Header")

  return (
    <div className="header sticky">
      <div className="header-left">
        <div className="toggle-wrapper">
          <img className="menu-icon" src={menuIcon} alt="menu icon" />
        </div>
      </div>
      {/* <div className="header-left">
      </div> */}
      <div className="header-right">
        <Link className="back-button board-back-button " to="/home" >
          <div className="logo-text-wrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}` }}>
            <div className="logo-text-1">List</div><div className="logo-text-2">Pal</div>
          </div>
        </Link>
        {/* <a className="logout-button" onClick={handleLogout}>Logout</a> */}
      </div>
    </div>
  );
};

export default Header;
