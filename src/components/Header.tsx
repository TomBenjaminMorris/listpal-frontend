import './Header.css'
import settingsIcon from '../assets/icons8-settings-white-50.png';
import { Link } from 'react-router-dom';

const Header = ({ handleLogout }) => {
  // console.log("rendering: Header")

  return (
    <div className="header">
      <div className="header-left">
        <Link className="back-button" to="/settings" >
          <img className="settings-icon" src={settingsIcon} alt="settings icon"/>
        </Link>
      </div>
      <div className="header-right">
        <a onClick={handleLogout}>Logout</a>
      </div>
    </div>
  );
};

export default Header;
