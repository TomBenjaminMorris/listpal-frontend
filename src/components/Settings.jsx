import { memo, useEffect } from 'react';
import ThemeSetter from './ThemeSetter';
import PulseLoader from "react-spinners/PulseLoader";
import './Settings.css';

const LOADER_STYLE = {
  paddingTop: "50px",
  opacity: "0.8",
};

const Loader = memo(() => (
  <div className="loadingWrapper">
    <PulseLoader
      cssOverride={LOADER_STYLE}
      size={12}
      color="var(--text-colour)"
      speedMultiplier={1}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </div>
));

const SettingsContent = memo(({ userDetails, setUserDetails }) => (
  <div className="settings-content-sub-wrapper fadeUp-animation">
    <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
  </div>
));

const Settings = ({
  userDetails,
  setUserDetails,
  sidebarIsOpen,
  isLoading
}) => {
  useEffect(() => {
    document.title = "ListPal | Settings ⚙️";
  }, []);

  return (
    <div className="wrapper">
      <div className={`settings-content-wrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
        {
          isLoading ? <Loader /> : <SettingsContent
            sidebarIsOpen={sidebarIsOpen}
            userDetails={userDetails}
            setUserDetails={setUserDetails}
          />
        }
      </div>
    </div>
  );
};

export default memo(Settings);
