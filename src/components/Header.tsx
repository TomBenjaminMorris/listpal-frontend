import './Header.css'
import settingsIcon from '../assets/icons8-settings-50-white.png';
import { Link } from 'react-router-dom';

const Header = ({ handleLogout }) => {
  // console.log("rendering: Header")

  return (
    <div className="header">
      {/* <div className="header-left">
      </div> */}
      <div className="header-right">
        <Link className="back-button" to="/settings" >
          <img className="settings-icon" src={settingsIcon} alt="settings icon"/>
        </Link>
        <a className="logout-button" onClick={handleLogout}>Logout</a>
      </div>
    </div>
  );
};

export default Header;
