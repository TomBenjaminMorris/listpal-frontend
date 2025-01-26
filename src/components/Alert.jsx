import { useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import './Prompt.css';

const Alert = ({ alertConf, setAlertConf }) => {
  // Reference to the modal container for click-outside detection
  const ref = useRef(null);

  // Close the alert modal by updating its configuration
  const closeAlert = () => {
    setAlertConf({ display: false });
  };

  // Handle keyboard events to close modal on Escape key
  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeAlert();
  };

  // Add and remove keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close modal when clicking outside of its container
  useOnClickOutside(ref, closeAlert);

  // Prevent rendering if modal is not set to display
  if (!alertConf?.display) return null;

  return (
    // Conditionally apply animation based on alert configuration
    <div className={`prompt-outer-wrapper ${alertConf.animate ? "fadeInPure-animation" : ""}`}>
      <div className="prompt-inner-wrapper" ref={ref}>
        <h1>{alertConf.title}</h1>
        <p>{alertConf.textValue}</p>
        <div className="prompt-button-container">
          <div className="prompt-button-wrapper">
            <button className="prompt-button" onClick={closeAlert}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
