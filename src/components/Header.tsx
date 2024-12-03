import './Header.css'
import menuIcon from '../assets/icons8-menu-50.png';
import { Link } from 'react-router-dom';

const Header = ({ sidebarIsOpen, setHideMobileSidebar, setSidebarIsOpen, isMobile }) => {
  // console.log("rendering: Header")
  const handleMenuClick = async () => {
    setHideMobileSidebar(current => !current);
    setSidebarIsOpen(current => !current);
  }

  return (
    <div className="header sticky">
      <div className="header-left">
        {isMobile && <div className="toggle-wrapper">
          <img className="menu-icon-mobile" src={menuIcon} alt="menu icon" onClick={handleMenuClick} />
        </div>}
      </div>
      <div className="header-right">

        <Link to="/home" >
          <div className="logo-text-wrapper" style={{ marginLeft: `${sidebarIsOpen ? "260px" : "90px"}` }}>
            <div className="logo-text-1">List</div><div className="logo-text-2">Pal</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Header;
