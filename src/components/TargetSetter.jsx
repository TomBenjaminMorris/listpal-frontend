import { useState, useEffect, memo } from 'react';
import { queueBoardUpdate } from '../utils/syncEngine';
import './TargetSetter.css';

const TARGET_FIELDS = [
  { name: 'weekly', label: 'Weekly', placeholder: 'W', dbField: 'WTarget' },
  { name: 'monthly', label: 'Monthly', placeholder: 'M', dbField: 'MTarget' },
  { name: 'yearly', label: 'Yearly', placeholder: 'Y', dbField: 'YTarget' }
];

const TargetSetter = memo(({ boards, setBoards, setAlertConf, boardID, handleClose }) => {
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });

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
        title: "Aim a little higher 🎯",
        textValue: "Targets need to be bigger than zero."
      });
      return false;
    }
    if (weekly > monthly) {
      handleClose()
      setAlertConf({
        display: true,
        title: "That doesn't add up 🧮",
        textValue: "Your weekly target can't be bigger than your monthly one."
      });
      return false;
    }
    if (monthly > yearly) {
      handleClose()
      setAlertConf({
        display: true,
        title: "That doesn't add up 🧮",
        textValue: "Your monthly target can't be bigger than your yearly one."
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateTargets()) return;

    const targets = {
      YTarget: toNumber(formData.yearly),
      MTarget: toNumber(formData.monthly),
      WTarget: toNumber(formData.weekly)
    };

    setBoards(current => current.map(board =>
      board.SK === boardID ? { ...board, ...targets } : board
    ));
    queueBoardUpdate(boardID, targets);
    handleClose();
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

        <input className="set-targets-submit" type="submit" value="Save" />
      </form>
    </div>
  );
});

TargetSetter.displayName = 'TargetSetter';

export default TargetSetter;
