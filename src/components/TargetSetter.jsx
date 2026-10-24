import { useState, useEffect, memo } from 'react';
import { updateBoardTargetsAPI } from '../utils/apiGatewayClient';
import PulseLoader from "react-spinners/PulseLoader";
import './TargetSetter.css';

const LOADER_STYLE = {
  margin: "auto",
  marginTop: "23px",
  marginBottom: "12px",
};

const TARGET_FIELDS = [
  { name: 'weekly', label: 'Weekly', placeholder: 'W', dbField: 'WTarget' },
  { name: 'monthly', label: 'Monthly', placeholder: 'M', dbField: 'MTarget' },
  { name: 'yearly', label: 'Yearly', placeholder: 'Y', dbField: 'YTarget' }
];

const TargetSetter = memo(({ boards, setBoards, setAlertConf, boardID, handleClose }) => {
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    const board = boards.find(b => b.SK === boardID);
    if (board) {
      setFormData({
        weekly: board.WTarget,
        monthly: board.MTarget,
        yearly: board.YTarget
      });
    }
  }, [boardID, boards]);

  // Inputs hold raw strings so they can be blank while typing
  const toNumber = (value) => parseInt(value, 10) || 0;

  const validateTargets = () => {
    const weekly = toNumber(formData.weekly);
    const monthly = toNumber(formData.monthly);
    const yearly = toNumber(formData.yearly);

    if (weekly < 1 || monthly < 1 || yearly < 1) {
      handleClose()
      setAlertConf({
        display: true,
        animate: true,
        title: "Notice ⚠️",
        textValue: "Targets must be greater than 0."
      });
      return false;
    }
    if (weekly > monthly) {
      handleClose()
      setAlertConf({
        display: true,
        animate: true,
        title: "Notice ⚠️",
        textValue: "Weekly target can't be more than monthly."
      });
      return false;
    }
    if (monthly > yearly) {
      handleClose()
      setAlertConf({
        display: true,
        animate: true,
        title: "Notice ⚠️",
        textValue: "Monthly target can't be more than yearly."
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateTargets()) return;

    const targets = {
      YTarget: toNumber(formData.yearly),
      MTarget: toNumber(formData.monthly),
      WTarget: toNumber(formData.weekly)
    };

    setLoadingTargets(true);
    try {
      await updateBoardTargetsAPI(boardID, targets);

      setBoards(boards.map(board =>
        board.SK === boardID ? { ...board, ...targets } : board
      ));

      handleClose();
    } catch (error) {
      setAlertConf({
        display: true,
        animate: true,
        title: "Error ❌",
        textValue: "Failed to update targets."
      });
    } finally {
      setLoadingTargets(false);
    }
  };

  return (
    <div className="set-targets-wrapper">
      <h2 className="target-setter-header">Update Board Targets</h2>
      <hr className="settings-line" />
      <form onSubmit={handleSubmit}>
        <div className="set-targets-inputs">
          {TARGET_FIELDS.map(({ name, label, placeholder }) => (
            <label key={name}>
              {label}
              <input
                className="set-targets-input"
                type="number"
                name={name}
                placeholder={placeholder}
                value={formData[name]}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  [name]: e.target.value
                }))}
                min={0}
                max={1000}
              />
            </label>
          ))}
        </div>

        {loadingTargets ? (
          <PulseLoader
            cssOverride={LOADER_STYLE}
            size={5}
            color="var(--text-colour)"
            speedMultiplier={1}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        ) : (
          <input className="set-targets-submit" type="submit" value="Save" />
        )}
      </form>
    </div>
  );
});

TargetSetter.displayName = 'TargetSetter';

export default TargetSetter;
