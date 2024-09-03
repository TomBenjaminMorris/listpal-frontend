import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import backIcon from '../assets/icons8-back-50-white.png';
import './Settings.css';
import TargetSetter from './TargetSetter';

const Settings = ({ userDetails, setUserDetails, isTokenExpired, handleRefreshTokens, getUser }) => {
  // console.log("rendering: Settings")

  useEffect(() => {
    if (isTokenExpired()) {
      console.log("TTTT Settings load: token expired, renewing...");
      try {
        handleRefreshTokens().then((t) => {
          getUser().then((u) => {
            setUserDetails(u[0]);
          })
        })
      }
      catch (err) {
        console.error(err);
      }
    }
  }, [])

  return (
    <div className="wrapper">
      <div className="header">
        <div className="header-left">
          <Link className="back-button" to="/home" >
            <img className="back-icon" src={backIcon} alt="back icon" /><div>Back</div>
          </Link>
        </div>
      </div>
      <TargetSetter userDetails={userDetails} setUserDetails={setUserDetails} title="Set Targets"/>   
      <TargetSetter userDetails={userDetails} setUserDetails={setUserDetails} title="Edit Current Scores"/>   

      {/* <div className="set-theme-wrapper">
        <h2 className="settings-headers">Themes</h2>
        <hr className="settings-line" />
        blah
        blah
        blah
      </div> */}
    </div >
  );
};

export default Settings;
