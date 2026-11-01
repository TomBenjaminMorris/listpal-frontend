import { useRef, useEffect, memo } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts';
import { useEnterToAccept } from '../utils/useEnterToAccept';
import TargetSetter from './TargetSetter';
import './TargetSetterModal.css';

const TargetSetterModal = memo(({ display, setDisplay, boardID, boards, setBoards, setAlertConf }) => {
  const { lock, unlock } = useScrollLock({
    autoLock: false,
    lockTarget: '#scrollable',
  });

  const ref = useRef(null);

  useEffect(() => {
    if (display) {
      lock();
    } else {
      unlock();
    }
  }, [display]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDisplay(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [setDisplay]);

  // No field has focus when the modal opens, so the browser's own Enter-to-submit wouldn't fire
  useEnterToAccept(ref, () => ref.current?.querySelector('form')?.requestSubmit(), display);

  useOnClickOutside(ref, () => setDisplay(false));

  if (!display) return null;

  return (
    <div className="target-setter-modal-external-wrapper fadeInPure-animation">
      <div className="target-setter-modal-inner-wrapper" ref={ref}>
        <TargetSetter
          boardID={boardID}
          boards={boards}
          setBoards={setBoards}
          setAlertConf={setAlertConf}
          handleClose={() => {
            unlock();
            setDisplay(false);
          }}
        />
      </div>
    </div>
  );
});

export default TargetSetterModal;
