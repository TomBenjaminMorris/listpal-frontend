import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import menuIcon from '../assets/icons8-menu-50.png';
import './Header.css';

const Header = memo(({ setHideMobileSidebar, setSidebarIsOpen, isMobile }) => {
  const handleMenuClick = useCallback(() => {
    setHideMobileSidebar(prev => !prev);
    setSidebarIsOpen(prev => !prev);
  }, [setHideMobileSidebar, setSidebarIsOpen]);

  return (
    <header className="header sticky fadeInPure-animation">
      {isMobile && (
        <div className="header-left">
          <button className="toggle-wrapper" onClick={handleMenuClick} aria-label="Toggle mobile sidebar">
            <img className="menu-icon-mobile" src={menuIcon} alt="" />
          </button>
        </div>
      )}

      <Link to="/home" className="header-right">
        <div className="logo-text-wrapper">
          <span className="logo-text-1">List</span>
          <span className="logo-text-2">Pal</span>
        </div>
      </Link>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
