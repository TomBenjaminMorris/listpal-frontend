import { memo, useEffect } from 'react';
import AccountSettings from './AccountSettings';
import ThemeSetter from './ThemeSetter';
import settingsIcon from '../assets/icons8-settings-50-white.png';
import './Settings.css';
import './PageLayout.css';

const Settings = ({
  userDetails,
  setUserDetails
}) => {

  useEffect(() => {
    document.title = "ListPal | Settings ⚙️";
  }, []);

  return (
    <div className="wrapper">
      <div className="page-content-wrapper">
        <div className="page-content-sub-wrapper">
          <div className="page-title-wrapper fadeUp-animation">
            <h2 className="page-title">User Settings</h2>
            <img className="heading-icon" src={settingsIcon} alt="Settings Icon" />
          </div>
          <div className="settings-content-sub-wrapper fadeUp-animation">
            <AccountSettings />
            <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Settings);
