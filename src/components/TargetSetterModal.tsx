import { useRef, useEffect } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts'
import TargetSetter from './TargetSetter';
import './TargetSetterModal.css'

const TargetSetterModal = ({ display, setDisplay, boardID, boards, setBoards, setAlertConf }) => {
  // console.log("rendering: TargetSetterModal")
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable',
  })

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
  }, [])

  useEffect(() => {
    display ? lock() : unlock()
  }, [display])

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setDisplay(false)
    }
  };

  const ref = useRef(null)
  const handleClickOutside = () => {
    setDisplay(false)
  }
  useOnClickOutside(ref, handleClickOutside)

  return (
    <>
      {display ? <div className="target-setter-modal-external-wrapper fadeInPure-animation">
        <div className="target-setter-modal-inner-wrapper" ref={ref}>
          <TargetSetter boardID={boardID} boards={boards} setBoards={setBoards} setAlertConf={setAlertConf} handleSave={() => setDisplay(false)} />
        </div>
      </div> : null}
    </>
  );
};

export default TargetSetterModal;
