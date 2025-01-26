import React, { useState, useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import './Prompt.css';

const Prompt = ({ promptConf, setPromptConf }) => {

  const ref = useRef(null);
  const [inputText, setInputText] = useState(promptConf?.defaultText || '');

  // Handle keyboard and display-related side effects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Enter') handleConfirm();
    };

    // Add/remove keyboard event listener when prompt is displayed
    if (promptConf?.display) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [promptConf, inputText]);

  // Close the prompt without performing any action
  const handleClose = () => {
    setPromptConf({ display: false });
  };

  // Confirm the input by calling the callback function
  const handleConfirm = () => {
    promptConf?.callbackFunc?.(inputText);
    handleClose();
  };

  // Close prompt when clicking outside the prompt area
  useOnClickOutside(ref, handleClose);

  // Don't render anything if prompt is not displayed
  if (!promptConf?.display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref}>
        <h1>{promptConf.title}</h1>
        <div className="prompt-content">
          {/* Controlled input for text entry */}
          <input
            className="prompt-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoFocus
          />
          <div className="prompt-buttons">
            {/* Buttons for confirming or canceling the prompt */}
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
