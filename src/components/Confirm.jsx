import { useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import './Prompt.css';

const Confirm = ({ confirmConf, setConfirmConf }) => {

  const ref = useRef(null);

  // Close the confirmation modal
  const closeConfirm = () => {
    setConfirmConf({ display: false });
  };

  // Handle confirmation action
  const handleConfirm = () => {
    confirmConf.callbackFunc();
    closeConfirm();
  };

  // Handle keyboard events for modal interaction
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeConfirm();
    if (e.key === 'Enter') handleConfirm();
  };

  // Add and remove keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close modal when clicking outside
  useOnClickOutside(ref, closeConfirm);

  // Don't render if modal is not displayed
  if (!confirmConf?.display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref}>
        <h1>{confirmConf.title}</h1>
        <p>{confirmConf.textValue}</p>
        <div className="prompt-button-container">
          <div className="prompt-button-wrapper">
            <button className="prompt-button" onClick={handleConfirm}>Confirm</button>
            <button className="prompt-button-cancel" onClick={closeConfirm}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
