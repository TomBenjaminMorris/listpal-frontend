import { useRef, useEffect } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import './Prompt.css';

const Alert = ({ alertConf, setAlertConf }) => {
  const ref = useRef(null);

  const closeAlert = () => {
    setAlertConf({ display: false });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") closeAlert();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useOnClickOutside(ref, closeAlert);

  if (!alertConf?.display) return null;

  return (
    <div className={`prompt-outer-wrapper alert-outer-wrapper ${alertConf.replacesModal ? "" : "fadeInPure-animation"}`}>
      <div className={`prompt-inner-wrapper ${alertConf.replacesModal ? "fadeInPure-animation" : ""}`} ref={ref}>
        <h1>{alertConf.title}</h1>
        <p>{alertConf.textValue}</p>
        <div className="prompt-button-container">
          <div className="prompt-button-wrapper">
            {alertConf.actionLabel ? (
              <>
                <button className="prompt-button" onClick={() => { closeAlert(); alertConf.onAction(); }}>
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
    </div>
  );
};

export default Alert;
