import { useEffect, CSSProperties } from 'react';
import './Settings.css';
import TargetSetter from './TargetSetter';
import ThemeSetter from './ThemeSetter';
import SideNavBar from './SideNavBar';
import Header from './Header';
import PulseLoader from "react-spinners/PulseLoader";

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const Settings = ({ handleLogout, userDetails, setUserDetails, sidebarIsOpen, handleSidebarCollapse, boards, setBoards, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isLoading, isMobile, hideMobileSidebar, setHideMobileSidebar, setSidebarIsOpen }) => {
  // console.log("rendering: Settings")
  useEffect(() => {
    document.title = "ListPal | Settings";
  }, [])

  const content = (
    <>
      <Header sidebarIsOpen={sidebarIsOpen} setHideMobileSidebar={setHideMobileSidebar} setSidebarIsOpen={setSidebarIsOpen} isMobile={isMobile} />
      <div className="settings-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse} boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen} setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} isMobile={isMobile} hideMobileSidebar={hideMobileSidebar} />
        <div className="settings-content-sub-wrapper">
          <TargetSetter boards={boards} setBoards={setBoards} title="Set Board Targets" />
          <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
        </div>
      </div>
    </>
  )

  const loader = (
    <div className="loadingWrapper">
      <PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  )

  return (
    <div className="wrapper">
      {isLoading ? loader : content}
    </div >
  );
};

export default Settings
