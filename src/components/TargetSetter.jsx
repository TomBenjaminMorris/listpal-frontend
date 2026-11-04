import { useState, useEffect, memo } from 'react';
import { saveBoardSettings } from '../utils/utils';
import './TargetSetter.css';

const TARGET_FIELDS = [
  { name: 'weekly', label: 'Weekly', placeholder: 'W', dbField: 'WTarget' },
  { name: 'monthly', label: 'Monthly', placeholder: 'M', dbField: 'MTarget' },
  { name: 'yearly', label: 'Yearly', placeholder: 'Y', dbField: 'YTarget' }
];

// The first rule a set of targets breaks, in this order, is the one the alert explains
const TARGET_RULES = [
  {
    broken: ({ WTarget, MTarget, YTarget }) => WTarget < 1 || MTarget < 1 || YTarget < 1,
    title: "Aim a little higher 🎯",
    textValue: "Targets need to be bigger than zero."
  },
  {
    broken: ({ WTarget, MTarget }) => WTarget > MTarget,
    title: "That doesn't add up 🧮",
    textValue: "Your weekly target can't be bigger than your monthly one."
  },
  {
    broken: ({ MTarget, YTarget }) => MTarget > YTarget,
    title: "That doesn't add up 🧮",
    textValue: "Your monthly target can't be bigger than your yearly one."
  }
];

// Inputs hold raw strings so they can be blank while typing
const toNumber = (value) => parseInt(value, 10) || 0;

const TargetSetter = memo(({ boards, setBoards, setAlertConf, boardID, handleClose }) => {
  const [formData, setFormData] = useState({ weekly: 0, monthly: 0, yearly: 0 });

  useEffect(() => {
    const board = boards.find(b => b.SK === boardID);
    if (board) {
      setFormData(Object.fromEntries(TARGET_FIELDS.map(({ name, dbField }) => [name, board[dbField]])));
    }
  }, [boardID, boards]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const targets = Object.fromEntries(TARGET_FIELDS.map(({ name, dbField }) => [dbField, toNumber(formData[name])]));

    const broken = TARGET_RULES.find(rule => rule.broken(targets));
    if (broken) {
      handleClose();
      setAlertConf({ display: true, title: broken.title, textValue: broken.textValue });
      return;
    }

    saveBoardSettings(setBoards, boardID, targets);
    handleClose();
  };

  return (
    <>
      <h1>Update board targets 🎯</h1>
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
                autoFocus={name === 'weekly'}
              />
            </label>
          ))}
        </div>

        <div className="prompt-buttons">
          <button className="prompt-button" type="submit">Save</button>
          <button className="prompt-button-cancel" type="button" onClick={handleClose}>Cancel</button>
        </div>
      </form>
    </>
  );
});

TargetSetter.displayName = 'TargetSetter';

export default TargetSetter;
