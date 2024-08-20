import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import backIcon from '../assets/icons8-back-50-white.png';
import './Settings.css';

const Settings = ({ userDetails, setUserDetails }) => {
  // console.log("rendering: Settings")
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });

  useEffect(() => {
    userDetails.YTarget && setFormData({ weekly: userDetails.WTarget, monthly: userDetails.MTarget, yearly: userDetails.YTarget })
  }, [userDetails])

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: parseInt(value) }));
  };

  const handleSubmit = (event) => {
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
    setUserDetails(tmpUserDetails);
    alert("Targets updated");
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
      
      { userDetails.YTarget && <div className="set-targets-wrapper">
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
          <input className="set-targets-submit" type="submit" value="Save" />
        </form>
      </div> }

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
