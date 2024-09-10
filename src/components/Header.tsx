import './Header.css'
import settingsIcon from '../assets/icons8-settings-50-white.png';
import { Link } from 'react-router-dom';

const Header = ({ handleLogout, sidebarIsOpen }) => {
  // console.log("rendering: Header")

  return (
    <div className="header sticky">
      <div className="header-left">
        <Link className="back-button board-back-button " to="/home" >
          <div className="logo-text-wrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}` }}>
            <div className="logo-text-1">List</div><div className="logo-text-2">Pal</div>
          </div>
        </Link>
      </div>
      {/* <div className="header-left">
      </div> */}
      <div className="header-right">
        <a className="logout-button" onClick={handleLogout}>Logout</a>
      </div>
    </div>
  );
};

export default Header;
