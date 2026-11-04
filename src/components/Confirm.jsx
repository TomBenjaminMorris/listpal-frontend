import { useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { useEnterToAccept } from '../utils/useEnterToAccept';
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

  useEnterToAccept(ref, handleConfirm, confirmConf?.display);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeConfirm();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useOnClickOutside(ref, closeConfirm);

  if (!confirmConf?.display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref} role="alertdialog" aria-modal="true" aria-label={confirmConf.title}>
        <h1>{confirmConf.title}</h1>
        <p>{confirmConf.textValue}</p>
        <div className="prompt-buttons">
          <button className="prompt-button" onClick={handleConfirm}>Confirm</button>
          <button className="prompt-button-cancel" onClick={closeConfirm}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
