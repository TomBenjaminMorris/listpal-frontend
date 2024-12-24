import { useRef, useEffect, useCallback, memo } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts';
import './Prompt.css';

const Confirm = memo(({ confirmConf, setConfirmConf }) => {
  const ref = useRef(null);
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable'
  });

  const closeConfirm = useCallback(() => {
    setConfirmConf({ display: false });
  }, [setConfirmConf]);

  const handleConfirm = useCallback(() => {
    confirmConf.callbackFunc();
    closeConfirm();
  }, [confirmConf, closeConfirm]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") closeConfirm();
  }, [closeConfirm]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    confirmConf?.display ? lock() : unlock();
  }, [confirmConf ]);

  useOnClickOutside(ref, closeConfirm);

  if (!confirmConf?.display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref}>
        <h1>{confirmConf.title}</h1>
        <p>{confirmConf.textValue}</p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", marginBottom: "-10px" }}>
            <button className="prompt-button" onClick={handleConfirm}>Confirm</button>
            <button className="prompt-button-cancel" onClick={closeConfirm}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Confirm;
