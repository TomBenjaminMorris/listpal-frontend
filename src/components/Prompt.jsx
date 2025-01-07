import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts'
import './Prompt.css'

const Prompt = memo(({ promptConf, setPromptConf }) => {
  const ref = useRef(null)
  const [inputText, setInputText] = useState(promptConf && promptConf.defaultText);
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable'
  });

  useEffect(() => {
    if (promptConf?.display) {
      lock();
      setInputText(promptConf.defaultText || '');
    } else {
      unlock();
    }
    return () => unlock();
  }, [promptConf]);


  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [])


  const handleClose = useCallback(() => {
    if (!promptConf?.isEdit) {
      setInputText("");
    }
    setPromptConf({ display: false });
  }, [promptConf?.isEdit, setPromptConf]);


  const handleConfirm = useCallback(() => {
    promptConf?.callbackFunc?.(inputText);
    handleClose();
  }, [promptConf?.callbackFunc, inputText, handleClose]);


  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  }, [handleClose]);


  const handleClickOutside = useCallback(() => {
    handleClose();
  }, [handleClose]);

  useOnClickOutside(ref, handleClickOutside)

  if (!promptConf?.display) return null;

  return (
    <>
      {promptConf && promptConf.display ? <div className="prompt-outer-wrapper fadeInPure-animation">
        <div className="prompt-inner-wrapper" ref={ref}>
          <h1>{promptConf.title}</h1>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input className="prompt-input" type="text" value={inputText} onChange={e => setInputText(e.target.value)} autoFocus />
            <div style={{ display: "flex", flexDirection: "row-reverse", marginBottom: "-10px" }}>
              <button className="prompt-button" onClick={handleConfirm}>Confirm</button>
              <button className="prompt-button-cancel" onClick={handleClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div> : null}
    </>
  );
});

export default Prompt;
