import { useState, useEffect, CSSProperties } from 'react';
import { updateTargetsAPI, updateScoresAPI } from '../utils/apiGatewayClient';
import PulseLoader from "react-spinners/PulseLoader";
import './TargetSetter.css'

const override: CSSProperties = {
  margin: "auto",
  marginTop: "15px",
};

const TargetSetter = ({ userDetails, setUserDetails, title }) => {
  // console.log("rendering: TargetSetter")
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    if (title === "Set Targets") {
      userDetails.YTarget && setFormData({ weekly: userDetails.WTarget, monthly: userDetails.MTarget, yearly: userDetails.YTarget })
    } else if (title === "Edit Current Scores") {
      userDetails.YTarget && setFormData({ weekly: userDetails.WScore, monthly: userDetails.MScore, yearly: userDetails.YScore })
    }
  }, [userDetails])

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value && parseInt(value) }));
  };

  const handleSubmit = (event) => {
    setLoadingTargets(true);
    event.preventDefault();
    if (formData.weekly > formData.monthly) {
      alert("Weekly can't be more than monthly");
      return;
    }
    if (formData.monthly > formData.yearly) {
      alert("Monthly can't be more than yearly");
      return;
    }
    const tmpUserDetails = { ...userDetails };
    if (title === "Set Targets") {
      tmpUserDetails["YTarget"] = formData.yearly;
      tmpUserDetails["MTarget"] = formData.monthly;
      tmpUserDetails["WTarget"] = formData.weekly;
      updateTargetsAPI({ YTarget: formData.yearly, MTarget: formData.monthly, WTarget: formData.weekly }).then(() => {
        setUserDetails(tmpUserDetails);
        setLoadingTargets(false);
      })
    } else if (title === "Edit Current Scores") {
      tmpUserDetails["YScore"] = formData.yearly;
      tmpUserDetails["MScore"] = formData.monthly;
      tmpUserDetails["WScore"] = formData.weekly;
      updateScoresAPI({ YScore: formData.yearly, MScore: formData.monthly, WScore: formData.weekly }).then(() => {
        setUserDetails(tmpUserDetails);
        setLoadingTargets(false);
      })
    }
  };

  return (
    <div className="set-targets-wrapper">
      <h2 className="settings-headers">{title}</h2>
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
          color={"var(--text-colour)"}
          speedMultiplier={1}
          aria-label="Loading Spinner"
          data-testid="loader"
        /> : <input className="set-targets-submit" type="submit" value="Save" />}
      </form>
    </div>
  );
};

export default TargetSetter;
