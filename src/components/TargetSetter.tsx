import { useState, useEffect, CSSProperties } from 'react';
import { updateBoardTargetsAPI } from '../utils/apiGatewayClient';
import PulseLoader from "react-spinners/PulseLoader";
import './TargetSetter.css'

const override: CSSProperties = {
  margin: "auto",
  marginTop: "15px",
};

const TargetSetter = ({ title, boards, setBoards }) => {
  // console.log("rendering: TargetSetter")
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });
  const [activeBoard, setActiveBoard] = useState(boards[0] && boards[0].SK);
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    boards.forEach(b => {
      if (activeBoard == b.SK) {
        setFormData({ weekly: b.WTarget, monthly: b.MTarget, yearly: b.YTarget })
      }
    });
  }, [activeBoard])

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value && parseInt(value) }));
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    setActiveBoard(value)
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
    const tmpBoards = [...boards];
    tmpBoards.forEach(b => {
      if (activeBoard == b.SK) {
        b["YTarget"] = formData.yearly;
        b["MTarget"] = formData.monthly;
        b["WTarget"] = formData.weekly;
      }
    });
    updateBoardTargetsAPI(activeBoard, { YTarget: formData.yearly, MTarget: formData.monthly, WTarget: formData.weekly }).then(() => {
      setBoards(tmpBoards)
      setLoadingTargets(false);
    })
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

        <div className="set-targets-board-select-wrapper">
          <label>
            Board
            <select className="set-targets-board-select" onChange={handleSelectChange}>
              {boards.map((b) => {
                return <option key={b.SK} id={b.SK} value={b.SK}>{b.Board}</option>
              })}
            </select>
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
