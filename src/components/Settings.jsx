import { memo, useEffect } from 'react';
import AccountSettings from './AccountSettings';
import ThemeSetter from './ThemeSetter';
import RewordToneSetter from './RewordToneSetter';
import './PageLayout.css';

const Settings = ({
  userDetails,
  setUserDetails
}) => {

  useEffect(() => {
    document.title = "ListPal | Settings ⚙️";
  }, []);

  return (
    <div className="page-column fadeUp-animation">
      <h1 className="page-heading">Settings</h1>
      <AccountSettings />
      <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
      <RewordToneSetter setUserDetails={setUserDetails} userDetails={userDetails} />
    </div>
  );
};

export default memo(Settings);
