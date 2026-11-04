import { useRef, useEffect, memo } from 'react';
import { useScrollLock } from 'usehooks-ts';
import { useModalControls } from '../utils/useEnterToAccept';
import TargetSetter from './TargetSetter';
import './Prompt.css';

const TargetSetterModal = memo(({ display, setDisplay, boardID, boards, setBoards, setAlertConf }) => {
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable',
  });

  const ref = useRef(null);

  useEffect(() => {
    if (display) lock();
    else unlock();
  }, [display]);

  // Focus can leave the fields, where the browser's own Enter-to-submit wouldn't fire
  useModalControls(ref, {
    accept: () => ref.current?.querySelector('form')?.requestSubmit(),
    close: () => setDisplay(false),
    active: display
  });

  if (!display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref} role="dialog" aria-modal="true" aria-label="Update board targets">
        <TargetSetter
          boardID={boardID}
          boards={boards}
          setBoards={setBoards}
          setAlertConf={setAlertConf}
          handleClose={() => setDisplay(false)}
        />
      </div>
    </div>
  );
});

export default TargetSetterModal;
