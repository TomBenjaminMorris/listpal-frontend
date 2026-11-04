import { useState, useRef } from 'react';
import { useModalControls } from '../utils/useEnterToAccept';
import './Prompt.css';

const Prompt = ({ promptConf, setPromptConf }) => {
  const ref = useRef(null);
  const [inputText, setInputText] = useState(promptConf?.defaultText || '');

  const handleClose = () => {
    setPromptConf({ display: false });
  };

  const handleConfirm = () => {
    promptConf?.callbackFunc?.(inputText);
    handleClose();
  };

  useModalControls(ref, { accept: handleConfirm, close: handleClose, active: promptConf?.display });

  if (!promptConf?.display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref} role="dialog" aria-modal="true" aria-label={promptConf.title}>
        <h1>{promptConf.title}</h1>
        <div className="prompt-content">
          <input
            className="prompt-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoFocus
          />
          <div className="prompt-buttons">
            <button className="prompt-button" onClick={handleConfirm}>
              Confirm
            </button>
            <button className="prompt-button-cancel" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompt;
