import { useRef, useEffect, useCallback, memo } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts';
import './Prompt.css';

const Alert = memo(({ alertConf, setAlertConf }) => {
  const ref = useRef(null);
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable'
  });

  const closeAlert = useCallback(() => {
    setAlertConf({ display: false });
  }, [setAlertConf]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") closeAlert();
  }, [closeAlert]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    alertConf?.display ? lock() : unlock();
  }, [alertConf]);

  useOnClickOutside(ref, closeAlert);

  if (!alertConf?.display) return null;

  return (
    <div className={`prompt-outer-wrapper ${alertConf.animate ? "fadeInPure-animation" : ""}`}>
      <div className="prompt-inner-wrapper" ref={ref}>
        <h1>{alertConf.title}</h1>
        <p>{alertConf.textValue}</p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", marginBottom: "-10px" }}>
            <button className="prompt-button" onClick={closeAlert}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Alert;
