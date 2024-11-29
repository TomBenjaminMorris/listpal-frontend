import { useRef, useEffect } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts'
import './Prompt.css'

const Alert = ({ alertConf, setAlertConf }) => {

  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable',
  })

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
  }, [])

  useEffect(() => {
    alertConf && alertConf.display ? lock() : unlock()
  }, [alertConf])

  const handleCancel = () => {
    const tmpAlertConf = { display: false }
    setAlertConf(tmpAlertConf)
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      const tmpAlertConf = { display: false }
      setAlertConf(tmpAlertConf)
    }
  };

  const ref = useRef(null)
  const handleClickOutside = () => {
    let tmpAlertConf = { display: false }
    setAlertConf(tmpAlertConf)
  }
  useOnClickOutside(ref, handleClickOutside)

  return (
    <>
      {alertConf && alertConf.display ? <div className={`prompt-outer-wrapper ${alertConf.animate ? "fadeInPure-animation" : null}`}>
        <div className="prompt-inner-wrapper" ref={ref}>
          <h1>{alertConf.title}</h1>
          <p>{alertConf.textValue}</p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "row-reverse", marginBottom: "-10px" }}>
              <button className="prompt-button" onClick={handleCancel}>Close</button>
            </div>
          </div>
        </div>
      </div> : null}
    </>
  );
};

export default Alert;
