import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { Link } from 'react-router-dom';
import backIcon from '../assets/icons8-back-50-white.png';
import './Settings.css';
import TargetSetter from './TargetSetter';
import ThemeSetter from './ThemeSetter';
import SideNavBar from './SideNavBar';
import Header from './Header';

const Settings = ({ userDetails, setUserDetails, isTokenExpired, handleRefreshTokens, getUser, sidebarIsOpen, handleSidebarCollapse, setBoards, setSortedTasks, boards }) => {
  // console.log("rendering: Settings")
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("TTT triggered: handleLogout")
    setBoards([]);
    setSortedTasks([]);
    setUserDetails({})
    sessionStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    document.title = "ListPal | Settings";
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
    } else if (Object.keys(userDetails).length === 0 && userDetails.constructor === Object) {
      getUser().then((u) => {
        setUserDetails(u[0]);
      })
    }
  }, [])

  return (
    <div className="wrapper">
      <Header handleLogout={handleLogout} sidebarIsOpen={sidebarIsOpen} />
      <div className="settings-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
        <SideNavBar sidebarIsOpen={sidebarIsOpen} handleSidebarCollapse={handleSidebarCollapse}
        boards={boards} />
        <div className="settings-content-sub-wrapper">
          <ThemeSetter setUserDetails={setUserDetails} userDetails={userDetails} />
          <TargetSetter userDetails={userDetails} setUserDetails={setUserDetails} title="Set Targets" />
          <TargetSetter userDetails={userDetails} setUserDetails={setUserDetails} title="Edit Current Scores" />
        </div>
      </div>
    </div >
  );
};

export default Settings
