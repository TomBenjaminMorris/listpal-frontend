import { Link } from 'react-router-dom';
import backIcon from '../assets/icons8-back-50-white.png';
import './Settings.css';
import TargetSetter from './TargetSetter';

const Settings = ({ userDetails, setUserDetails }) => {
  // console.log("rendering: Settings")

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
