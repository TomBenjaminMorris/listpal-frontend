import { useEffect, CSSProperties } from 'react';
import ThemeSetter from './ThemeSetter';
import PulseLoader from "react-spinners/PulseLoader";
import './Settings.css';

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const Settings = ({ userDetails, setUserDetails, sidebarIsOpen, isLoading }) => {
  // console.log("rendering: Settings")
  useEffect(() => {
    document.title = "ListPal | Settings";
  }, [])

  const content = (
    <>
      <div className={`settings-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        <div className="settings-content-sub-wrapper fadeUp-animation">
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
