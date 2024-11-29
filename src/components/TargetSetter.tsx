import { useState, useEffect, CSSProperties } from 'react';
import { updateBoardTargetsAPI } from '../utils/apiGatewayClient';
import PulseLoader from "react-spinners/PulseLoader";
import './TargetSetter.css'

const override: CSSProperties = {
  margin: "auto",
  marginTop: "23px",
  marginBottom: "12px",
};

const TargetSetter = ({ boards, setBoards, setAlertConf, boardID, handleSave }) => {
  // console.log("rendering: TargetSetter")
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    boards.forEach(b => {
      if (boardID == b.SK) {
        setFormData({ weekly: b.WTarget, monthly: b.MTarget, yearly: b.YTarget })
      }
    });
  }, [boardID])

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value && parseInt(value) }));
  };

  const handleSubmit = (event) => {
    setLoadingTargets(true);
    event.preventDefault();
    if (formData.weekly > formData.monthly) {
      setAlertConf({
        display: true,
        animate: true,
        title: "Notice ⚠️",
        textValue: "Weekly target can't be more than monthly.",
      })
      return;
    }
    if (formData.monthly > formData.yearly) {
      setAlertConf({
        display: true,
        animate: true,
        title: "Notice ⚠️",
        textValue: "Monthly target can't be more than yearly.",
      })
      return;
    }
    const tmpBoards = [...boards];
    tmpBoards.forEach(b => {
      if (boardID == b.SK) {
        b["YTarget"] = formData.yearly;
        b["MTarget"] = formData.monthly;
        b["WTarget"] = formData.weekly;
      }
    });
    updateBoardTargetsAPI(boardID, { YTarget: formData.yearly, MTarget: formData.monthly, WTarget: formData.weekly }).then(() => {
      setBoards(tmpBoards)
      setLoadingTargets(false);
      handleSave();
    })
  };

  return (
    <div className="set-targets-wrapper">
      <h2 className="target-setter-header">Update Board Targets</h2>
      <hr className="settings-line" />
      <form onSubmit={handleSubmit}>
        <div className="set-targets-inputs">
          <label>
            Weekly
            <input
              className="set-targets-input"
              min={0}
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
              min={0}
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
              min={0}
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
