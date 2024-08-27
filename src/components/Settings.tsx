import { useState, useEffect, CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { updateTargetsAPI } from '../utils/apiGatewayClient';
import backIcon from '../assets/icons8-back-50-white.png';
import PulseLoader from "react-spinners/PulseLoader";
import './Settings.css';

const override: CSSProperties = {
  margin: "auto",
  marginTop: "15px",
};

const Settings = ({ userDetails, setUserDetails }) => {
  // console.log("rendering: Settings")
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    userDetails.YTarget && setFormData({ weekly: userDetails.WTarget, monthly: userDetails.MTarget, yearly: userDetails.YTarget })
  }, [userDetails])

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value && parseInt(value) }));
  };

  const handleSubmit = (event) => {
    setLoadingTargets(true);
    event.preventDefault();
    if (formData.weekly > formData.monthly) {
      alert("Weekly target can't be more than monthly target");
      return;
    }
    if (formData.monthly > formData.yearly) {
      alert("Monthly target can't be more than yearly target");
      return;
    }
    const tmpUserDetails = { ...userDetails };
    tmpUserDetails["YTarget"] = formData.yearly;
    tmpUserDetails["MTarget"] = formData.monthly;
    tmpUserDetails["WTarget"] = formData.weekly;
    updateTargetsAPI({ YTarget: formData.yearly, MTarget: formData.monthly, WTarget: formData.weekly }).then(() => {
      setUserDetails(tmpUserDetails);
      setLoadingTargets(false);
    })
  };

  return (
    <div className="wrapper">
      <div className="header">
        <div className="header-left">
          <Link className="back-button" to="/home" >
            <img className="back-icon" src={backIcon} alt="back icon" /><div>Back</div>
          </Link>
        </div>
      </div>

      <div className="set-targets-wrapper">
        <h2 className="settings-headers">Targets</h2>
        <hr className="settings-line" />
        <form onSubmit={handleSubmit}>
          <div className="set-targets-inputs">
            <label>
              Weekly
              <input
                className="set-targets-input"
                min={1}
                max={1000}
                type="number"
                name="weekly"
                placeholder='W'
                value={formData.weekly}
                onChange={handleChange}
              />
            </label>
            <label>
              Monthly
              <input
                className="set-targets-input"
                min={1}
                max={1000}
                type="number"
                name="monthly"
                placeholder='M'
                value={formData.monthly}
                onChange={handleChange}
              />
            </label>
            <label>
              Yearly
              <input
                className="set-targets-input"
                min={1}
                max={1000}
                type="number"
                name="yearly"
                placeholder='Y'
                value={formData.yearly}
                onChange={handleChange}
              />
            </label>
          </div>
          {loadingTargets ? <PulseLoader
            cssOverride={override}
            size={5}
            color={"white"}
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
          /> : <input className="set-targets-submit" type="submit" value="Save" />}
        </form>
      </div>

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
