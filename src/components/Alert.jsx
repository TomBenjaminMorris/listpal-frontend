import { useRef } from 'react';
import { useModalControls } from '../utils/useEnterToAccept';
import './Prompt.css';

const Alert = ({ alertConf, setAlertConf }) => {
  const ref = useRef(null);

  const closeAlert = () => {
    setAlertConf({ display: false });
  };

  const handleAccept = () => {
    closeAlert();
    alertConf.onAction?.();
  };

  useModalControls(ref, { accept: handleAccept, close: closeAlert, active: alertConf?.display });

  if (!alertConf?.display) return null;

  return (
    <div className={`prompt-outer-wrapper alert-outer-wrapper ${alertConf.replacesModal ? "" : "fadeInPure-animation"}`}>
      <div className="prompt-inner-wrapper" ref={ref} role="alertdialog" aria-modal="true" aria-label={alertConf.title}>
        <h1>{alertConf.title}</h1>
        <p>{alertConf.textValue}</p>
        <div className="prompt-buttons">
          {alertConf.actionLabel ? (
            <>
              <button className="prompt-button" onClick={handleAccept}>
                {alertConf.actionLabel}
              </button>
              <button className="prompt-button-cancel" onClick={closeAlert}>
                Not now
              </button>
            </>
          ) : (
            <button className="prompt-button" onClick={closeAlert}>
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
