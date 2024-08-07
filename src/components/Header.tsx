import './Header.css'

const Header = ({ handleLogout }) => {
  // console.log("rendering: Header")

  return (
    <div className="header">
      <div className="header-right">
        <a onClick={handleLogout}>Logout</a>
      </div>
    </div>
  );
};

export default Header;
