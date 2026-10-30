import { useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import './Prompt.css';

const Confirm = ({ confirmConf, setConfirmConf }) => {

  const ref = useRef(null);

  const closeConfirm = () => {
    setConfirmConf({ display: false });
  };

  const handleConfirm = () => {
    confirmConf.callbackFunc();
    closeConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeConfirm();
    if (e.key === 'Enter') {
      // As in Prompt: keep the keystroke from reaching whatever has focus once the modal closes
      e.preventDefault();
      handleConfirm();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useOnClickOutside(ref, closeConfirm);

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
