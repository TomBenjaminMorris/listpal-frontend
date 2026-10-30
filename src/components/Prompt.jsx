import React, { useState, useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import './Prompt.css';

const Prompt = ({ promptConf, setPromptConf }) => {

  const ref = useRef(null);
  const [inputText, setInputText] = useState(promptConf?.defaultText || '');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Enter') {
        // Otherwise the same keystroke types a newline into whatever the confirm focuses, such as a new category's first task
        e.preventDefault();
        handleConfirm();
      }
    };

    if (promptConf?.display) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [promptConf, inputText]);

  const handleClose = () => {
    setPromptConf({ display: false });
  };

  const handleConfirm = () => {
    promptConf?.callbackFunc?.(inputText);
    handleClose();
  };

  useOnClickOutside(ref, handleClose);

  if (!promptConf?.display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref}>
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
