import { useEffect, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Settings = ({ handleLogout, userDetails, setUserDetails, sidebarIsOpen, handleSidebarCollapse, boards, setSidebarBoardsMenuIsOpen, sidebarBoardsMenuIsOpen, isLoading }) => {
  // console.log("rendering: Settings")
  useEffect(() => {
    document.title = "ListPal | Settings";
  }, [])

  const content = (
    <>
      <Header sidebarIsOpen={sidebarIsOpen} />
      <div className="settings-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
        <SideNavBar handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse}
          boards={boards} sidebarBoardsMenuIsOpen={sidebarBoardsMenuIsOpen}
          setSidebarBoardsMenuIsOpen={setSidebarBoardsMenuIsOpen} />
        <div className="settings-content-sub-wrapper">
          <TargetSetter userDetails={userDetails} setUserDetails={setUserDetails} title="Set Targets" />
          <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
          {/* <TargetSetter userDetails={userDetails} setUserDetails={setUserDetails} title="Edit Current Scores" /> */}
        </div>
      </div>
    </>
  )

  return (
    <div className="wrapper">
      {isLoading ? <div className="loadingWrapper"><PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
        data-testid="loader"
      /></div> : content}
    </div >
  );
};

export default Settings
