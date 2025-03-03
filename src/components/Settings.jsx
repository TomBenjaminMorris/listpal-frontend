import { memo, useEffect } from 'react';
import ThemeSetter from './ThemeSetter';
import Loader from './Loader';
import settingsIcon from '../assets/icons8-settings-50-white.png';
import './Settings.css';

const SettingsContent = memo(({ userDetails, setUserDetails }) => (
  <div className="settings-content-sub-wrapper fadeUp-animation">
    <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
  </div>
));

const Settings = ({
  userDetails,
  setUserDetails,
  isLoading
}) => {

  useEffect(() => {
    document.title = "ListPal | Settings ⚙️";
  }, []);

  const content = (
    <div className="weekly-reports-content-wrapper">
      <div className="weekly-reports-content-sub-wrapper">
        <div className="weekly-report-title-wrapper fadeUp-animation">
          <h2 className="weekly-report-title">User Settings</h2>
          <img className="heading-icon" src={settingsIcon} alt="Settings Icon" />
        </div>
        <div className="settings-content-sub-wrapper fadeUp-animation">
          <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
        </div>
        {/* <div className="settings-content-sub-wrapper fadeUp-animation">
          <h2 className="settings-headers">User</h2>
          <hr className="settings-line" />
        </div> */}
      </div>
    </div>
  );

  return (
    <div className="wrapper">
      {isLoading ? <Loader /> : content}
    </div>
  );
};

export default memo(Settings);
