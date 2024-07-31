import './Header.css'

// Header
const Header = ({ handleLogout }) => {
  console.log("rendering: Header")

  /*eslint-enable*/
  return (
    <div className="header">
      <div className="header-right">
        <a onClick={handleLogout}>Logout</a>
      </div>
    </div>
  );
};

export default Header;
