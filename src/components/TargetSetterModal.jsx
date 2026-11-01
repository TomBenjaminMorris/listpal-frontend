import { useRef, useEffect, memo } from 'react';
import { useOnClickOutside, useScrollLock } from 'usehooks-ts';
import { useEnterToAccept } from '../utils/useEnterToAccept';
import TargetSetter from './TargetSetter';
import './Prompt.css';

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

  // Focus can leave the fields, where the browser's own Enter-to-submit wouldn't fire
  useEnterToAccept(ref, () => ref.current?.querySelector('form')?.requestSubmit(), display);

  useOnClickOutside(ref, () => setDisplay(false));

  if (!display) return null;

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref} role="dialog" aria-modal="true" aria-label="Update board targets">
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
