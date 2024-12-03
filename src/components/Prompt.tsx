import { useState, useRef, useEffect } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts'
import './Prompt.css'

const Prompt = ({ promptConf, setPromptConf }) => {
  const [inputText, setInputText] = useState(promptConf && promptConf.defaultText);
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable',
  })

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
  }, [])

  useEffect(() => {
    promptConf && promptConf.display ? lock() : unlock()
    promptConf && setInputText(promptConf.defaultText)
  }, [promptConf])

  const handleConfirm = () => {
    promptConf.callbackFunc(inputText)
    promptConf.isEdit ? null : setInputText("")
    const tmpPromptConf = { display: false }
    setPromptConf(tmpPromptConf)
  };

  const handleCancel = () => {
    promptConf.isEdit ? null : setInputText("")
    const tmpPromptConf = { display: false }
    setPromptConf(tmpPromptConf)
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      promptConf.isEdit ? null : setInputText("")
      const tmpPromptConf = { display: false }
      setPromptConf(tmpPromptConf)
    }
  };

  const ref = useRef(null)
  const handleClickOutside = () => {
    promptConf.isEdit ? null : setInputText("")
    const tmpPromptConf = { display: false }
    setPromptConf(tmpPromptConf)
  }
  useOnClickOutside(ref, handleClickOutside)

  return (
    <>
      {promptConf && promptConf.display ? <div className="prompt-outer-wrapper fadeInPure-animation">
        <div className="prompt-inner-wrapper" ref={ref}>
          <h1>{promptConf.title}</h1>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input className="prompt-input" type="text" value={inputText} onChange={e => setInputText(e.target.value)} autoFocus />
            <div style={{ display: "flex", flexDirection: "row-reverse", marginBottom: "-10px" }}>
              <button className="prompt-button" onClick={handleConfirm}>Confirm</button>
              <button className="prompt-button-cancel" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      </div> : null}
    </>
  );
};

export default Prompt;
