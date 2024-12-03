import { useRef, useEffect } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts'
import './Prompt.css'

const Confirm = ({ confirmConf, setConfirmConf }) => {

  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable',
  })

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
  }, [])

  useEffect(() => {
    confirmConf && confirmConf.display ? lock() : unlock()
  }, [confirmConf])

  const handleConfirm = () => {
    confirmConf.callbackFunc()
    const tmpConfirmConf = { display: false }
    setConfirmConf(tmpConfirmConf)
  };

  const handleCancel = () => {
    const tmpConfirmConf = { display: false }
    setConfirmConf(tmpConfirmConf)
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      const tmpConfirmConf = { display: false }
      setConfirmConf(tmpConfirmConf)
    }
  };

  const ref = useRef(null)
  const handleClickOutside = () => {
    let tmpConfirmConf = { display: false }
    setConfirmConf(tmpConfirmConf)
  }
  useOnClickOutside(ref, handleClickOutside)

  return (
    <>
      {confirmConf && confirmConf.display ? <div className="prompt-outer-wrapper fadeInPure-animation">
        <div className="prompt-inner-wrapper" ref={ref}>
          <h1>{confirmConf.title}</h1>
          <p>{confirmConf.textValue}</p>
          <div style={{ display: "flex", flexDirection: "column" }}>
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

export default Confirm;
